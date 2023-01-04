import { Animator } from './animator';
import { animation, EntityData } from './data-loader';
import { Effect, Entity, EventHandlers, State } from "./entity";
import { BH, gameOverMenu } from './main';
import { Diamond, Mechanics } from './mechanics';
import { Sprite } from './sprite';

type CharacterFrameData = any;
type CharacterFrame = number;

export class Character extends Entity<CharacterFrameData, CharacterFrame> {
    type = 'character';
    animator = new Animator();
    catching: Entity | null = null;
    constructor(public port: number, public data: EntityData) {
        const doubleJump = () => {
            if (this.controller.stickY > 0) {
                return animation.drop
            } else {
                return animation.double_jump;
            }
        };

        const fall = () => {
            this.mechanics.isGrounded = false;
            this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2);
        };

        const airMove = () => this.mechanics.force(this.controller.stickDirectionX * this.data.data.bmp.walking_speedz, 0, 1);

        const land = () => this.next.setFrame(animation.crouch, 1);

        const landInjured: EventHandlers['land'] = ({ vy }) => {
            if (vy > 6) {
                this.mechanics.force(-2, 1);
            } else {
                this.next.setFrame(this.direction !== Math.sign(this.mechanics.velocity[0]) ? 230 : 231, 1);
            }
        }

        const catching: EventHandlers['catching'] = ({ entity }) => {
            this.catching = entity;
            this.catching.next.direction = this.direction * -1;
        }

        const hit: EventHandlers['attacked'] = ({ dvx, dvy: dvyBase = 0, effect, injury }) => {
            const dvy = (this.frame >= 223 && this.frame <= 226 ? -10 : dvyBase);
            this.health -= injury
            this.hitStop = BH.config.hitStop * 2;
            this.mechanics.velocity[0] *= 0.7;
            this.mechanics.velocity[1] *= 0.7;
            if (dvx) {
                this.mechanics.force(dvx);
            }
            if (dvy || !this.mechanics.isGrounded) {
                this.mechanics.force(dvy, 1);
                fall();
            } else {
                this.next.setFrame(animation.injured);
            }
            if (effect) {
                switch (effect) {
                    case Effect.ice:
                        this.next.setFrame(animation.ice, 3);
                        break;
                    case Effect.fire:
                        // this.next.setFrame(animation.fire, 3);
                        break;
                }
            }
        }

        const noop = () => { };

