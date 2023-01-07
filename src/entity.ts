import { controllers } from './controller';
import { BH } from './main';
import { Mechanics, Shape, Vector } from './mechanics';
import { Sprite } from './sprite';
import { Body, Combo, FrameData, Interaction0, Point } from './types';

type Event = {
    land: { vx: number, vy: number };
    collide: null;
    fall: null;
    attacked: Interaction0 & { entity: Entity };
    attacking: { entity: Entity };
    caught: { entity: Entity };
    catching: { entity: Entity };
    killed: null;
}

type EventQueue = {
    [E in keyof Event]: Array<Event[E]>;
}

export type EventHandlers = {
    [E in keyof Event]?: Event[E] extends null ? () => void : (data: Event[E]) => void;
}

type EntityState<Frame extends number> = {
    combo?: Record<string, Frame | 999 | (() => Frame | 999)>;
    update?: () => void;
    nextFrame?: () => Frame;
    resetComboBuffer?: boolean;
    noMechanics?: boolean;
    event?: EventHandlers & {
        enter?: (previousFrame: Frame | 0) => void;
        leave?: (nextFrame: Frame | 0) => void;
    }
};

export enum Effect {
    normal = 0,
    blood = 1,
    fire = 2,
    ice = 3,
}

export enum State {
    standing = 0,
    walking = 1,
    running = 2,
    attacks = 3,
    jumping = 4,
    dash = 5,
    dodging = 6,
    defend = 7,
    brokenDefend = 8,
    catching = 9,
    caught = 10,
    injured = 11,
    falling = 12,
    ice = 13,
    lying = 14,
    other = 15,
    burning = 18,
    fireRunning = 19,
    crouching = 20,
    doubleJumping = 21,
    drop = 22,
    dashGo = 23,
}

type Defaults = 999 | 0;

class Transition<Frame extends number> {
    frame: Frame | Defaults = 0;
    direction = 0;
    priority = 0;
    setFrame(frame: number, priority = 0, direction?: number) {
        if (priority >= this.priority) {
            this.frame = frame as Frame | Defaults;
            this.priority = priority;
            if (direction) {
                this.setDirectionFromValue(direction);
            }
        }
    }

    setDirectionFromValue(value: number) {
        this.direction = Math.sign(value) || this.direction;
    }

    reset() {
        this.priority = 0;
        this.frame = 0;
        this.direction = 0;
    }
}

const hitShiver: Record<number, number> = {
    [State.injured]: 10,
    [State.falling]: 10,
    [State.defend]: 5,
    [State.brokenDefend]: 20,
}

export class Entity<Frames extends Record<number, FrameData> = any, Frame extends number = any> {
    type = 'entity';
    parent?: Entity;
    direction = 1;
    frame: Frame | 0 = 0;
    wait = 1;
    next = new Transition<Frame>();
    attackRest: Map<Entity, number> = new Map();
    hitStop = 0;
    health = BH.config.health;
    isKilled = false;
    events: EventQueue = {
        collide: [],
        fall: [],
        land: [],
        caught: [],
        catching: [],
        attacking: [],
        attacked: [],
        killed: [],
    }
    public port = -1;
    constructor(
        public mechanics: Mechanics,
        public environment: Shape,
        public sprite: Sprite,
        public frames: Frames,
        public states: Record<number | 'default', EntityState<Frame> | undefined>,
        public offsetY = 0,
    ) {
        this.environment.follow(this.mechanics.position);
    }

    translateFrame(frame: Frame | Defaults) {
        const frameAbs = Math.abs(frame) as Frame;
        if (frame < 0) {
            this.direction = this.direction * -1;
        }
        return frameAbs === 999 ? 0 : frameAbs;
    }

    get state() {
        return this.states[this.frameData.state];
    }

    get controller() {
        return controllers.get(this.port);
    }

    getFrameElementPosition({ x, y, w = 0 }: Body | Point): Vector {
        return [
            (x - this.frameData.centerx) * this.direction + (this.direction === 1 ? 0 : -w),
            y - this.frameData.centery + this.offsetY,
        ];
    }

    event<E extends keyof Event>(
        event: E,
        ...data: Event[E] extends null ? [] : [Event[E]]
    ): void {
        this.events[event].push(data[0] as any);
    }

    canAttack(entity: Entity): boolean {
        return this.parent !== entity && entity.parent !== this && !this.attackRest.has(entity) && (!this.parent || this.parent !== entity.parent);
    }

    attacking(entity: Entity, rest: number) {
        this.hitStop = BH.config.hitStop;
        this.attackRest.set(entity, Math.floor(rest / 2));
    }

