import { Character } from './character';
import { controllers } from './controller';
import { Entity } from './entity';
import { Projectile } from './projectile';
import { Scene } from './scene';

const objectIds: Record<number, any> = {
    206: (data: SpawnTask) => new Projectile(data),
}

interface ObjectPoint {
    kind: 1;
    x: number;
    y: number;
    action: number;
    dvx: number;
    dvy: number;
    oid: number;
    facigin: number;
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
            this.scene.entities.push(new Character(port));
        });
    }
    start() {
        this.initialize();
        window.requestAnimationFrame(this.update);
    }

    wait = 2;
    update: FrameRequestCallback = (time) => {
        const dx = time - this.previousTime;
        if (!--this.wait) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.processTasks();
            this.scene.update(dx);
            this.scene.render(this.ctx);
            this.wait = 2;
        }

        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }

    processTasks() {
        this.tasks.forEach(({ type, data }) => {
            switch (type) {
                case 'spawn': {
                    const factory = objectIds[data.opoint.oid];
                    if (factory) {
                        this.scene.entities.push(factory(data))
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
