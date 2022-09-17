import { keyboardControllers, Controller, ControllerState } from './controller';
import { woody } from './woody';
import { Sprite } from './sprite';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';

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
    input?: (controller: ControllerState) => keyof T | 999 | undefined;
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
    x = 0;
    y = 0;
    directionX = 1;
    directionY = 1;
    direction = 1;
    frames = woody.frame;
    frame: CharacterFrame = 60;
    wait = 1;
    animator = new Animator<CharacterFrameData>();
    constructor(
        private states: Record<number, EntityState<CharacterFrameData> | undefined> = {
            0: {
                input: (controller: ControllerState) => {
                    this.directionX = Math.sign(controller.stickX) || this.directionX;
                    if (controller.stickX) {
                        return 5;
                    }
                },
            },
            1: {
                nextFrame: () => this.animator.oscillate(5, 8),
                input: (controller: ControllerState) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    } else {
                        return 999;
                    }
                },
            },
            2: {
                nextFrame: () => this.animator.oscillate(9, 11),
            }
        },
    ) { }
    translateFrame(frame: CharacterFrame | 999) {
        return frame === 999 ? 0 : frame;
    }
    getNextFrame(): CharacterFrame {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];
        if (state?.nextFrame) {
            return state.nextFrame()
        } else {
            return frameData.next as CharacterFrame;
        }
    }
    processFrame() {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];
        let nextFrame = state?.input?.(keyboardControllers[0].state) as CharacterFrame;

        if (!--this.wait) {
            nextFrame = this.getNextFrame();
        }

        if (nextFrame) {
            const nextFrameData = this.frames[this.translateFrame(nextFrame)];
            // Simulate 30 fps temporarily with * 2 until I think of better solution
            this.wait = (1 + nextFrameData.wait) * 2;
            this.frame = this.translateFrame(nextFrame);
            return nextFrameData;
        }
        return frameData;
    }
    update(_dx: number) {
        keyboardControllers[0].fetch();
        const frameData = this.processFrame();

        this.sprite.setFrame(frameData.pic);
    }
    render(ctx: CanvasRenderingContext2D) {
        this.sprite.render(ctx, this);
    }
}
