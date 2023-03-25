import { BattleHaven } from "./battle-haven";
import { Character } from "./character";
import { Effect } from "./effect";
import { Entity } from "./entity";
import {
    distance,
    collide3,
    difference,
    dot,
    Mechanics,
    minimum,
    normalize,
    UP_VECTOR,
    Vector,
    CollisionResolution,
} from "./mechanics";
import { Interaction } from "./types";

interface Level {
    platforms: Mechanics[];
}

export class Scene {
    constructor(public game: BattleHaven, public level: Level) {}
    entities: Entity[] = [];
    characters: Character[] = [];
    effects: Effect[] = [];
    effectsPool: Effect[] = [];
    collisionStep(entity: Entity, time = 1) {
        let earliestCollision: CollisionResolution | undefined;
        this.level.platforms.forEach((platform) => {
            const collision = collide3(entity.mechanics, platform, time);
            if (
                collision &&
                (!earliestCollision || collision.time <= earliestCollision.time)
            ) {
                earliestCollision = collision;
            }
        });
        if (earliestCollision) {
            if (!entity.mechanics.isOverlapping) {
                entity.mechanics.isOverlapping = true;
                entity.event("collide");
            }

            if (
                dot(
                    UP_VECTOR,
                    normalize(earliestCollision.velocityCorrection)
                ) > 0.8 &&
                !entity.mechanics.isGrounded
            ) {
                const [vx, vy] = entity.mechanics.velocity;
                entity.event("land", { vx, vy });
                entity.mechanics.isGrounded = true;
            }

            entity.mechanics.position[0] +=
                entity.mechanics.velocity[0] * earliestCollision.time * 0.99;
            entity.mechanics.position[1] +=
                entity.mechanics.velocity[1] * earliestCollision.time * 0.99;
            entity.mechanics.velocity[0] +=
                earliestCollision.velocityCorrection[0];
            entity.mechanics.velocity[1] +=
                earliestCollision.velocityCorrection[1];
            // TODO: Change 1 to time - earliestCollision.time and figure out how to make that work
            // We need to handle the corner case and group collisions
            this.collisionStep(entity);
            return true;
        }
    }

    getDistanceToFloor(entity: Entity) {
        let minDistanceToFloor = Infinity;
        this.level.platforms.forEach((platform) => {
            const distanceToFloor = distance(
                UP_VECTOR,
                entity.mechanics,
                platform
            );
            if (distanceToFloor > 0 && distanceToFloor < minDistanceToFloor) {
                minDistanceToFloor = distanceToFloor;
            }
        });
        return minDistanceToFloor;
    }

