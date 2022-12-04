import { Character } from './character';
import { controllers } from './controller';
import { entityData } from './data-loader';
import { Entity } from './entity';
import { Projectile } from './projectile';
import { Scene } from './scene';

interface ObjectPoint {
    kind: 1;
    x: number;
    y: number;
    action: number;
    dvx: number;
    dvy: number;
    oid: number;
    facing: number;
}

export interface SpawnTask {
    opoint: ObjectPoint;
    parent: Entity<any, any>
}

type Task = {
    type: 'spawn';
    data: SpawnTask;
}

interface BattleHavenConfig {
    gravity: number;
    hitStop: number;
    friction: number;
}
export class BattleHaven {
    previousTime = 0;
    ctx: CanvasRenderingContext2D;
    scene = new Scene();
    tasks: Task[] = [];
    debug = {
        hitbox: false,
        mechanics: false,
    }
    combo: Record<string, (() => void) | undefined> = {
        debug_hitbox: () => this.debug.hitbox = !this.debug.hitbox,
        debug_mechanics: () => this.debug.mechanics = !this.debug.mechanics,
    }
    constructor(
        private canvas: HTMLCanvasElement,
        public config: BattleHavenConfig
    ) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get context');
        }
        this.ctx = ctx;
    }

    initialize() {
        controllers.on('connect', (port) => {
            this.scene.entities.push(new Character(port, entityData[0]));
        });
    }
    start() {
        this.initialize();
        window.requestAnimationFrame(this.update);
    }

    wait = 2;
    update: FrameRequestCallback = (time) => {
        controllers.ports.forEach((port) => {
            port?.update();
        });
        const dx = time - this.previousTime;
        if (!--this.wait) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.scene.update(dx);
            this.scene.render(this.ctx);
            this.processTasks();
            this.wait = 2;
        }

        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }

    processTasks() {
        this.tasks.forEach(({ type, data }) => {
            switch (type) {
                case 'spawn': {
                    const entity = entityData[data.opoint.oid];
                    if (entity) {
                        this.scene.entities.push(new Projectile(data, entity))
                    }
                }
            }
        });
        this.tasks = [];
    }

    spawn(opoint: ObjectPoint, parent: Entity) {
        this.tasks.push({
            type: 'spawn',
            data: {
                opoint,
                parent,
            }
        });
    }

    destroy(entity: Entity) {
        const entityIndex = this.scene.entities.findIndex((e) => e === entity);
        if (entityIndex !== -1) {
            this.scene.entities.splice(entityIndex, 1);
        }
    }
}
