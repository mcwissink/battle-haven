import { Animator } from './animator';
import { Entity, State } from "./entity";
import { BH } from './main';
import { Diamond, Mechanics } from './mechanics';
import { modifyData } from './modify-data';
import { Sprite } from './sprite';
import { woody } from './woody';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';

const character = woody;

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source;
    return image;
};

const testImages = ['./woody_0.png', './woody_1.png', './woody_2.png'].map(loadImage);

type CharacterFrameData = typeof character.frame;
type CharacterFrame = keyof CharacterFrameData;

modifyData(character);

const animation = Object.entries(character.frame).reduce<Record<string, CharacterFrame>>((acc, [frame, data]) => {
    if (!acc[data.name]) {
        acc[data.name] = (Number(frame) || 999) as CharacterFrame;
    }
    return acc;
}, {
    airborn: 212,
});

// Fix types, any should be CharacterFrameData
export class Character extends Entity<any, CharacterFrame> {
    animator = new Animator<CharacterFrameData>();
    constructor(public port: number) {
        const doubleJump = () => {
            if (this.controller.stickY > 0 || this.frameData.state === State.doubleJumping) {
                this.mechanics.velocity[0] = (this.controller.stickDirectionX || this.direction) * 20;
                this.mechanics.velocity[1] = 20;
                return animation.drop;
            } else {
                return animation.double_jump;
            }
        };
        super(
            new Mechanics(new Diamond(20, 40), { position: [350, 100] }),
            new Diamond(10, 42),
            new Sprite({
                images: testImages,
                width: 80,
                height: 80,
                rows: 7,
                columns: 10,
            }),
            character.frame,
            {
                system: {
                    land: ({ vy }) => {
                        if (this.frameData.state === State.falling) {
                            if (vy > 6) {
                                this.mechanics.force(-2, 1);
                            } else {
                                this.next.setFrame(this.direction !== Math.sign(this.mechanics.velocity[0]) ? 230 : 231, 1);
                            }
                        } else {
                            this.next.setFrame(animation.crouch, 1)
                        }
                    },
                    hit: ({ dvx, dvy }) => {
                        const isDefending = this.frameData.state === State.defend;
                        this.hitStop = BH.config.hitStop * 2;
                        if (dvx) {
                            this.mechanics.force(dvx * (isDefending ? 0.4 : 1));
                        }
                        if ((dvy && !isDefending) || !this.mechanics.isGrounded) {
                            this.mechanics.force(dvy ?? 0, 1);
                            this.mechanics.isGrounded = false;
                            this.next.setFrame(this.states[State.falling]!.nextFrame!(), 2);
                        } else {
                            this.next.setFrame(animation.injured);
                        }
                    }
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
                    },
                    update: () => {
                        this.next.direction = this.controller.stickDirectionX;
                        if (this.controller.stickX) {
                            this.next.setFrame(animation.running);
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
                        this.mechanics.force(this.direction * character.bmp.walking_speed);
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
                        this.mechanics.force(this.direction * character.bmp.running_speed);
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
                        this.mechanics.force(this.controller.stickDirectionX * character.bmp.walking_speedz, 0, 1);
                    },
                },
                [State.doubleJumping]: {
                    combo: {
                        hit_a: animation.jump_attack,
                        hit_j: doubleJump,
                    },
                    update: () => {
                        this.mechanics.force(this.controller.stickDirectionX * character.bmp.walking_speedz, 0, 1);
                    },
                },
                [State.drop]: {
                    combo: {
                        hit_a: animation.dash_attack,
                    },
                    update: () => {
                        this.next.direction = Math.sign(this.mechanics.velocity[0]);
                        this.mechanics.force(this.controller.stickDirectionX * character.bmp.walking_speedz, 0, 1);
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
                        this.mechanics.force(this.controller.stickDirectionX * character.bmp.walking_speedz, 0, 1);
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
            },
        );
    }

    transition(frame: CharacterFrame, nextFrame: CharacterFrame) {
        // Frame specific updates
        // Jump
        if (frame === 211 && nextFrame === 212) {
            this.mechanics.force(character.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || this.controller.stickDirectionX));
            this.mechanics.velocity[1] = character.bmp.jump_height;
        }
        // Dash
        if (nextFrame === animation.dash) {
            const direction = Math.sign(this.mechanics.velocity[0]);
            this.mechanics.force(character.bmp.dash_distance * direction);
            this.mechanics.velocity[1] = character.bmp.dash_height;
            this.next.direction = direction;
        }
        // Double-jump
        if (nextFrame === animation.double_jump) {
            const direction = this.controller.stickDirectionX;
            const multiplier = Math.sign(this.mechanics.velocity[0]) === direction ? 0.7 : 0.3;
            this.mechanics.velocity[0] = Math.abs(this.mechanics.velocity[0] * multiplier) * direction;
            this.mechanics.velocity[1] = character.bmp.jump_height * 1.1;
        }
    }
}
