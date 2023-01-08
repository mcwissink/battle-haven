import { Character } from './character';
import { Effect } from './effect';
import { Entity } from './entity';
import { BH } from './main';
import { collide, dot, Mechanics, normalize, Rectangle, UP_VECTOR } from './mechanics';
import { Interaction } from './types';

const shakeValue = () => Math.sin(Date.now()) * (Math.random() > 0.5 ? -1 : 1) * 4;

export class Scene {
    entities: Entity[] = [];
    effects: Effect[] = [];
    effectsPool: Effect[] = [];
    platforms = [
        new Mechanics(new Rectangle(200, 30), { position: [500, 245], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(200, 30), { position: [800, 150], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(200, 30), { position: [1100, 245], passThrough: UP_VECTOR }),
        new Mechanics(new Rectangle(1000, 100), { position: [800, 400] }),
        new Mechanics(new Rectangle(150, 600), { position: [5, 210] }),
        new Mechanics(new Rectangle(1500, 100), { position: [800, 510] }),
        new Mechanics(new Rectangle(150, 600), { position: [1600, 210] }),
    ];
    update(dx: number) {
        this.entities.forEach(entity => entity.mechanicsUpdate(dx));
        this.entities.forEach(entity => {
            if (entity.type === 'projectile' && !entity.frameData.dvx && !entity.frameData.dvy) {
                return;
            }
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

        this.entities.forEach(entity => entity.stateUpdate());

        this.entities.forEach(entityA => {
            if (entityA.frameData.itr) {
                this.entities.find(entityB => {
                    const itr = itrOverlap(entityA, entityB);
                    if (itr) {
                        switch (itr.kind) {
                            case 0: {
                                entityA.attacking(entityB, itr.arest || itr.vrest || 2);
                                entityA.event('attacking', { entity: entityB });
                                entityB.event('attacked', {
                                    ...itr,
                                    entity: entityA,
                                    dvx: itr.dvx ? itr.dvx * entityA.direction : itr.dvx,
                                });

                                const effect = itr.effect ?? 0;
                                const x = (entityB.mechanics.position[0] - entityA.mechanics.position[0]);
                                const y = (entityB.mechanics.position[1] - entityA.mechanics.position[1]) - 10;
                                switch (effect) {
                                    case 0:
                                    case 4: {
                                        BH.spawn({
                                            kind: 1,
                                            x,
                                            y,
                                            action: 0,
                                            dvx: 0,
                                            dvy: 0,
                                            oid: 300,
                                            facing: entityA.direction,
                                        }, entityA);
                                        break;
                                    }
                                    case 1: {
                                        BH.spawn({
                                            kind: 1,
                                            x,
                                            y,
                                            action: 0,
                                            dvx: 0,
                                            dvy: 0,
                                            oid: 301,
                                            facing: entityA.direction,
                                        }, entityA);
                                        break;
                                    }
                                }
                                break;
                            }
                            case 1:
                            case 3: {
                                entityA.next.setFrame(itr.catchingact[0]);
                                entityB.next.setFrame(itr.caughtact[0]);
                                entityA.event('catching', {
                                    entity: entityB
                                });
                                break;
                            }
                        }
                    }
                });
            }
        });
        this.entities.forEach(entity => entity.update(dx));
        this.effects.forEach(effect => effect.update(dx));
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        if (this.entities.some((entity) => entity.hitStop && !entity.isKilled)) {
            ctx.translate(shakeValue(), shakeValue());
        }
        this.platforms.forEach(platform => platform.render(ctx));
        this.entities.forEach(entity => entity.render(ctx));
        this.effects.forEach(effect => effect.render(ctx));
        ctx.restore();
        this.entities.forEach(entity => {
            if (entity instanceof Character && entity.data.face) {
                ctx.save();
                if (entity.port === 1) {
                    ctx.scale(-1, 1);
                    ctx.translate(-1600, 0);
                }
                const padding = 8;
                const padding2 = padding * 2;
                ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                ctx.fillRect(0, 0, 140, 140);
                ctx.fillRect(140, 0, 400, 28);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(140 + padding, padding, 400 - padding2, 28 - padding2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillRect(140 + padding, padding, entity.health / BH.config.health * (400 - padding2), 28 - padding2);
                ctx.drawImage(entity.data.face, 10, 10);
                ctx.restore();

                if (BH.debug.stats) {
                    ctx.save();
                    if (entity.port === 1) {
                        ctx.translate(1160, 0);
                    }
                    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                    ctx.fillRect(140, 28, 160, 100);
                    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                    const stats = {
                        x: entity.mechanics.position[0].toFixed(2),
                        y: entity.mechanics.position[1].toFixed(2),
                        grounded: String(Number(entity.mechanics.isGrounded)),
                        state: String(entity.frameData.state),
                    };
                    Object.entries(stats).forEach(([label, value], index) => {
                        ctx.fillText(
                            `${label}: ${value.padStart(10 - label.length, ' ')}`,
                            148,
                            48 + index * 20,
                        );
                    });
                    ctx.restore();
                }
            }
        });
    }
}

const itrOverlap = (
    entityA: Entity,
    entityB: Entity,
): Interaction | undefined => {
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

