import { Animator } from './animator';
import { SpawnTask } from './battle-haven';
import { EntityData } from './data-loader';
import { Entity } from "./entity";
import { BH } from './main';
import { Mechanics, Rectangle } from './mechanics';
import { Sprite } from './sprite';

export class Projectile extends Entity {
    animator = new Animator<any>();
    constructor(public spawnTask: SpawnTask, data: EntityData) {
        let direction = spawnTask.parent.direction;
        if (spawnTask.opoint.facing === 1) {
            direction *= -1;
        }
        super(
            new Mechanics(
                new Rectangle(10, 10),
                {
                    position: [
                        spawnTask.parent.mechanics.position[0] + 20 * direction,
                        spawnTask.parent.mechanics.position[1],
                    ],
                    mass: 0,
                }
            ),
            new Rectangle(12, 12),
            new Sprite(data.spriteSheet),
            data.data.frame,
            {
                system: {},
                3000: {
                    collide: () => {
                        this.mechanics.velocity[0] = 0;
                        this.next.setFrame(20);
                    },
                    hit: ({ entity }) => {
                        BH.spawn({
                            kind: 1,
                            x: 0,
                            y: 0,
                            action: 0,
                            dvx: 0,
                            dvy: 0,
                            oid: this.spawnTask.opoint.oid,
                            facing: 0,
                        }, entity);
                        // TODO: maybe use facing instead of direction
                        this.direction = this.direction * -1;
                        this.next.setFrame(1000);
                    }
                },
            }
        );
        this.parent = spawnTask.parent;
        this.direction = direction;
    }

    canAttack(entity: Entity) {
        return super.canAttack(entity) && !entity.frameData.itr?.some(itr => itr.kind === 0);
    }

    attacked() {
        this.next.setFrame(20);
        this.mechanics.velocity[0] = 0;
        this.mechanics.velocity[1] = 0;
    }
}
