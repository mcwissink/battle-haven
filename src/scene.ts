import { Entity } from './entity';
import { collide, dotProduct, Mechanics, normalize, Rectangle, UP_VECTOR } from './mechanics';

export class Scene {
    entities: Entity[] = [];
    platforms = [
        new Mechanics(new Rectangle(1000, 100), { position: [100, 300] }),
        new Mechanics(new Rectangle(100, 100), { position: [200, 200] }),
        new Mechanics(new Rectangle(100, 100), { position: [200, 0] }),
    ];
    update(dx: number) {
        this.entities.forEach(entity => {
            entity.mechanics.update()
            entity.environment.update(entity.mechanics.position);
        });
        this.entities.forEach(entity => {
            let collided = false;
            this.platforms.forEach((platform) => {
                const mtv = collide(entity.mechanics.shape, platform.shape)
                if (mtv) {
                    entity.mechanics.position[0] -= mtv[0];
                    entity.mechanics.position[1] -= mtv[1];
                    entity.environment.update(entity.mechanics.position);
                }
                const mtv2 = collide(entity.environment, platform.shape)
                if (mtv2) {
                    collided = true;
                    const product = dotProduct(UP_VECTOR, normalize(mtv2));
                    if (product === 1 && !entity.mechanics.isGrounded && mtv) {
                        entity.event('landed');
                        entity.mechanics.velocity[1] = 0;
                        entity.mechanics.isGrounded = true;
                    }
                }
            });
            if (!collided) {
                if (entity.mechanics.isGrounded) {
                    entity.event('falling');
                }
                entity.mechanics.isGrounded = false;
            }
        });
        this.entities.forEach(entity => entity.update(dx));
    }
    render(ctx: CanvasRenderingContext2D) {
        this.entities.forEach(entity => entity.render(ctx));

        this.platforms.forEach((platform) => platform.render(ctx));
    }
}
