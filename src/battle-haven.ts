import { Character } from "./character";
import { ControllerManager } from "./controller";
import { GameData } from "./data-loader";
import { Effect } from "./effect";
import { Entity } from "./entity";
import { Vector } from "./mechanics";
import { Menu } from "./menu";
import { Projectile } from "./projectile";
import { Scene } from "./scene";
import { Audio } from "./sound";
import { ObjectPoint } from "./types";

export interface SpawnTask {
    opoint: ObjectPoint;
    parent: Entity;
}

type Task =
    | {
          type: "spawn";
          data: SpawnTask;
      }
    | {
          type: "destroy";
          data: {
              entity: Entity;
          };
      };

interface BattleHavenConfig {
    camera: {
        width: number;
        height: number;
        shake: number;
        follow: Vector;
        offset: Vector;
        zoom: number;
        speed: number;
    };
    physics: {
        gravity: number;
        friction: {
            ground: number,
            air: number,
        };
    },
    game: {
        hitStop: number;
        health: number;
        frameRate: number;
    },
}

export class BattleHaven {
    previousTime = 0;
    ctx: CanvasRenderingContext2D;
    scene: Scene;
    public audio: Audio;
    public menu: Menu;
    public controllers: ControllerManager;
    tasks: Task[] = [];
    debug = {
        hitbox: false,
        mechanics: false,
        stats: true,
        frames: false,
    };
    combo: Record<string, (() => void) | undefined> = {
        toggle_menu: () => {
            if (this.debug.frames) {
                this.wait = 2;
            } else {
                if (!this.menu.isOpen) {
                    this.menu.open();
                    this.wait = 2;
                }
            }
        },
    };
    constructor(
        private canvas: HTMLCanvasElement,
        public data: GameData,
        public config: BattleHavenConfig
    ) {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get context");
        }
        this.ctx = ctx;
        this.scene = new Scene(this, { platforms: [] });
        this.controllers = new ControllerManager();
        this.audio = new Audio(data.soundpacks);
        this.menu = new Menu(this, () => ({ text: "", entries: [] }));
    }

    start() {
        window.requestAnimationFrame(this.update);
    }

    wait = 2;
    update: FrameRequestCallback = (time) => {
        this.controllers.ports.forEach((controller) => {
            controller.update();
            controller.processCombo((combo) => {
                const systemCombo = this.combo[combo.name];
                if (systemCombo) {
                    systemCombo();
                    return true;
                }
            });
        });

        // Process game logic at 30 fps
        // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe


        const frameInterval = 1000 / this.config.game.frameRate;

        while (time - frameInterval > this.previousTime) {
            if (!this.menu.isOpen || this.debug.frames) {
                this.processTasks();

                this.scene.update(0);
                this.scene.entities.forEach((entity) => entity.update(0));
                this.scene.effects.forEach((effect) => effect.update(0));
            }
            this.previousTime += frameInterval;

            this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.scene.render(this.ctx);
            this.menu.render(this.ctx);
        }

        window.requestAnimationFrame(this.update);
    };

    processTasks() {
        this.tasks.forEach((task) => {
            switch (task.type) {
                case "spawn": {
                    const entity = this.data.entities[task.data.opoint.oid];
                    if (entity) {
                        if (task.data.opoint.oid >= 300) {
                            const effect =
                                this.scene.effectsPool.pop() ??
                                new Effect(this, task.data, entity);
                            effect.reset(task.data, entity);
                            this.scene.effects.push(effect);
                        } else {
                            this.scene.entities.push(
                                new Projectile(this, task.data, entity)
                            );
                        }
                    }
                    break;
                }
                case "destroy": {
                    if (task.data.entity.type === "effect") {
                        // TODO: effects should be udpated to use object pooling
                        const index = this.scene.effects.findIndex(
                            (e) => e === task.data.entity
                        );
                        if (index !== -1) {
                            const [effect] = this.scene.effects.splice(
                                index,
                                1
                            );
                            this.scene.effectsPool.push(effect);
                        }
                    } else {
                        const index = this.scene.entities.findIndex(
                            (e) => e === task.data.entity
                        );
                        if (index !== -1) {
                            this.scene.entities.splice(index, 1);
                        }
                        if (task.data.entity instanceof Character) {
                            const characterIndex =
                                this.scene.characters.findIndex(
                                    (c) => c === task.data.entity
                                );
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
            type: "spawn",
            data: {
                opoint,
                parent,
            },
        });
    }

    destroy(entity: Entity) {
        this.tasks.push({
            type: "destroy",
            data: {
                entity,
            },
        });
    }

    toggleDebug = (key: keyof typeof this.debug) => {
        this.debug[key] = !this.debug[key];
    };
}
