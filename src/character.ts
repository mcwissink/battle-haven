import { Animator } from './animator';
import { animation, EntityData } from './data-loader';
import { Effect, Entity, State } from "./entity";
import { BH } from './main';
import { Diamond, Mechanics } from './mechanics';
import { Sprite } from './sprite';

type CharacterFrameData = any;
type CharacterFrame = number;

export class Character extends Entity<CharacterFrameData, CharacterFrame> {
    animator = new Animator();
    catching: Entity | null = null;
    constructor(public port: number, private data: EntityData) {
        const doubleJump = () => {
            if (this.controller.stickY > 0 || this.frameData.state === State.doubleJumping) {
                this.mechanics.velocity[0] = (this.controller.stickDirectionX || this.direction) * 20;
                this.mechanics.velocity[1] = 20;
                return animation.drop;
            } else {
                return animation.double_jump;
            }
        };
        const fall = () => {
            this.mechanics.isGrounded = false;
            this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2);
        };
        super(
            new Mechanics(new Diamond(20, 40), { position: [350, 100] }),
            new Diamond(10, 42),
            new Sprite(data.spriteSheet),
            data.data.frame,
            {
                system: {
                    land: ({ vy }) => {
                        if (this.frameData.state === State.falling || this.frameData.state === State.burning) {
                            if (vy > 6) {
                                this.mechanics.force(-2, 1);
                            } else {
                                this.next.setFrame(this.direction !== Math.sign(this.mechanics.velocity[0]) ? 230 : 231, 1);
                            }
                        } else {
                            this.next.setFrame(animation.crouch, 1)
                        }
                    },
                    catching: ({ entity }) => {
                        this.catching = entity;
                    },
                    hit: ({ dvx, dvy, effect }) => {
                        const isDefending = this.frameData.state === State.defend;
                        this.hitStop = BH.config.hitStop * 2;
                        if (dvx) {
                            this.mechanics.force(dvx * (isDefending ? 0.4 : 1));
                        }
                        if ((dvy && !isDefending) || !this.mechanics.isGrounded) {
                            this.mechanics.force(dvy ?? 0, 1);
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
                                    this.next.setFrame(animation.fire, 3);
                                    break;
                            }
                        }
                    }
                },
                [State.attacks]: {
                    combo: {
                        hit_j: animation.dash,
                    },
                },
                [State.ice]: {
                    hit: () => {
                        fall();
                    },
                },
                [State.standing]: {
                    fall: () => this.next.setFrame(animation.airborn),
                    combo: {
                        hit_a: () => Math.random() > 0.5 ? animation.punch : 65,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_F: animation.running,
                        hit_D: animation.crouch,
                        hit_DF: animation.walking,
                        hit_ja: animation.walking,
                    },
                    update: () => {
                        this.next.direction = this.controller.stickDirectionX;
                        if (this.controller.stickX) {
                            this.next.setFrame(animation.running);
                        }
                        if (!this.mechanics.isGrounded) {
                            this.next.setFrame(animation.airborn);
                        }
                    },
                },
                [State.walking]: {
                    fall: () => this.next.setFrame(animation.airborn, 1),
                    combo: {
                        hit_a: animation.punch,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_D: animation.crouch,
                        hit_DF: animation.walking,
                    },
                    nextFrame: () => this.animator.oscillate(5, 8),
                    update: () => {
                        this.mechanics.force(this.direction * this.data.data.bmp.walking_speed);
                        this.next.direction = this.controller.stickDirectionX;
                        if (!this.controller.stickDirectionX) {
                            this.next.setFrame(animation.standing);
                        }
                    },
                },
                [State.running]: {
                    resetComboBuffer: true,
                    fall: () => this.next.setFrame(animation.airborn, 1),
                    combo: {
                        hit_a: 85,
                        hit_d: 102,
                        hit_j: animation.dash,
                    },
                    nextFrame: () => this.animator.oscillate(9, 11),
                    update: () => {
                        this.mechanics.force(this.direction * this.data.data.bmp.running_speed);
                        this.next.direction = this.controller.stickDirectionX;
                        if (!this.controller.stickDirectionX) {
                            this.next.setFrame(animation.stop_running);
                        }
                    },
                },
                [State.jumping]: {
                    combo: {
                        hit_j: doubleJump,
                        hit_a: animation.jump_attack,
                    },
                    update: () => {
                        this.mechanics.force(this.controller.stickDirectionX * this.data.data.bmp.walking_speedz, 0, 1);
                    },
                },
                [State.doubleJumping]: {
                    combo: {
                        hit_a: animation.jump_attack,
                        hit_j: doubleJump,
                    },
                    update: () => {
                        this.mechanics.force(this.controller.stickDirectionX * this.data.data.bmp.walking_speedz, 0, 1);
                    },
                },
                [State.drop]: {
                    combo: {
                        hit_a: animation.dash_attack,
                    },
                    update: () => {
                        this.next.direction = Math.sign(this.mechanics.velocity[0]);
                        this.mechanics.force(this.controller.stickDirectionX * this.data.data.bmp.walking_speedz, 0, 1);
                        this.mechanics.velocity[0] *= 0.9;
                    },
                },
                [State.dash]: {
                    combo: {
                        hit_a: animation.dash_attack,
                        hit_j: doubleJump,
                    },
                    update: () => {
                        const direction = this.controller.stickDirectionX || this.direction;
                        if (direction !== this.direction && this.frame !== 214) {
                            this.next.setFrame(214, 0, direction);
                        }
                        this.mechanics.force(this.controller.stickDirectionX * this.data.data.bmp.walking_speedz, 0, 1);
                    },
                },
                [State.defend]: {
                    hit: ({ dvy }) => {
                        this.hitStop = BH.config.hitStop * 2;
                        if (dvy && dvy < 0) {
                            this.next.setFrame(animation.broken_defend, 3);
                        } else {
                            this.next.setFrame(animation.defend, 3);
                        }
                    },
                    update: () => {
                        this.next.direction = this.controller.stickDirectionX;
                    },
                },
                [State.crouching]: {
                    fall: () => this.next.setFrame(animation.airborn),
                    update: () => {
                        this.mechanics.force(-this.mechanics.velocity[0] * 0.3);
                        this.next.direction = this.controller.stickDirectionX;
                    },
                },
                [State.lying]: {
                    fall: () => this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2),
                },
                [State.injured]: {
                    fall: () => this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2),
                    hit: () => {
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
                    nextFrame: () => {
                        return this.animator.oscillate(203, 204);
                    },
                },
                [State.catching]: {
                    combo: {
                        hit_a: () => {
                            this.next.direction = this.controller.stickDirectionX;
                            return 232;
                        },
                    },
                    update: () => {
                        if (this.catching && this.frameData.cpoint) {
                            const [x, y] = this.getFrameElementPosition(this.frameData.cpoint);
                            this.catching.mechanics.position[0] = this.mechanics.position[0] + x;
                            this.catching.mechanics.position[1] = this.mechanics.position[1] + y;
                            this.catching.next.direction = this.direction * -1;
                            if (this.frameData.cpoint.throwvx) {
                                this.catching.mechanics.force(this.frameData.cpoint.throwvx * this.direction, 0, Infinity);
                            }
                            if (this.frameData.cpoint.throwvy) {
                                this.catching.mechanics.force(this.frameData.cpoint.throwvy, 1, Infinity);
                            }
                            this.catching.next.setFrame(this.frameData.cpoint.vaction, 5);
                        }
                    }
                }
            },
        );
    }

    transition(frame: CharacterFrame, nextFrame: CharacterFrame) {
        // Frame specific updates
        // Jump
        if (frame === 211 && nextFrame === 212) {
            this.mechanics.force(this.data.data.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || this.controller.stickDirectionX));
            this.mechanics.velocity[1] = this.data.data.bmp.jump_height;
        }
        // Dash
        if (nextFrame === animation.dash) {
            const direction = Math.sign(this.mechanics.velocity[0]) || this.direction;
            this.mechanics.force(this.data.data.bmp.dash_distance * direction);
            this.mechanics.velocity[1] = this.data.data.bmp.dash_height;
            this.next.direction = direction;
        }
        // Double-jump
        if (nextFrame === animation.double_jump) {
            const direction = this.controller.stickDirectionX;
            const multiplier = Math.sign(this.mechanics.velocity[0]) === direction ? 0.7 : 0.3;
            this.mechanics.velocity[0] = Math.abs(this.mechanics.velocity[0] * multiplier) * direction;
            this.mechanics.velocity[1] = this.data.data.bmp.jump_height * 1.1;
        }
    }
}
