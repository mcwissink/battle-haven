import { Animator } from './animator';
import { SpawnTask } from './battle-haven';
import { Entity } from "./entity";
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
                        this.mechanics.velocity[0] = 0;
                        this.next.setFrame(20);
                    }
                },
            }
        );
        this.parent = data.parent;
        this.direction = data.parent.direction;
    }

    attacked() {
        this.next.setFrame(20);
        this.mechanics.velocity[0] = 0;
        this.mechanics.velocity[1] = 0;
    }
}
