import { Entity } from './entity';
import { collide, dot, Mechanics, normalize, Rectangle, UP_VECTOR, Vector } from './mechanics';

interface Body {
    x: number;
    y: number;
    w: number;
    h: number;
}

export class Scene {
    entities: Entity[] = [];
    platforms = [
        new Mechanics(new Rectangle(1000, 100), { position: [800, 300] }),
        new Mechanics(new Rectangle(150, 500), { position: [5, 200] }),
        new Mechanics(new Rectangle(1500, 100), { position: [800, 800] }),
        new Mechanics(new Rectangle(150, 500), { position: [1600, 200] }),
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
                const mtv = collide(entity.mechanics.shape, platform.shape)
                if (mtv) {
                    entity.mechanics.position[0] -= mtv[0];
                    entity.mechanics.position[1] -= mtv[1];
                    entity.mechanics.velocity[0] -= mtv[0] * 0.5;
                    entity.mechanics.velocity[1] -= mtv[1] * 0.5;
                    entity.environment.update(entity.mechanics.position);
                }
                const mtv2 = collide(entity.environment, platform.shape)
                if (mtv2) {
                    isOverlapping = true;
                    if (!entity.mechanics.isOverlapping) {
                        entity.mechanics.isOverlapping = true;
                        entity.event('collide');
                    }

                    const product = dot(UP_VECTOR, normalize(mtv2));
                    if (product === 1) {
                        isGrounded = true;
                    }
                    if (product === 1 && !entity.mechanics.isGrounded && mtv) {
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
                entity.mechanics.isGrounded = false;
                if (entity.mechanics.isGrounded) {
                    entity.event('fall');
                }
            }
        });

        this.entities.forEach(entityA => {
            if (entityA.frameData.itr) {
                this.entities.find(entityB => {
                    if (
                        entityA.canAttack(entityB) &&
                        entityB !== entityA &&
                        entityB.frameData.bdy &&
                        entityA.frameData.itr
                    ) {
                        const itr = this.overlapAABB(
                            entityA.mechanics.position,
                            entityA.frameData.itr,
                            entityB.mechanics.position,
                            entityB.frameData.bdy
                        );
                        if (itr?.kind === 0) {
                            entityA.attacked(entityB, itr.arest || itr.vrest || 1);
                            entityB.event('hit', {
                                dvx: itr.dvx ? itr.dvx * entityA.direction : itr.dvx,
                                dvy: itr.dvy
                            });
                        }
                    }
                });
            }
        });

        this.entities.forEach(entity => entity.update(dx));
    }

    overlapAABB<BodyA extends Body>(originA: Vector, bodiesA: BodyA[], originB: Vector, bodiesB: Body[]): BodyA | undefined {
        for (const bodyA of bodiesA) {
            for (const bodyB of bodiesB) {
                const bodyAX = originA[0] + bodyA.x;
                const bodyAY = originA[1] + bodyA.y;
                const bodyBX = originB[0] + bodyB.x;
                const bodyBY = originB[1] + bodyB.y;
                if (
                    bodyAX <= bodyBX + bodyB.w &&
                    bodyAX + bodyA.w >= bodyBX &&
                    bodyAY + bodyA.h >= bodyBY &&
                    bodyAY <= bodyBY + bodyB.h
                ) {
                    return bodyA;
                }
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        this.entities.forEach(entity => entity.render(ctx));

        this.platforms.forEach((platform) => platform.render(ctx));
    }
}