    update(dx: number) {
        this.entities.forEach((entity) => {
            if (
                (entity.type === "projectile" &&
                    !entity.frameData.dvx &&
                    !entity.frameData.dvy) ||
                entity.hitStop
            ) {
                return;
            }

            entity.mechanics.distanceToFloor = Infinity;
            if (!this.collisionStep(entity)) {
                if (entity.mechanics.isGrounded) {
                    entity.event("fall");
                    entity.mechanics.isGrounded = false;
                }

                if (entity.mechanics.isOverlapping) {
                    entity.mechanics.isOverlapping = false;
                }
            }

            entity.mechanics.ignorePassthrough = false;
        });

        this.entities.forEach((entity) => entity.mechanicsUpdate(dx));

        this.entities.forEach((entity) => {
            entity.mechanics.distanceToFloor = this.getDistanceToFloor(entity);
        });

        this.entities.forEach((entity) => entity.stateUpdate());

        this.entities.forEach((entityA) => {
            if (entityA.frameData.itr) {
                this.entities.find((entityB) => {
                    const itr = itrOverlap(entityA, entityB);
                    if (itr) {
                        switch (itr.kind) {
                            case 0: {
                                entityA.attacking(
                                    entityB,
                                    itr.arest || itr.vrest || 2
                                );
                                entityA.event("attacking", { entity: entityB });
                                entityB.event("attacked", {
                                    ...itr,
                                    entity: entityA,
                                    dvx: itr.dvx
                                        ? itr.dvx * entityA.direction
                                        : itr.dvx,
                                });

                                const effect = itr.effect ?? 0;
                                const x =
                                    entityB.mechanics.position[0] -
                                    entityA.mechanics.position[0];
                                const y =
                                    entityB.mechanics.position[1] -
                                    entityA.mechanics.position[1] -
                                    10;
                                if (entityB.type === "character") {
                                    switch (effect) {
                                        case 0:
                                        case 4: {
                                            this.game.spawn(
                                                {
                                                    kind: 1,
                                                    x,
                                                    y,
                                                    action: 0,
                                                    dvx: 0,
                                                    dvy: 0,
                                                    oid: 300,
                                                    facing: entityA.direction,
                                                },
                                                entityA
                                            );
                                            break;
                                        }
                                        case 1: {
                                            this.game.spawn(
                                                {
                                                    kind: 1,
                                                    x,
                                                    y,
                                                    action: 0,
                                                    dvx: 0,
                                                    dvy: 0,
                                                    oid: 301,
                                                    facing: entityA.direction,
                                                },
                                                entityA
                                            );
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                            case 1:
                            case 3: {
                                entityA.next.setFrame(itr.catchingact[0]);
                                entityB.next.setFrame(itr.caughtact[0]);
                                entityA.event("catching", {
                                    entity: entityB,
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
                    character.mechanics.position[0] -
                        entity.mechanics.position[0],
                    character.mechanics.position[1] -
                        entity.mechanics.position[1]
                );
                if (distance < minDistance) {
                    nearestCharacter = character;
                    minDistance = distance;
                }
            }
        }
        return nearestCharacter;
    }

    cameraPosition: Vector = [0, 0];
    camera(ctx: CanvasRenderingContext2D) {
        const cameraHalfWidth = this.game.config.camera.width * 0.5;
        const cameraHalfHeight = this.game.config.camera.height * 0.5;
        const characterPositions = this.characters.reduce(
            (acc, entity) => {
                acc[0] += entity.mechanics.position[0];
                acc[1] += entity.mechanics.position[1];
                return acc;
            },
            [0, 0]
        );
        const charactersX = characterPositions[0] / this.characters.length;
        const charactersY = characterPositions[1] / this.characters.length;
        const scalingFactor = this.characters.reduce((acc, entity) => {
            return Math.max(
                Math.hypot(
                    charactersX - entity.mechanics.position[0],
                    charactersY - entity.mechanics.position[1]
                ),
                acc
            );
        }, 0);

        const target: Vector = [
            (cameraHalfWidth - charactersX) * this.game.config.camera.follow ||
                0,
            (cameraHalfHeight - charactersY) * this.game.config.camera.follow ||
                0,
        ];
        const cameraFullTranslation = difference(this.cameraPosition, target);
        const [x, y] = normalize(cameraFullTranslation);
        const cameraLimitedTranslation: Vector = [
            x * this.game.config.camera.speed,
            y * this.game.config.camera.speed,
        ];
        const minimumTranslation = minimum(
            cameraFullTranslation,
            cameraLimitedTranslation
        );
        this.cameraPosition[0] += minimumTranslation[0];
        this.cameraPosition[1] += minimumTranslation[1];
        ctx.translate(this.cameraPosition[0], this.cameraPosition[1]);

        const scale =
            1 +
            this.game.config.camera.zoom / (Math.max(scalingFactor, 50) + 200);
        ctx.scale(scale, scale);
        ctx.translate(
            -cameraHalfWidth + cameraHalfWidth / scale,
            -cameraHalfHeight + cameraHalfHeight / scale
        );

        if (
            this.entities.some(
                (entity) => entity.hitStop && !this.game.menu.isOpen
            )
        ) {
            ctx.translate(this.shakeValue(), this.shakeValue());
        }
    }

    shakeValue = () =>
        Math.sin(Date.now()) *
        (Math.random() > 0.5 ? -1 : 1) *
        this.game.config.camera.shake;

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        this.camera(ctx);
        // Fake 3D look
        ctx.save();
        ctx.translate(0, -10);
        this.level.platforms.forEach((platform) => platform.render(ctx));
        ctx.restore();

        this.entities.forEach((entity) => entity.render(ctx));
        this.effects.forEach((effect) => effect.render(ctx));
        ctx.restore();
        this.characters.forEach((entity) => {
            ctx.save();
            if (entity.port === 1) {
                ctx.scale(-1, 1);
                ctx.translate(-1600, 0);
            }
            const padding = 8;
            const padding2 = padding * 2;
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(0, 0, 140, 140);
            ctx.fillRect(140, 0, 400, 28);
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.fillRect(140 + padding, padding, 400 - padding2, 28 - padding2);
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            ctx.fillRect(
                140 + padding,
                padding,
                (entity.health / this.game.config.game.health) * (400 - padding2),
                28 - padding2
            );
            ctx.drawImage(entity.data.face!, 10, 10);
            ctx.restore();

            if (this.game.debug.stats) {
                ctx.save();
                if (entity.port === 1) {
                    ctx.translate(1160, 0);
                }
                ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fillRect(140, 28, 160, 100);
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                const stats = {
                    x: entity.mechanics.position[0].toFixed(2),
                    y: entity.mechanics.position[1].toFixed(2),
                    grounded: String(Number(entity.mechanics.isGrounded)),
                    state: String(entity.frameData.state),
                };

                ctx.font = "20px monospace";
                Object.entries(stats).forEach(([label, value], index) => {
                    ctx.fillText(
                        `${label}: ${value.padStart(10 - label.length, " ")}`,
                        148,
                        48 + index * 20
                    );
                });
                ctx.restore();
            }
        });
    }
}

const itrOverlap = (
    entityA: Entity,
    entityB: Entity
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
};
