import { SpawnTask } from './battle-haven';
import { animation, EntityData } from './data-loader';
import { Entity } from "./entity";
import { Mechanics, Rectangle } from './mechanics';
import { Sprite } from './sprite';

export class Projectile extends Entity {
    type = 'projectile';
    constructor(public spawnTask: SpawnTask, data: EntityData) {
        let direction = spawnTask.parent.direction;
        if (spawnTask.opoint.facing === 1) {
            direction *= -1;
        }
        const [x, y] = spawnTask.parent.getFrameElementPosition(spawnTask.opoint);
        const killed = () => this.next.setFrame(this.frameData.hit_d);
        const update = () => this.health -= this.frameData.hit_a;
        super(
            new Mechanics(
                new Rectangle(1, 1),
                {
                    position: [
                        spawnTask.parent.mechanics.position[0] + x,
                        spawnTask.parent.mechanics.position[1] + y,
                    ],
                    mass: 0,
                }
            ),
            new Rectangle(2, 2),
            new Sprite(data.spriteSheet),
            data.data.frame,
            {
                default: {
                    killed,
                    update,
                },
                3000: {
                    attacking: () => {
                        this.next.setFrame(20);
                        this.mechanics.velocity[0] = 0;
                        this.mechanics.velocity[1] = 0;
                    },
                    collide: () => {
                        this.mechanics.velocity[0] = 0;
                        this.next.setFrame(20);
                    },
                    attacked: ({ entity }) => {
                        this.mechanics.velocity[0] = 0;
                        if (entity.type === 'character') {
                            this.parent = entity;
                            this.next.setFrame(animation.rebounding);
                        } else {
                            this.next.setFrame(20);
                        }
                    },
                },
                3004: {
                    update: () => {
                        update();
                        this.mechanics.velocity[0] *= 0.8;
                        this.mechanics.velocity[1] *= 0.8;
                    },
                },
                3005: {
                    collide: () => this.next.setFrame(1000),
                }
            }
        );
        this.frame = spawnTask.opoint.action;
        this.parent = spawnTask.parent.parent || spawnTask.parent;
        this.direction = direction;
        if (spawnTask.opoint.dvx) {
            this.mechanics.force(this.direction * spawnTask.opoint.dvx)
        }
        if (spawnTask.opoint.dvy) {
            this.mechanics.force(spawnTask.opoint.dvy, 1)
        }
    }

    canAttack(entity: Entity) {
        return super.canAttack(entity) && !(entity.type === 'character' && entity.frameData.itr?.some(itr => itr.kind === 0));
    }
}