        super(
            new Mechanics(new Diamond(20, 40), { position: [350, 100] }),
            new Diamond(10, 42),
            new Sprite(data.spriteSheet),
            data.data.frame,
            {
                default: {
                    killed: () => {
                        BH.openMenu(gameOverMenu);
                    },
                    attacked: hit,
                    land,
                },
                [State.attacks]: {
                    combo: {
                        hit_j: animation.dash_go,
                    },
                    update: () => {
                        if (!this.mechanics.isGrounded) {
                            airMove();
                        }
                    }
                },
                [State.dashGo]: {
                    enter: () => {
                        this.mechanics.isGrounded = false;
                        this.mechanics.force(this.data.data.bmp.dash_distance * this.direction);
                        this.mechanics.velocity[1] = this.data.data.bmp.dash_height * 0.5;
                    },
                    attacking: () => {
                        this.next.setFrame(animation.double_jump);
                    },
                },
                [State.ice]: {
                    land: noop,
                    attacked: ({ effect, ...data }) => {
                        hit(data);
                        fall()
                    },
                },
                [State.standing]: {
                    enter: () => {
                        if (!this.mechanics.isGrounded) {
                            this.next.setFrame(animation.airborn);
                        }
                    },
                    fall: () => this.next.setFrame(animation.airborn),
                    combo: {
                        hit_a: animation.punch,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_F: animation.running,
                        hit_DF: animation.walking,
                        hit_ja: animation.walking,
                    },
                    update: () => {
                        this.next.setDirectionFromValue(this.controller.stickDirectionX);
                        if (this.controller.stickX) {
                            this.next.setFrame(animation.running);
                        }
                    },
                },
                [State.walking]: {
                    fall: () => this.next.setFrame(animation.airborn, 1),
                    catching,
                    combo: {
                        hit_a: animation.punch,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_DF: animation.walking,
                    },
                    nextFrame: () => this.animator.oscillate(5, 8),
                    update: () => {
                        this.mechanics.force(this.direction * this.data.data.bmp.walking_speed);
                        this.next.setDirectionFromValue(this.controller.stickDirectionX)
                        if (!this.controller.stickDirectionX) {
                            this.next.setFrame(animation.standing);
                        }
                    },
                },
                [State.running]: {
                    enter: () => this.controller.clearComboBuffer(),
                    fall: () => this.next.setFrame(animation.airborn, 1),
                    combo: {
                        hit_a: 85,
                        hit_d: 102,
                        hit_j: animation.dash,
                    },
                    nextFrame: () => this.animator.oscillate(9, 11),
                    update: () => {
                        this.mechanics.force(this.direction * this.data.data.bmp.running_speed);
                        this.next.setDirectionFromValue(this.controller.stickDirectionX)
                        if (!this.controller.stickDirectionX) {
                            this.next.setFrame(animation.stop_running);
                        }
                    },
                },
                [State.jumping]: {
                    enter: (previousFrame) => {
                        if (previousFrame === 211) {
                            this.mechanics.force(this.data.data.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || this.controller.stickDirectionX));
                            this.mechanics.velocity[1] = this.data.data.bmp.jump_height;
                        }
                    },
                    combo: {
                        hit_d: animation.drop,
                        hit_j: doubleJump,
                        hit_a: animation.jump_attack,
                    },
                    update: airMove,
                },
                [State.doubleJumping]: {
                    enter: () => {
                        const direction = this.controller.stickDirectionX;
                        const multiplier = Math.sign(this.mechanics.velocity[0]) === direction ? 0.7 : 0.3;
                        this.mechanics.velocity[0] = Math.abs(this.mechanics.velocity[0] * multiplier) * direction;
                        this.mechanics.velocity[1] = this.data.data.bmp.jump_height * 1.1;
                    },
                    combo: {
                        hit_d: animation.drop,
                        hit_a: animation.jump_attack,
                        hit_j: animation.drop,
                    },
                    update: airMove,
                },
                [State.drop]: {
                    enter: () => {
                        this.mechanics.velocity[0] = (this.controller.stickDirectionX || this.direction) * 20;
                        this.mechanics.velocity[1] = 20;
                    },
                    combo: {
                        hit_a: animation.dash_attack,
                    },
                    update: () => {
                        airMove();
                        this.next.setDirectionFromValue(Math.sign(this.mechanics.velocity[0]))
                    },
                },
                [State.dash]: {
                    enter: () => {
                        if (this.frame === animation.dash) {
                            this.mechanics.isGrounded = false;
                            this.mechanics.force(this.data.data.bmp.dash_distance * this.direction);
                            this.mechanics.velocity[1] = this.data.data.bmp.dash_height;
                        }
                    },
                    combo: {
                        hit_d: animation.drop,
                        hit_a: animation.dash_attack,
                        hit_j: doubleJump,
                    },
                    update: () => {
                        airMove();
                        const direction = this.controller.stickDirectionX || this.direction;
                        if (direction !== this.direction && this.frame !== 214) {
                            this.next.setFrame(214, 0, direction);
                        }
                    },
                },
                [State.defend]: {
                    attacked: ({ dvx, dvy }) => {
                        this.hitStop = BH.config.hitStop * 2;
                        if (dvx) {
                            this.mechanics.force(dvx * 0.4);
                        }
                        if (dvy && dvy < 0) {

                            this.next.setFrame(animation.broken_defend, 3);
                        } else {
                            this.next.setFrame(animation.defend, 3);
                        }
                    },
                    update: () => {
                        this.next.setDirectionFromValue(this.controller.stickDirectionX)
                    },
                },
                [State.crouching]: {
                    fall: () => this.next.setFrame(animation.airborn),
                    update: () => {
                        this.mechanics.velocity[0] *= 0.8;
                        this.next.setDirectionFromValue(this.controller.stickDirectionX)
                    },
                },
                [State.lying]: {
                    fall: () => this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2),
                },
                [State.injured]: {
                    fall: () => this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2),
                    attacked: (data) => {
                        hit(data);
                        if (this.frame < 222) {
                            this.next.setFrame(222, 1);
                        } else if (this.frame < 224, 1) {
                            this.next.setFrame(224, 1);
                        } else if (this.frame < 226) {
                            this.next.setFrame(224, 1);
                        }
                    }
                },
                [State.falling]: {
                    land: landInjured,
                    nextFrame: () => {
                        if (this.direction !== Math.sign(this.mechanics.velocity[0])) {
                            if (this.mechanics.velocity[1] > 6) {
                                return 183;
                            } else if (this.mechanics.velocity[1] > 0) {
                                return 182;
                            } else if (this.mechanics.velocity[1] > -6) {
                                return 181;
                            }
                            return 180;
                        } else {
                            if (this.mechanics.velocity[1] > 6) {
                                return 189;
                            } else if (this.mechanics.velocity[1] > 0) {
                                return 188;
                            } else if (this.mechanics.velocity[1] > -6) {
                                return 187;
                            }
                            return 186;
                        }
                    },
                },
                [State.burning]: {
                    land: landInjured,
                },
                [State.caught]: {
                    noMechanics: true,
                    land: noop,
                    attacked: noop,
                },
                [State.fireRunning]: {
                    fall: () => this.next.setFrame(animation.airborn),
                },
                [State.catching]: {
                    catching,
                    leave: () => {
                        if (this.catching && this.frameData.cpoint) {
                            this.catching?.next.setFrame(animation.falling, 5);
                            this.catching = null;
                        }
                    },
                    update: () => {
                        if (this.catching && this.frameData.cpoint?.kind === 1) {
                            const [x, y] = this.getFrameElementPosition(this.frameData.cpoint);
                            this.catching.mechanics.position[0] = this.mechanics.position[0] + x;
                            this.catching.mechanics.position[1] = this.mechanics.position[1] + y;
                            if (this.frameData.cpoint.throwvx) {
                                this.catching.mechanics.force(this.frameData.cpoint.throwvx * this.direction, 0, Infinity);
                            }
                            if (this.frameData.cpoint.throwvy) {
                                this.catching.mechanics.force(this.frameData.cpoint.throwvy, 1, Infinity);
                            }
                            this.catching.next.setFrame(this.frameData.cpoint.vaction);
                            if (this.frameData.cpoint.taction && this.controller.stickDirectionX && this.controller.attack) {
                                this.next.setFrame(Math.abs(this.frameData.cpoint.taction) * this.direction * this.controller.stickDirectionX);
                            }
                        }
                    }
                }
            },
            22,
        );
    }
}
