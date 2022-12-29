import { controllers } from './controller';
import { entityData } from './data-loader';
import { Effect } from './effect';
import { Entity } from './entity';
import { Menu } from './menu';
import { Projectile } from './projectile';
import { Scene } from './scene';
import { ObjectPoint } from './types';

export interface SpawnTask {
    opoint: ObjectPoint;
    parent: Entity;
}

type Task = {
    type: 'spawn';
    data: SpawnTask;
} | {
    type: 'destroy';
    data: {
        entity: Entity;
    };
}


interface BattleHavenConfig {
    gravity: number;
    hitStop: number;
    friction: number;
    health: number;
}

export class BattleHaven {
    previousTime = 0;
    ctx: CanvasRenderingContext2D;
    scene = new Scene();
    showMenu = true;
    public menu = new Menu([]);
    tasks: Task[] = [];
    debug = {
        hitbox: false,
        mechanics: false,
    }
    combo: Record<string, (() => void) | undefined> = {
        // debug_hitbox: () => this.debug.hitbox = !this.debug.hitbox,
        // debug_mechanics: () => this.debug.mechanics = !this.debug.mechanics,
        toggle_menu: () => this.showMenu = !this.showMenu,
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

    start() {
        // controllers.on('connect', (port) => {
        //     this.scene.entities.push(new Character(port, entityData[5]));
        // });
        window.requestAnimationFrame(this.update);
    }

    wait = 2;
    update: FrameRequestCallback = (time) => {
        controllers.ports.forEach((controller) => {
            controller.update();
            controller.processCombo(combo => {
                const systemCombo = this.combo[combo.name];
                if (systemCombo) {
                    systemCombo();
                    return true;
                }
            });
        });
        const dx = time - this.previousTime;
        if (!--this.wait) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (!this.showMenu) {
                this.scene.update(dx);
            }
            this.scene.render(this.ctx);
            if (this.showMenu) {
                this.menu.update();
                this.menu.render(this.ctx);
            }

            this.processTasks();
            this.wait = 2;
        }

        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }

    processTasks() {
        this.tasks.forEach(task => {
            switch (task.type) {
                case 'spawn': {
                    const entity = entityData[task.data.opoint.oid];
                    if (entity) {
                        if (task.data.opoint.oid >= 300) {
                            const effect = this.scene.effectsPool.pop() ?? new Effect(task.data, entity);
                            effect.reset(task.data, entity);
                            this.scene.effects.push(effect);
                        } else {
                            this.scene.entities.push(new Projectile(task.data, entity))
                        }
                    }
                    break;
                }
                case 'destroy': {
                    if (task.data.entity.type === 'effect') {
                        // TODO: effects should be udpated to use object pooling
                        const index = this.scene.effects.findIndex((e) => e === task.data.entity);
                        if (index !== -1) {
                            const [effect] = this.scene.effects.splice(index, 1);
                            this.scene.effectsPool.push(effect);
                        }
                    } else {
                        const index = this.scene.entities.findIndex((e) => e === task.data.entity);
                        if (index !== -1) {
                            this.scene.entities.splice(index, 1);
                        }
                    }
                    break;
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
        this.tasks.push({
            type: 'destroy',
            data: {
                entity
            }
        });
    }
}
