import { Entity } from './entity';
import { collide, dot, Mechanics, normalize, Rectangle, UP_VECTOR } from './mechanics';

export class Scene {
    entities: Entity[] = [];
    platforms = [
        new Mechanics(new Rectangle(200, 10), { position: [500, 245], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(200, 10), { position: [800, 150], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(200, 10), { position: [1100, 245], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(1000, 100), { position: [800, 400] }),
        new Mechanics(new Rectangle(150, 600), { position: [5, 210] }),
        new Mechanics(new Rectangle(1500, 100), { position: [800, 510] }),
        new Mechanics(new Rectangle(150, 600), { position: [1600, 210] }),
    ];
    update(dx: number) {
        this.entities.forEach(entity => {
            if (!entity.hitStop) {
                entity.mechanics.update()
                entity.environment.update(entity.mechanics.position);
            }
        });
        this.entities.forEach(entity => {
            let isGrounded = false;
            let isOverlapping = false;
            this.platforms.forEach((platform) => {
                let mtv = collide(entity.mechanics.shape, platform.shape)
                // One-way platforms
                if (mtv && platform.passThrough) {
                    if (
                        dot(platform.passThrough, normalize(mtv)) < 0.5 ||
                        dot(platform.passThrough, normalize(entity.mechanics.velocity)) >= 0
                    ) {
                        mtv = undefined;
                    }
                }
                if (mtv) {
                    entity.mechanics.position[0] += mtv[0];
                    entity.mechanics.position[1] += mtv[1];
                    entity.mechanics.velocity[0] += mtv[0] * 0.5;
                    entity.mechanics.velocity[1] += mtv[1] * 0.5;
                    entity.environment.update(entity.mechanics.position);
                }
                const mtv2 = collide(entity.environment, platform.shape)
                if (mtv2) {
                    isOverlapping = true;
                    if (!entity.mechanics.isOverlapping) {
                        entity.mechanics.isOverlapping = true;
                        entity.event('collide');
                    }

                    isGrounded = dot(UP_VECTOR, normalize(mtv2)) === 1;
                    if (isGrounded && !entity.mechanics.isGrounded && mtv) {
                        const [vx, vy] = entity.mechanics.velocity;
                        entity.mechanics.velocity[1] = 0;
                        entity.mechanics.isGrounded = true;
                        entity.event('land', { vx, vy });
                    }
                }
            });
            if (!isOverlapping) {
                entity.mechanics.isOverlapping = false;
            }
            if (!isGrounded) {
                if (entity.mechanics.isGrounded) {
                    entity.event('fall');
                }
                entity.mechanics.isGrounded = false;
            }
        });

        this.entities.forEach(entityA => {
            if (entityA.frameData.itr) {
                this.entities.find(entityB => {
                    const itr = itrOverlap(entityA, entityB);
                    if (itr?.kind === 0) {
                        entityA.attacked(entityB, itr.arest || itr.vrest || 1);
                        const isThirdHit = entityB.frame >= 223 && entityB.frame <= 226;
                        entityB.event('hit', {
                            dvx: itr.dvx ? itr.dvx * entityA.direction : itr.dvx,
                            dvy: itr.dvy || (isThirdHit ? -10 : 0),
                        });
                    }
                });
            }
        });

        this.entities.forEach(entity => entity.update(dx));
    }

    render(ctx: CanvasRenderingContext2D) {
        this.entities.forEach(entity => entity.render(ctx));

        this.platforms.forEach((platform) => platform.render(ctx));
    }
}

const itrOverlap = (
    entityA: Entity,
    entityB: Entity,
): any => {
    const originA = entityA.mechanics.position;
    const originB = entityB.mechanics.position;
    const bodiesA = entityA.frameData.itr;
    const bodiesB = entityB.frameData.bdy;
    if (
        entityA.canAttack(entityB) &&
        entityB !== entityA &&
        bodiesA &&
        bodiesB
    ) {
        for (const bodyA of bodiesA) {
            for (const bodyB of bodiesB) {
                const [ax, ay] = entityA.getFrameElementPosition(bodyA);
                const [bx, by] = entityB.getFrameElementPosition(bodyB);
                const bodyAX = originA[0] + ax;
                const bodyAY = originA[1] + ay;
                const bodyBX = originB[0] + bx;
                const bodyBY = originB[1] + by;
                if (
                    bodyAX <= bodyBX + bodyB.w &&
                    bodyAY <= bodyBY + bodyB.h &&
                    bodyBX <= bodyAX + bodyA.w &&
                    bodyBY <= bodyAY + bodyA.h
                ) {
                    return bodyA;
                }
            }
        }
    }
}

