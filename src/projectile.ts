import { Animator } from './animator';
import { SpawnTask } from './battle-haven';
import { Entity } from "./entity";
import { BH } from './main';
import { Mechanics, Rectangle } from './mechanics';
import { modifyData } from './modify-data';
import { Sprite } from './sprite';
import { woodyBall } from './woody-ball';

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source;
    return image;
};

modifyData(woodyBall);

const testImages = ['./woody_ball.png'].map(loadImage);

export class Projectile extends Entity {
    animator = new Animator<any>();
    constructor(public data: SpawnTask) {
        super(
            new Mechanics(
                new Rectangle(10, 10),
                {
                    position: [
                        data.parent.mechanics.position[0] + 30 * data.parent.direction,
                        data.parent.mechanics.position[1],
                    ],
                    mass: 0,
                }
            ),
            new Rectangle(12, 12),
            new Sprite({
                images: testImages,
                width: 82,
                height: 83,
                rows: 4,
                columns: 4,

            }),
            woodyBall.frame,
            {
                system: {},
                3000: {
                    collide: () => {
                        this.mechanics.velocity[0] = 0;
                        this.next.setFrame(20);
                    },
                    hit: () => {
                        BH.spawn({
                            kind: 1,
                            x: 0,
                            y: 0,
                            action: 0,
                            dvx: 0,
                            dvy: 0,
                            oid: 206,
                            facing: 0,
                        }, this);
                        // TODO: maybe use facing instead of direction
                        this.direction = this.direction * -1;
                        this.next.setFrame(1000);
                    }
                },
            }
        );
        this.parent = data.parent;
        this.direction = data.parent.direction;
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
