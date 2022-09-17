import { Entity } from './entity';

export class Scene {
	entities: Entity[] = [];
	update(dx: number) {
		this.entities.forEach(entity => entity.update(dx));
	}
	render(ctx: CanvasRenderingContext2D) {
		this.entities.forEach(entity => entity.render(ctx));
	}
}
