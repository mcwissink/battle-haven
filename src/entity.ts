import { controllers, Controller } from './controller';
import { Sprite } from './sprite';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';
import { Mechanics, MechanicsEvent, Shape } from './mechanics';

type EntityState<Frame extends number> = {
    combo?: Record<string, Frame | 999 | void>;
    update?: (controller: Controller) => void;
    nextFrame?: () => Frame;
} & Partial<Record<MechanicsEvent, () => void>>;

export enum State {
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

type Defaults = 999 | 0;

class Transition<Frame extends number> {
    _frame: Frame | Defaults = 0;
    _direction = 0;
    _priority = 0;
    get frame(): Frame | Defaults {
        return this._frame;
    }
    setFrame(frame: Frame | Defaults, priority = 0, direction?: number) {
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

export class Entity<FrameData extends Record<number, any>, Frame extends number> {
    direction = 1;
    frame: Frame | Defaults = 0;
    wait = 1;
    next = new Transition<Frame>();
    public port = -1;
    constructor(
        public mechanics: Mechanics,
        public environment: Shape,
        public sprite: Sprite,
        public frames: FrameData,
        public states: Record<number | 'system', EntityState<Frame> | undefined>,
    ) { }
    translateFrame(frame: Frame | Defaults) {
        return frame === 999 ? 0 : frame;
    }

    get controller() {
        return controllers.get(this.port);
    }

    event(event: MechanicsEvent) {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];
        (state?.[event] ?? this.states.system?.[event])?.();
    }

    processFrame() {
        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        const combo = this.controller.combo || '';
        const frameFromCombo = frameData[combo] || state?.combo?.[combo]
        if (combo && frameFromCombo) {
            this.next.setFrame(frameFromCombo);
            // Reset combo since it was consumed
            this.controller.combo = null;
        }

        if (!this.next.frame && !--this.wait) {
            this.next.setFrame(state?.nextFrame ? state.nextFrame() : frameData.next as Frame);
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

            this.transition(this.frame, this.next.frame);

            this.wait = (1 + nextFrameData.wait);
            this.frame = translatedFrame;
        }
        if (this.next.direction) {
            this.direction = this.next.direction;
        }
        this.next.reset();
    }
    public transition(_frame: number, _nextFrame: number) { }
    update(_dx: number) {
        this.controller.update();

        const frameData = this.frames[this.frame];
        const state = this.states[frameData.state];

        state?.update?.(this.controller);

        this.states.system?.update?.(this.controller);

        this.sprite.setFrame(frameData.pic, this.direction);

        this.processFrame();
    }
    render(ctx: CanvasRenderingContext2D) {
        this.sprite.render(ctx, this.mechanics.position[0] - 40, this.mechanics.position[1] - 60);
        this.debugRender(ctx);
        // this.mechanics.render(ctx);
        // this.environment.render(ctx);
    }

    get x() {
        return this.mechanics.position[0] - (40 * this.direction - 1);
    }
    get y() {
        return this.mechanics.position[1] - 60;
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
