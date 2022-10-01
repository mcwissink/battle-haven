import { controllers, Controller } from './controller';
import { woody } from './woody';
import { Sprite } from './sprite';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';
import { Diamond, Mechanics, MechanicsEvent, Rectangle } from './mechanics';

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

type EntityState<T> = {
    input?: (controller: Controller) => keyof T | 999 | void;
    combo?: Record<string, keyof T | 999 | void>;
    update?: () => keyof T | 999 | void;
    nextFrame?: () => keyof T;
} & Partial<Record<MechanicsEvent, () => keyof T | 999 | void>>;

const testImages = ['./woody_0.png', './woody_1.png', './woody_2.png'].map(loadImage);

const animation = Object.entries(woody.frame).reduce<Record<string, CharacterFrame>>((acc, [frame, data]) => {
    if (!acc[data.name]) {
        acc[data.name] = (Number(frame) || 999) as CharacterFrame;
    }
    if (frame === '210' || frame === '211') {
        data.state = 20;
    }
    data.centerx++;
    data.centery++;
    return acc;
}, {})

type CharacterFrameData = typeof woody.frame
type CharacterFrame = keyof CharacterFrameData;

enum State {
    standing = 0,
    walking = 1,
    running = 2,
    attacks = 3,
    jumping = 4,
    dash = 5,
    dodging = 6,
    defend = 7,
    crouching = 20,
}

