import { Entity } from './entity';
import { collide, dotProduct, Mechanics, normalize, Rectangle, UP_VECTOR } from './mechanics';

export class Scene {
    entities: Entity[] = [];
    floor = new Mechanics(new Rectangle(1000, 100), { position: [100, 300] });
    update(dx: number) {
        this.entities.forEach(entity => {
            entity.mechanics.update()
            entity.environment.update(entity.mechanics.position);
        });
        this.entities.forEach(entity => {
            const mtv = collide(entity.mechanics.shape, this.floor.shape)
            if (mtv) {
                entity.mechanics.position[0] -= mtv[0];
                entity.mechanics.position[1] -= mtv[1];
            }
            let isGrounded = false;
            entity.mechanics.isGrounded = false;
            const mtv2 = collide(entity.environment, this.floor.shape)
            if (mtv2) {
                const product = dotProduct(UP_VECTOR, normalize(mtv2));
                if (product > 0.5) {
                    if (product === 1 && entity.mechanics.velocity[1] > 0) {
                        entity.event('landed');
                        entity.mechanics.velocity[1] = 0;
                    }
                    isGrounded = true;
                }
            }
            entity.mechanics.isGrounded = isGrounded;
        });
        this.entities.forEach(entity => entity.update(dx));
    }
    render(ctx: CanvasRenderingContext2D) {
        this.entities.forEach(entity => entity.render(ctx));

        this.floor.render(ctx);
    }
}
