import { controllers } from './controller';
import { BH } from './main';
import { Mechanics, Shape } from './mechanics';
import { Sprite } from './sprite';
import './woody_0.png';
import './woody_1.png';
import './woody_2.png';

type Event = {
    land: { vx: number, vy: number };
    collide: null;
    fall: null;
    hit: { dvx?: number; dvy?: number };
}

type EventHandlers = {
    [E in keyof Event]?: Event[E] extends null ? () => void : (data: Event[E]) => void;
}

type EntityState<Frame extends number> = {
    combo?: Record<string, Frame | 999 | void | (() => Frame | 999 | void)>;
    update?: () => void;
    nextFrame?: () => Frame;
} & EventHandlers;

export enum State {
    standing = 0,
    walking = 1,
    running = 2,
    attacks = 3,
    jumping = 4,
    dash = 5,
    dodging = 6,
    defend = 7,
    injured = 11,
    falling = 12,
    other = 15,
    crouching = 20,
    doubleJumping = 21,
}

type Defaults = 999 | 0;

class Transition<Frame extends number> {
    _frame: Frame | Defaults = 0;
    _direction = 0;
    _priority = 0;
    get frame(): Frame | Defaults {
        return this._frame;
    }
    setFrame(frame: number, priority = 0, direction?: number) {
        if (priority >= this._priority) {
            this._frame = frame as Frame | Defaults;
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

type Interaction = {
    kind: 0;
    x: number;
    y: number;
    w: number;
    h: number;
    dvx?: number;
    dvy?: number;
    fall: number;
    arest?: number;
    vrest?: number;
    bdefend: number;
    injury: number;
}

interface IFrameData {
    name: string;
    pic: number;
    state: number;
    wait: number;
    next: number;
    dvx: number;
    dvy: number;
    dvz: number;
    centerx: number;
    centery: number;
    hit_a: number;
    hit_d: number;
    hit_j: number;
    bdy?: [{
        kind: number;
        x: number;
        y: number;
        w: number;
        h: number;
    }]
    opoint: any;
    itr?: Interaction[]
}

export class Entity<FrameData extends Record<number, IFrameData> = any, Frame extends number = any> {
    parent?: Entity;
    _direction = 1;
    frame: Frame | Defaults = 0;
    wait = 1;
    next = new Transition<Frame>();
    attackRest: Map<Entity, number> = new Map();
    hitStop = 0;
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

    get direction() {
        return this._direction;
    }

    set direction(direction: number) {
        this._direction = Math.sign(direction) || this._direction;
    }

    get state() {
        return this.states[this.frameData.state];
    }

    get controller() {
        return controllers.get(this.port);
    }

    event<E extends keyof Event>(
        event: E,
        ...data: Event[E] extends null ? [] : [Event[E]]
    ): void {
        this.state?.[event]?.(data[0] as any);
        this.states.system?.[event]?.(data[0] as any);
    }

    canAttack(entity: Entity) {
        return this.parent !== entity && !this.attackRest.has(entity);
    }

    attacked(entity: Entity, rest: number) {
        this.hitStop = BH.config.hitStop;
        this.attackRest.set(entity, Math.floor(rest / 2));
    }

    processFrame() {
        const state = this.state;

        const combo = this.controller.combo;
        if (combo) {
            const comboName = combo.name as keyof IFrameData;
            const comboHandler = (this.frameData[comboName] || state?.combo?.[comboName]);
            const frameFromCombo = typeof comboHandler === 'function' ? comboHandler() : comboHandler;
            if (frameFromCombo) {
                this.next.setFrame(frameFromCombo, 0, combo.direction);
                // Reset combo since it was consumed
                this.controller.combo = null;
            }
        }

        if (!this.hitStop && !this.next.frame && !--this.wait) {
            this.next.setFrame(state?.nextFrame ? state.nextFrame() : this.frameData.next as Frame);
        }

        if (this.next.frame) {
            const translatedFrame = this.translateFrame(this.next.frame);
            if (translatedFrame === 1000) {
                BH.destroy(this);
                return;
            }
            const nextFrameData = this.frames[translatedFrame];

            if (nextFrameData.dvx) {
                this.mechanics.force(nextFrameData.dvx * this.direction);
            }
            if (nextFrameData.dvy) {
                this.mechanics.force(nextFrameData.dvy, 1);
            }

            if (nextFrameData.opoint) {
                BH.spawn(nextFrameData.opoint, this);
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

        if (this.hitStop) {
            this.hitStop--;
        } else {
            this.attackRest.forEach((value, key) => {
                if (value) {
                    this.attackRest.set(key, value - 1);
                } else {
                    this.attackRest.delete(key);
                }
            });
        }

        this.state?.update?.(this.controller);

        this.states.system?.update?.(this.controller);

        this.sprite.setFrame(this.frameData.pic, this.direction);

        this.processFrame();
    }
    render(ctx: CanvasRenderingContext2D) {
        const modX = this.hitStop && (this.frameData.state === State.injured || this.frameData.state === State.falling) ? Math.sin((this.hitStop * Math.PI * 0.5) + 0.25) * 10 : 0;
        this.sprite.render(
            ctx,
            this.mechanics.position[0] - 40 + modX,
            this.mechanics.position[1] - 60,
        );
        // this.debugRender(ctx);
        this.mechanics.render(ctx);
        // this.environment.render(ctx);
    }

    get x() {
        return this.mechanics.position[0] - (40 * this.direction - 1);
    }
    get y() {
        return this.mechanics.position[1] - 60;
    }

    public get frameData(): IFrameData {
        return this.frames[this.frame];
    }

    debugRender(ctx: CanvasRenderingContext2D) {
        const body = this.frameData.bdy as any;
        const interaction = this.frameData.itr as any;

        if (body) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.4)';
            body.forEach((b: any) => {
                ctx.fillRect(this.x + b.x * this.direction, this.y + b.y, b.w * this.direction, b.h)
            });
        }
        if (interaction) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            interaction.forEach((i: any) => ctx.fillRect(this.x + i.x * this.direction, this.y + i.y, i.w * this.direction, i.h));
        }
    }
}
