import { Character } from './character';
import { controllers } from './controller';
import { GameData } from './data-loader';
import { Effect } from './effect';
import { Entity } from './entity';
import { Menu } from './menu';
import { Projectile } from './projectile';
import { Scene } from './scene';
import { Audio } from './sound';
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
    camera: {
        width: number;
        height: number;
        shake: number;
        follow: number;
        zoom: number;
        speed: number;
    };
    gravity: number;
    hitStop: number;
    friction: number;
    health: number;
}

export class BattleHaven {
    previousTime = 0;
    ctx: CanvasRenderingContext2D;
    scene: Scene;
    public audio: Audio;
    public menu: Menu;
    tasks: Task[] = [];
    debug = {
        hitbox: false,
        mechanics: true,
        stats: true,
        frames: false,
    }
    combo: Record<string, (() => void) | undefined> = {
        toggle_menu: () => {
            if (this.debug.frames) {
                this.wait = 2;
            } else {
                if (!this.menu.isOpen) {
                    this.menu.open()
                    this.wait = 2;
                }
            }
        },
    }
    constructor(
        private canvas: HTMLCanvasElement,
        public data: GameData,
        public config: BattleHavenConfig
    ) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get context');
        }
        this.ctx = ctx;
        this.scene = new Scene(this);
        this.menu = new Menu(this, () => ({ text: '', entries: [] }));
        this.audio = new Audio(data.soundpacks);
    }

    start() {
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
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!--this.wait) {
            if (!this.menu.isOpen || this.debug.frames) {
                this.scene.update(dx);
                this.processTasks();

                this.scene.entities.forEach(entity => entity.update(dx));
                this.scene.effects.forEach(effect => effect.update(dx));
            }
            this.wait = this.debug.frames ? 0 : 2;
        }

        this.scene.render(this.ctx);
        this.menu.render(this.ctx);


        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }

    processTasks() {
        this.tasks.forEach(task => {
            switch (task.type) {
                case 'spawn': {
                    const entity = this.data.entities[task.data.opoint.oid];
                    if (entity) {
                        if (task.data.opoint.oid >= 300) {
                            const effect = this.scene.effectsPool.pop() ?? new Effect(this, task.data, entity);
                            effect.reset(task.data, entity);
                            this.scene.effects.push(effect);
                        } else {
                            this.scene.entities.push(new Projectile(this, task.data, entity))
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
                        if (task.data.entity instanceof Character) {
                            const characterIndex = this.scene.characters.findIndex((c) => c === task.data.entity);
                            if (characterIndex !== -1) {
                                this.scene.characters.splice(characterIndex, 1);
                            }
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

    toggleDebug = (key: keyof typeof this.debug) => {
        this.debug[key] = !this.debug[key];
    }
}
