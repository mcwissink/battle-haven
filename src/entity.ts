import { keyboardControllers, Controller, ControllerState } from './controller';
import { woody } from './woody';
import { Sprite } from './sprite';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';
import { Mechanics } from './mechanics';

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source;
    return image;
};


class Animator<T extends Record<number, any>> {
    current = 0;
    reset() {
        this.current = 0;
    }
    oscillate(min: number, max: number): keyof T {
        const range = max - min;
        const offset = this.current >= range ? range - (this.current % range) : this.current;
        this.current = (this.current + 1) % (range * 2);
        return min + offset;
    }
}

interface EntityState<T> {
    input?: (controller: ControllerState) => keyof T | 999 | void;
    update?: () => keyof T | 999 | void;
    nextFrame?: () => keyof T;
}

const testImages = ['./woody_0.png', './woody_1.png', './woody_2.png'].map(loadImage);

type CharacterFrameData = typeof woody.frame
type CharacterFrame = keyof CharacterFrameData;

export class Entity {
    sprite = new Sprite({
        images: testImages,
        width: 80,
        height: 80,
        rows: 7,
        columns: 10,
    });
    mechanics = new Mechanics();
    directionX = 1;
    directionY = 1;
    frames = woody.frame;
    frame: CharacterFrame = 0;
    wait = 1;
    animator = new Animator<CharacterFrameData>();
    nextFrame: CharacterFrame | 999 = 0;
    constructor(
        private states: Record<number, EntityState<CharacterFrameData> | undefined> = {
            0: {
                input: (controller: ControllerState) => {
                    this.directionX = Math.sign(controller.stickX) || this.directionX;
                    if (controller.stickX) {
                        return 5;
                    }
                    if (controller.jump) {
                        return 210;
                    }
                },
                update: () => {
                    this.mechanics.velocityX = 0;
                }
            },
            1: {
                nextFrame: () => this.animator.oscillate(5, 8),
                input: (controller: ControllerState) => {
                    if (controller.jump) {
                        return 210;
                    } else {
                        if (controller.stickX) {
                            this.directionX = Math.sign(controller.stickX);
                        } else {
                            return 999;
                        }
                    }
                },
                update: () => {
                    this.mechanics.velocityX = this.directionX * woody.bmp.walking_speed;
                },
            },
            2: {
                nextFrame: () => this.animator.oscillate(9, 11),
                input: (controller: ControllerState) => {

                    if (controller.jump) {
                        return 213;
                    } else {
                        if (controller.stickX) {
                            this.directionX = Math.sign(controller.stickX);
                        } else {
                            return 218;
                        }
                    }
                },
                update: () => {
                    this.mechanics.velocityX = this.directionX * woody.bmp.running_speed;
                },
            },
            4: {
                update: () => {
                    if (this.frame === 211) {
                        if (this.mechanics.velocityX) {
                            this.mechanics.velocityX = this.directionX * woody.bmp.jump_distance
                        }
                        this.mechanics.velocityY = woody.bmp.jump_height
                    }
                    if (this.frame > 211 && !this.mechanics.velocityY) {
                        return 215;
                    }
                }
            }
        },
    ) { }
    translateFrame(frame: CharacterFrame | 999) {
        return frame === 999 ? 0 : frame;
    }

    processFrame() {
        if (!this.nextFrame && !--this.wait) {
            const frameData = this.frames[this.frame];
            const state = this.states[frameData.state];
            this.nextFrame = state?.nextFrame ? state.nextFrame() : frameData.next as CharacterFrame;
        }

        if (this.nextFrame) {
            const translatedFrame = this.translateFrame(this.nextFrame);
            const nextFrameData = this.frames[translatedFrame];
            this.wait = (1 + nextFrameData.wait);
            this.frame = translatedFrame;
            return nextFrameData;
        }
    }
    update(_dx: number) {
        keyboardControllers[0].fetch();
        this.nextFrame = 0;

        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        let inputFrame = state?.input?.(keyboardControllers[0].state) as CharacterFrame;
        if (inputFrame) {
            this.nextFrame = inputFrame;
        }
        let updateFrame = state?.update?.() as CharacterFrame;
        if (updateFrame) {
            this.nextFrame = updateFrame;
        }
        this.processFrame();

        this.mechanics.update();
        this.sprite.setFrame(frameData.pic);
    }
    render(ctx: CanvasRenderingContext2D) {
        this.sprite.render(ctx, this.mechanics.x, this.mechanics.y, this.directionX, this.directionY);
    }
}
