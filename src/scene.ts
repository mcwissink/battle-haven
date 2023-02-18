import { BattleHaven } from './battle-haven';
import { Character } from './character';
import { Effect } from './effect';
import { Entity } from './entity';
import { collide, collide3, difference, dot, Mechanics, minimum, normalize, Rectangle, UP_VECTOR, Vector } from './mechanics';
import { Interaction } from './types';

export class Scene {
    constructor(public game: BattleHaven) {
        this.platforms = [
            new Mechanics(this.game, new Rectangle(200, 3), { position: [500, 245], passthrough: UP_VECTOR }),
            new Mechanics(this.game, new Rectangle(200, 3), { position: [800, 150], passthrough: UP_VECTOR }),
            new Mechanics(this.game, new Rectangle(200, 3), { position: [1100, 245], passthrough: UP_VECTOR }),
            new Mechanics(this.game, new Rectangle(1000, 120), { position: [800, 400] }),
            new Mechanics(this.game, new Rectangle(150, 600), { position: [5, 210] }),
            new Mechanics(this.game, new Rectangle(1500, 100), { position: [800, 510] }),
            new Mechanics(this.game, new Rectangle(150, 600), { position: [1600, 210] }),
        ];
    }
    entities: Entity[] = [];
    characters: Character[] = [];
    effects: Effect[] = [];
    effectsPool: Effect[] = [];
    platforms: Mechanics[];
    update(dx: number) {
        this.entities.forEach(entity => {
            if (entity.type === 'projectile' && !entity.frameData.dvx && !entity.frameData.dvy) {
                return;
            }
            entity.mechanics.didCollide = false;
            entity.mechanics.collisionVelocity = [...entity.mechanics.velocity];
            this.platforms.forEach((platform) => {
                collide3(entity.mechanics, platform);
            });
        });

        this.entities.forEach(entity => entity.mechanicsUpdate(dx));

        this.entities.forEach(entity => {
            if (entity.type === 'projectile' && !entity.frameData.dvx && !entity.frameData.dvy) {
                return;
            }
            let isGrounded = false;
            let isOverlapping = false;
            let isIgnoringPassthrough = false;
            this.platforms.forEach((platform) => {
                const mtv2 = collide(entity.environment, platform.shape)
                if (mtv2) {
                    if (platform.passthrough && entity.mechanics.ignorePassthrough) {
                        if (entity.mechanics.isGrounded) {
                            entity.event('drop');
                        }
                        isIgnoringPassthrough = true;
                        return;
                    }
                    isOverlapping = true;
                    if (!entity.mechanics.isOverlapping && entity.mechanics.didCollide) {
                        entity.mechanics.isOverlapping = true;
                        entity.event('collide');
                    }

                    isGrounded = dot(UP_VECTOR, normalize(mtv2)) === 1;
                    if (isGrounded && !entity.mechanics.isGrounded && entity.mechanics.didCollide) {
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
            if (!isIgnoringPassthrough && entity.mechanics.ignorePassthrough) {
                entity.mechanics.ignorePassthrough = false;
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
                                        this.game.spawn({
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
                                        this.game.spawn({
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
    }

    getNearestCharacter(entity: Entity) {
        let nearestCharacter: Character | null = null;
        let minDistance = Infinity;
        for (const character of this.characters) {
            if (character !== entity) {
                const distance = Math.hypot(
                    character.mechanics.position[0] - entity.mechanics.position[0],
                    character.mechanics.position[1] - entity.mechanics.position[1]
                );
                if (distance < minDistance) {
                    nearestCharacter = character;
                    minDistance = distance;
                }
            }
        }
        return nearestCharacter;
    }

    cameraPosition: Vector = [0, 0]
    camera(ctx: CanvasRenderingContext2D) {
        const cameraHalfWidth = this.game.config.camera.width * 0.5;
        const cameraHalfHeight = this.game.config.camera.height * 0.5;
        const characterPositions = this.characters.reduce((acc, entity) => {
            acc[0] += entity.mechanics.position[0];
            acc[1] += entity.mechanics.position[1];
            return acc;
        }, [0, 0]);
        const charactersX = characterPositions[0] / this.characters.length;
        const charactersY = characterPositions[1] / this.characters.length;
        const scalingFactor = this.characters.reduce((acc, entity) => {
            return Math.max(
                Math.hypot(
                    charactersX - entity.mechanics.position[0],
                    charactersY - entity.mechanics.position[1],
                ),
                acc
            )
        }, 0);

        const target: Vector = [
            (cameraHalfWidth - charactersX) * this.game.config.camera.follow || 0,
            (cameraHalfHeight - charactersY) * this.game.config.camera.follow || 0
        ];
        const cameraFullTranslation = difference(this.cameraPosition, target);
        const [x, y] = normalize(cameraFullTranslation);
        const cameraLimitedTranslation: Vector = [
            x * this.game.config.camera.speed,
            y * this.game.config.camera.speed
        ];
        const minimumTranslation = minimum(cameraFullTranslation, cameraLimitedTranslation):
        this.cameraPosition[0] += minimumTranslation[0];
        this.cameraPosition[1] += minimumTranslation[1];
        ctx.translate(this.cameraPosition[0], this.cameraPosition[1]);

        const scale = 1 + this.game.config.camera.zoom / (Math.max(scalingFactor, 50) + 200);
        ctx.scale(scale, scale);
        ctx.translate(
            -cameraHalfWidth + (cameraHalfWidth / scale),
            -cameraHalfHeight + (cameraHalfHeight / scale)
        );

        if (this.entities.some((entity) => entity.hitStop && !this.game.menu.isOpen)) {
            ctx.translate(this.shakeValue(), this.shakeValue());
        }
    }

    shakeValue = () => Math.sin(Date.now()) * (Math.random() > 0.5 ? -1 : 1) * this.game.config.camera.shake;


    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        this.camera(ctx);
        this.platforms.forEach(platform => platform.render(ctx));
        this.entities.forEach(entity => entity.render(ctx));
        this.effects.forEach(effect => effect.render(ctx));
        ctx.restore();
        this.characters.forEach(entity => {
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
            ctx.fillRect(140 + padding, padding, entity.health / this.game.config.health * (400 - padding2), 28 - padding2);
            ctx.drawImage(entity.data.face!, 10, 10);
            ctx.restore();

            if (this.game.debug.stats) {
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

                ctx.font = '20px mono';
                Object.entries(stats).forEach(([label, value], index) => {
                    ctx.fillText(
                        `${label}: ${value.padStart(10 - label.length, ' ')}`,
                        148,
                        48 + index * 20,
                    );
                });
                ctx.restore();
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

