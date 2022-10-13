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
    combo?: Record<string, keyof T | 999 | void>;
    update?: (controller: Controller) => void;
    nextFrame?: () => keyof T;
} & Partial<Record<MechanicsEvent, () => void>>;

const testImages = ['./woody_0.png', './woody_1.png', './woody_2.png'].map(loadImage);

const animation = Object.entries(woody.frame).reduce<Record<string, CharacterFrame>>((acc, [frame, data]) => {
    if (!acc[data.name]) {
        acc[data.name] = (Number(frame) || 999) as CharacterFrame;
    }
    data.centerx++;
    data.centery++;
    return acc;
}, {
    airborn: 212,
});


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
    doubleJumping = 21,
    other = 15,
}

class Transition {
    _frame: keyof CharacterFrameData | 999 = 0;
    _direction = 0;
    _priority = 0;
    get frame() {
        return this._frame;
    }
    setFrame(frame: keyof CharacterFrameData | 999, priority = 0, direction?: number) {
        if (priority >= this._priority) {
            this._frame = frame;
            this._priority = priority;
            if (direction) {
                this._direction = direction;
            }
        }
    }

    get direction() {
        return this._direction;
    }

    reset() {
        this._priority = 0;
        this._frame = 0;
        this._direction = 0;
    }
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
    environment = new Diamond(10, 80);
    direction = 1;
    frames = woody.frame;
    frame: CharacterFrame = 1;
    wait = 1;
    animator = new Animator<CharacterFrameData>();
    nextFrame: CharacterFrame | 999 = 0;
    next = new Transition();
    constructor(
        public states: Record<number | 'system', EntityState<CharacterFrameData> | undefined> = {
            system: {
                landed: () => this.next.setFrame(animation.crouch, 1),
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
                        this.next.setFrame(animation.airborn, 1)
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
                },
            },
            [State.dash]: {
                combo: {
                    hit_a: animation.dash_attack,
                    hit_j: animation.double_jump,
                },
                update: ({ state: controller }) => {
                    const nextDirectionX = Math.sign(controller.stickX) || this.direction;
                    if (nextDirectionX !== this.direction && this.frame !== 214) {
                        this.next.setFrame(214, 0, nextDirectionX);
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
        },
    ) { }
    translateFrame(frame: CharacterFrame | 999) {
        return frame === 999 ? 0 : frame;
    }

    event(event: MechanicsEvent) {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];
        (state?.[event] ?? this.states.system?.[event])?.();
    }

    processFrame() {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        const combo = controllers.get(0).combo || '';
        const frameFromCombo = frameData[combo] || state?.combo?.[combo]
        if (combo && frameFromCombo) {
            this.next.setFrame(frameFromCombo);
            // Reset combo since it was consumed
            controllers.get(0).combo = null;
        }

        if (!this.next.frame && !--this.wait) {
            this.next.setFrame(state?.nextFrame ? state.nextFrame() : frameData.next as CharacterFrame);
        }

        if (this.next.frame) {
            const translatedFrame = this.translateFrame(this.next.frame);
            const nextFrameData = this.frames[translatedFrame];

            if (nextFrameData.dvx) {
                this.mechanics.force(nextFrameData.dvx * this.direction);
            }
            if (nextFrameData.dvy) {
                this.mechanics.force(nextFrameData.dvy, 1);
            }

            // Frame specific updates
            // Jump
            if (this.frame === 211 && this.next.frame === 212) {
                this.mechanics.force(woody.bmp.jump_distance * (Math.sign(this.mechanics.velocity[0]) || Math.sign(controllers.get(0).state.stickX)));
                this.mechanics.velocity[1] = woody.bmp.jump_height;
            }
            // Dash
            if (this.next.frame === animation.dash) {
                this.mechanics.force(woody.bmp.dash_distance * Math.sign(this.mechanics.velocity[0]));
                this.mechanics.velocity[1] = woody.bmp.dash_height;
            }
            // Double-jump
            if (this.next.frame === animation.double_jump) {
                this.mechanics.velocity[0] = Math.abs(this.mechanics.velocity[0] / 2) * Math.sign(controllers.get(0).state.stickX);
                this.mechanics.velocity[1] = woody.bmp.jump_height;
            }

            this.wait = (1 + nextFrameData.wait);
            this.frame = translatedFrame;
        }
        if (this.next.direction) {
            this.direction = this.next.direction;
        }
        this.next.reset();
    }
    update(_dx: number) {
        controllers.get(0).update();

        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        state?.update?.(controllers.get(0));

        this.states.system?.update?.(controllers.get(0));

        this.sprite.setFrame(frameData.pic, this.direction);

        this.processFrame();
    }
    render(ctx: CanvasRenderingContext2D) {
        this.sprite.render(ctx, this.mechanics.position[0] - 40, this.mechanics.position[1] - 50);
        // this.debugRender(ctx);
        // this.mechanics.render(ctx);
        // this.environment.render(ctx);
    }

    get x() {
        return this.mechanics.position[0] - (40 * this.direction - 1);
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
                    ctx.fillRect(this.x + b.x * this.direction, this.y + b.y, b.w * this.direction, b.h)
                });
            } else {
                ctx.fillRect(this.x + body.x * this.direction, this.y + body.y, body.w * this.direction, body.h);
            }
        }
        if (interaction) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            if (Array.isArray(interaction)) {
                interaction.forEach((i) => ctx.fillRect(this.x + i.x * this.direction, this.y + i.y, i.w * this.direction, i.h));
            } else {
                ctx.fillRect(this.x + interaction.x * this.direction, this.y + interaction.y, interaction.w * this.direction, interaction.h);
            }
        }
        ctx.fillStyle = 'rgba(0, 255, 255)';

        ctx.fillStyle = 'rgba(0, 255, 0)';
        ctx.fillRect(this.x, this.y, 4, 4);
    }
}