export class Entity {
    sprite = new Sprite({
        images: testImages,
        width: 80,
        height: 80,
        rows: 7,
        columns: 10,
    });
    mechanics = new Mechanics(new Diamond(30, 60), { position: [100, 100] });
    environment = new Diamond(31, 61);
    directionX = 1;
    directionY = 1;
    frames = woody.frame;
    frame: CharacterFrame = 1;
    wait = 1;
    animator = new Animator<CharacterFrameData>();
    nextFrame: CharacterFrame | 999 = 0;
    constructor(
        public states: Record<number | 'generic', EntityState<CharacterFrameData> | undefined> = {
            generic: {
                landed: () => animation.crouch,
            },
            [State.standing]: {
                combo: {
                    hit_a: animation.punch,
                    hit_d: animation.defend,
                    hit_j: animation.jump,
                    hit_F: animation.running,
                    hit_DF: animation.walking,
                },
                input: ({ state: controller }) => {
                    this.directionX = Math.sign(controller.stickX) || this.directionX;
                    if (controller.stickX) {
                        return animation.running;
                    }
                },
                update: () => {
                    if (!this.mechanics.isGrounded) {
                        return 212;
                    } else {
                        this.mechanics.velocity[0] = 0;
                    }
                }
            },
            [State.walking]: {
                combo: {
                    hit_a: animation.punch,
                    hit_d: animation.defend,
                    hit_j: animation.jump,
                    hit_DF: animation.walking,
                },
                nextFrame: () => this.animator.oscillate(5, 8),
                input: ({ state: controller }) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    } else {
                        return animation.standing;
                    }
                },
                update: () => {
                    if (!this.mechanics.isGrounded) {
                        return 212;
                    } else {
                        this.mechanics.velocity[0] = this.directionX * woody.bmp.walking_speed;
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
                input: ({ state: controller }) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    } else {
                        return animation.stop_running;
                    }
                },
                update: () => {
                    if (!this.mechanics.isGrounded) {
                        return 212;
                    } else {
                        this.mechanics.velocity[0] = this.directionX * woody.bmp.running_speed;
                    }
                },
            },
            [State.jumping]: {
                combo: {
                    hit_a: animation.jump_attack,
                },
                input: ({ state: controller }) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    }
                },
            },
            [State.dash]: {
                combo: {
                    hit_a: animation.dash_attack,
                },
                input: ({ state: controller }) => {
                    const nextDirectionX = Math.sign(controller.stickX) || this.directionX;
                    if (nextDirectionX !== this.directionX) {
                        this.directionX = nextDirectionX;
                        return 214;
                    }
                },
            },
            [State.defend]: {
                input: ({ state: controller }) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    }
                },
                update: () => {
                    this.mechanics.velocity[0] = 0;
                }
            },
            [State.crouching]: {
                input: ({ state: controller }) => {
                    if (controller.stickX) {
                        this.directionX = Math.sign(controller.stickX);
                    }
                },
            }
        },
    ) { }
    translateFrame(frame: CharacterFrame | 999) {
        return frame === 999 ? 0 : frame;
    }

    event(event: MechanicsEvent) {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];
        const frame = (state?.[event] ?? this.states.generic?.[event])?.();
        if (frame) {
            this.nextFrame = frame;
        }
    }

    processFrame() {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        const combo = controllers.get(0).combo || '';
        const frameFromCombo = frameData[combo] || state?.combo?.[combo]
        if (combo && frameFromCombo) {
            this.nextFrame = frameFromCombo;
            // Reset combo since it was consumed
            controllers.get(0).combo = null;
        }

        if (!this.nextFrame && !--this.wait) {
            this.nextFrame = state?.nextFrame ? state.nextFrame() : frameData.next as CharacterFrame;
        }

        if (this.nextFrame) {
            const translatedFrame = this.translateFrame(this.nextFrame);
            const nextFrameData = this.frames[translatedFrame];

            if (nextFrameData.dvx) {
                this.mechanics.velocity[0] = nextFrameData.dvx * this.directionX;
            }
            if (nextFrameData.dvy) {
                this.mechanics.velocity[1] = nextFrameData.dvy;
            }

            // Frame specific updates
            if (this.frame === 211 && this.nextFrame === 212) {
                this.mechanics.velocity[0] = woody.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || Math.sign(controllers.get(0).state.stickX));
                this.mechanics.velocity[1] = woody.bmp.jump_height
            }
            if (this.nextFrame === 213) {
                this.mechanics.velocity[0] = woody.bmp.dash_distance * Math.sign(this.mechanics.velocity[0]);
                this.mechanics.velocity[1] = woody.bmp.dash_height
            }

            this.wait = (1 + nextFrameData.wait);
            this.frame = translatedFrame;
        }
        this.nextFrame = 0;
    }
    update(_dx: number) {
        controllers.get(0).update();

        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        let inputFrame = state?.input?.(controllers.get(0)) as CharacterFrame;
        if (inputFrame) {
            this.nextFrame = inputFrame;
        }
        let updateFrame = state?.update?.() as CharacterFrame;
        if (updateFrame) {
            this.nextFrame = updateFrame;
        }
        let genericUpdateFrame = this.states['generic']?.update?.() as CharacterFrame;
        if (genericUpdateFrame) {
            this.nextFrame = genericUpdateFrame;
        }
        this.processFrame();

        this.sprite.setFrame(frameData.pic);
    }
    render(ctx: CanvasRenderingContext2D) {
        this.sprite.render(ctx, this.mechanics.position[0] - 40, this.mechanics.position[1] - 50, this.directionX, this.directionY);
        // this.debugRender(ctx);
        // this.mechanics.render(ctx);
        // this.environment.render(ctx);
    }

    get x() {
        return this.mechanics.position[0] - (40 * this.directionX - 1);
    }
    get y() {
        return this.mechanics.position[1] - 50;
    }

    debugRender(ctx: CanvasRenderingContext2D) {
        const frameData = this.frames[this.frame];
        const body = frameData.bdy as any;
        const interaction = frameData.itr as any;

        if (body) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.4)';
            if (Array.isArray(body)) {
                body.forEach((b) => {
                    ctx.fillRect(this.x + b.x * this.directionX, this.y + b.y, b.w * this.directionX, b.h)
                });
            } else {
                ctx.fillRect(this.x + body.x * this.directionX, this.y + body.y, body.w * this.directionX, body.h);
            }
        }
        if (interaction) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            if (Array.isArray(interaction)) {
                interaction.forEach((i) => ctx.fillRect(this.x + i.x * this.directionX, this.y + i.y, i.w * this.directionX, i.h));
            } else {
                ctx.fillRect(this.x + interaction.x * this.directionX, this.y + interaction.y, interaction.w * this.directionX, interaction.h);
            }
        }
        ctx.fillStyle = 'rgba(0, 255, 255)';

        ctx.fillStyle = 'rgba(0, 255, 0)';
        ctx.fillRect(this.x, this.y, 4, 4);
    }
}