    processEvents() {
        (Object.keys(this.events) as Array<keyof Event>).forEach((event) => {
            this.events[event].forEach((data) => {
                const stateHandler = this.state?.event?.[event];
                if (stateHandler) {
                    stateHandler?.(data as any);
                } else {
                    this.states.default?.event?.[event]?.(data as any);
                }
            });
            this.events[event].length = 0;
        });
    }

    processFrame() {
        const state = this.state;

        this.controller.processCombo(combo => {
            const comboName = combo.name as Combo;
            const comboHandler = (this.frameData[comboName] || state?.combo?.[comboName]);
            const frameFromCombo = typeof comboHandler === 'function' ? comboHandler() : comboHandler;
            if (frameFromCombo) {
                this.next.setFrame(frameFromCombo, 0, combo.direction);
                return true;
            }
        });

        if (!this.hitStop && !this.next.frame && !--this.wait) {
            this.next.setFrame(state?.nextFrame ? state.nextFrame() : this.frameData.next as Frame);
        }

        if (this.next.direction) {
            this.direction = this.next.direction;
        }
        // TODO: care about infinite loops
        while (this.next.frame) {
            const translatedFrame = this.translateFrame(this.next.frame);
            this.next.frame = 0;

            if (translatedFrame === 1000) {
                BH.destroy(this);
                return;
            }
            const previousFrame = this.frame;
            const previousFrameData = this.frameData;
            const nextFrameData = this.frames[translatedFrame];
            const changedState = nextFrameData.state !== previousFrameData.state;

            if (nextFrameData.dvx) {
                this.mechanics.force(nextFrameData.dvx * this.direction, 0, Infinity);
            }
            if (nextFrameData.dvy) {
                this.mechanics.force(nextFrameData.dvy, 1);
            }

            if (nextFrameData.opoint) {
                BH.spawn(nextFrameData.opoint, this);
            }
            if (changedState) {
                this.state?.event?.leave?.(translatedFrame);
            }

            this.wait = (1 + nextFrameData.wait);
            this.frame = translatedFrame;

            if (changedState) {
                this.state?.event?.enter?.(previousFrame);
            }
        }
        this.next.reset();
    }

    mechanicsUpdate(_dx: number) {
        if (this.hitStop) {
            this.hitStop--;
        } else {
            if (!this.state?.noMechanics) {
                this.mechanics.update();
            }
            this.attackRest.forEach((value, key) => {
                if (value) {
                    this.attackRest.set(key, value - 1);
                } else {
                    this.attackRest.delete(key);
                }
            });
        }
    }

    stateUpdate() {
        this.processEvents();
        (this.state?.update ?? this.states.default?.update)?.();
    }

    update(_dx: number) {
        this.processFrame();
        this.sprite.setFrame(this.frameData.pic, this.direction);
        if (this.health <= 0 && !this.isKilled) {
            this.isKilled = true;
            this.event('killed');
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const shiver = hitShiver[this.frameData.state] ?? 0;
        const modX = this.hitStop && shiver ? Math.sin((this.hitStop * Math.PI * 0.5) + 0.25) * shiver : 0;
        const offsetX = this.direction === 1 ? this.frameData.centerx : this.sprite.dimensions.width - this.frameData.centerx;
        const offsetY = this.frameData.centery - this.offsetY;
        this.sprite.render(
            ctx,
            this.mechanics.position[0] - offsetX + modX,
            this.mechanics.position[1] - offsetY,
        );
        if (BH.debug.hitbox) {
            this.debugRender(ctx);
        }
        if (BH.debug.mechanics) {
            this.mechanics.render(ctx);
            this.environment.render(ctx);
        }
    }

    public get frameData(): FrameData {
        return this.frames[this.frame];
    }

    debugRender(ctx: CanvasRenderingContext2D) {
        const body = this.frameData.bdy as any;
        const interaction = this.frameData.itr as any;

        if (body) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.4)';
            body.forEach((b: any) => {
                const [x, y] = this.getFrameElementPosition(b);
                ctx.fillRect(
                    this.mechanics.position[0] + x,
                    this.mechanics.position[1] + y,
                    b.w,
                    b.h
                )
            });
        }
        if (interaction) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            interaction.forEach((i: any) => {
                const [x, y] = this.getFrameElementPosition(i);
                ctx.fillRect(
                    this.mechanics.position[0] + x,
                    this.mechanics.position[1] + y,
                    i.w,
                    i.h
                )
            });
        }
    }
}

