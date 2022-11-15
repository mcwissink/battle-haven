import { Animator } from './animator';
import { config } from './config';
import { controllers } from './controller';
import { Entity, State } from "./entity";
import { Mechanics, Rectangle } from './mechanics';
import { Sprite } from './sprite';
import { woody } from './woody';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source;
    return image;
};

const testImages = ['./woody_0.png', './woody_1.png', './woody_2.png'].map(loadImage);

type CharacterFrameData = typeof woody.frame;
type CharacterFrame = keyof CharacterFrameData;

const animation = Object.entries(woody.frame).reduce<Record<string, CharacterFrame>>((acc, [frame, data]) => {
    if (!acc[data.name]) {
        acc[data.name] = (Number(frame) || 999) as CharacterFrame;
    }
    // Unsafely modify frame data
    // Eventually frames should be pre-processed
    {
        const unsafeData = data as any;
        if ('itr' in unsafeData) {
            unsafeData.itr = Array.isArray(unsafeData.itr) ? unsafeData.itr : [unsafeData.itr];
        }
        if ('bdy' in unsafeData) {
            unsafeData.bdy = Array.isArray(unsafeData.bdy) ? unsafeData.bdy : [unsafeData.bdy];
        }
        unsafeData.centerx++;
        unsafeData.centery++;
    }
    return acc;
}, {
    airborn: 212,
});

// Fix types, any should be CharacterFrameData
export class Character extends Entity<any, CharacterFrame> {
    animator = new Animator<CharacterFrameData>();
    constructor(public port: number) {
        super(
            new Mechanics(new Rectangle(20, 40), { position: [100, 100] }),
            new Rectangle(10, 42),
            new Sprite({
                images: testImages,
                width: 80,
                height: 80,
                rows: 7,
                columns: 10,
            }),
            woody.frame,
            {
                system: {
                    landed: ({ vy }) => {
                        if (this.frameData.state === State.falling) {
                            if (vy > 6) {
                                this.mechanics.force(-2, 1);
                            } else {
                                this.next.setFrame(animation.lying, 1)
                            }
                        } else {
                            this.next.setFrame(animation.crouch, 1)
                        }
                    },
                    hit: ({ dvx, dvy }) => {
                        this.hitStop = config.hitStop;
                        if (dvx) {
                            this.mechanics.force(dvx);
                        }
                        if (dvy) {
                            this.mechanics.force(dvy, 1);
                            if (dvy < 0 || !this.mechanics.isGrounded) {
                                this.mechanics.isGrounded = false;
                                this.next.setFrame(180, 2);
                            }
                        } else {
                            this.next.setFrame(animation.injured);
                        }
                    }
                },
                [State.standing]: {
                    combo: {
                        hit_a: animation.punch,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_F: animation.running,
                        hit_D: animation.crouch,
                        hit_DF: animation.walking,
                    },
                    update: ({ state: controller }) => {
                        this.direction = Math.sign(controller.stickX) || this.direction;
                        if (controller.stickX) {
                            this.next.setFrame(animation.running);
                        }
                        if (!this.mechanics.isGrounded) {
                            this.next.setFrame(animation.airborn)
                        }
                    },
                },
                [State.walking]: {
                    combo: {
                        hit_a: animation.punch,
                        hit_d: animation.defend,
                        hit_j: animation.jump,
                        hit_D: animation.crouch,
                        hit_DF: animation.walking,
                    },
                    nextFrame: () => this.animator.oscillate(5, 8),
                    update: ({ state: controller }) => {
                        this.mechanics.force(this.direction * woody.bmp.walking_speed);
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        } else {
                            this.next.setFrame(animation.standing);
                        }

                        if (!this.mechanics.isGrounded) {
                            this.next.setFrame(animation.airborn, 1)
                        }
                    },
                },
                [State.running]: {
                    combo: {
                        hit_a: 85,
                        hit_d: 102,
                        hit_j: animation.dash,
                    },
                    nextFrame: () => this.animator.oscillate(9, 11),
                    update: ({ state: controller }) => {
                        this.mechanics.force(this.direction * woody.bmp.running_speed);
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        } else {
                            this.next.setFrame(animation.stop_running);
                        }

                        if (!this.mechanics.isGrounded) {
                            this.next.setFrame(animation.airborn, 1)
                        }
                    },
                },
                [State.jumping]: {
                    combo: {
                        hit_j: animation.double_jump,
                        hit_a: animation.jump_attack,
                    },
                    update: ({ state: controller }) => {
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        }
                        // this.mechanics.force(Math.sign(controller.stickX) * woody.bmp.air_speed);
                    },
                },
                [State.doubleJumping]: {
                    combo: {
                        hit_a: animation.jump_attack,
                    },
                    update: ({ state: controller }) => {
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        }
                        this.mechanics.force(this.direction * woody.bmp.air_speed);
                    },
                },
                [State.dash]: {
                    combo: {
                        hit_a: animation.dash_attack,
                        hit_j: animation.double_jump,
                    },
                    update: ({ state: controller }) => {
                        const direction = Math.sign(controller.stickX) || this.direction;
                        if (direction !== this.direction && this.frame !== 214) {
                            this.next.setFrame(214, 0, direction);
                        }
                    },
                },
                [State.defend]: {
                    update: ({ state: controller }) => {
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        }
                    },
                },
                [State.crouching]: {
                    update: ({ state: controller }) => {
                        this.mechanics.force(-this.mechanics.velocity[0] * 0.3);
                        if (controller.stickX) {
                            this.direction = Math.sign(controller.stickX);
                        }
                        if (controller.stickY > 0) {
                            this.next.setFrame(animation.crouch);
                        }
                    },
                },
                [State.injured]: {
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
                        if (this.mechanics.velocity[1] > 6) {
                            return 183;
                        } else if (this.mechanics.velocity[1] > 0) {
                            return 182;
                        } else if (this.mechanics.velocity[1] > -6) {
                            return 181;
                        }
                        return 180;
                    },
                    update: () => {
                        const direction = Math.sign(this.mechanics.velocity[0]);
                        if (direction) {
                            this.direction = -direction;
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
            this.mechanics.force(woody.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || Math.sign(controllers.get(this.port).state.stickX)));
            this.mechanics.velocity[1] = woody.bmp.jump_height;
        }
        // Dash
        if (nextFrame === animation.dash) {
            this.mechanics.force(woody.bmp.dash_distance * Math.sign(this.mechanics.velocity[0]));
            this.mechanics.velocity[1] = woody.bmp.dash_height;
        }
        // Double-jump
        if (nextFrame === animation.double_jump) {
            this.mechanics.velocity[0] = Math.abs(this.mechanics.velocity[0] / 2) * Math.sign(controllers.get(this.port).state.stickX);
            this.mechanics.velocity[1] = woody.bmp.jump_height;
        }
    }
}
