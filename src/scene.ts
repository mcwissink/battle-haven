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
                        const itr = itrOverlap(
                            entityA.mechanics.position,
                            entityA.frameData.itr,
                            entityA.direction,
                            entityB.mechanics.position,
                            entityB.frameData.bdy,
                            entityB.direction,
                        );
                        if (itr?.kind === 0) {
                            entityA.attacked(entityB, itr.arest || itr.vrest || 1);
                            const isThirdHit = entityB.frame >= 223 && entityB.frame <= 226;
                            entityB.event('hit', {
                                dvx: itr.dvx ? itr.dvx * entityA.direction : itr.dvx,
                                dvy: itr.dvy || (isThirdHit ? -10 : 0),
                            });
                        }
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


export const getOffsetX = (body: Body, direction: number) => {
    const x = body.x - 40;
    return x * direction + (direction === 1 ? 0 : -body.w);
};

export const getOffsetY = (body: Body) => {
    return body.y - 60;
};

const itrOverlap = <BodyA extends Body>(
    originA: Vector,
    bodiesA: BodyA[],
    directionA: number,
    originB: Vector,
    bodiesB: Body[],
    directionB: number,
): BodyA | undefined => {
    for (const bodyA of bodiesA) {
        for (const bodyB of bodiesB) {
            const bodyAX = originA[0] + getOffsetX(bodyA, directionA)
            const bodyAY = originA[1] + getOffsetY(bodyA);
            const bodyBX = originB[0] + getOffsetX(bodyB, directionB);
            const bodyBY = originB[1] + getOffsetY(bodyB);
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
