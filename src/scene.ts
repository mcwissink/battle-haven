import { Entity } from './entity';
import { collide, Mechanics, Rectangle } from './mechanics';

export class Scene {
    entities: Entity[] = [];
    floor = new Mechanics(new Rectangle(100, 100), { position: [100, 150] });
    update(dx: number) {
        this.entities.forEach(entity => entity.update(dx));
        this.entities.forEach(entity => {
            const mtv = collide(entity.mechanics.shape, this.floor.shape)
            if (mtv) {
                entity.mechanics.position[0] -= mtv[0];
                entity.mechanics.position[1] -= mtv[1];
            }
        });
    }
    render(ctx: CanvasRenderingContext2D) {
        this.entities.forEach(entity => entity.render(ctx));

        this.floor.render(ctx);
    }
}
