import { Scene } from './scene';
import { Entity } from './entity';
import { keyboardControllers } from './controller';
console.log(keyboardControllers);

interface BattleHavenConfig {
    gravity: number;
}
export class BattleHaven {
    previousTime = 0;
    ctx: CanvasRenderingContext2D;
    scene = new Scene();
    constructor(
        private canvas: HTMLCanvasElement,
        private config: BattleHavenConfig
    ) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get context');
        }
        this.ctx = ctx;
    }

    initialize() {
        this.scene.entities.push(new Entity());
    }
    start() {
        this.initialize();
        window.requestAnimationFrame(this.update);
    }

    update: FrameRequestCallback = (time) => {
        const dx = time - this.previousTime;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.scene.update(dx);
        this.scene.render(this.ctx);

        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }
}
