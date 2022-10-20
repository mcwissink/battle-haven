import { Character } from './character';
import { controllers } from './controller';
import { Scene } from './scene';

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
        controllers.on('connect', (port) => {
            this.scene.entities.push(new Character(port));
        });
    }
    start() {
        this.initialize();
        window.requestAnimationFrame(this.update);
    }

    wait = 2;
    update: FrameRequestCallback = (time) => {
        const dx = time - this.previousTime;
        if (!--this.wait) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.scene.update(dx);
            this.scene.render(this.ctx);
            this.wait = 2;
        }

        window.requestAnimationFrame(this.update);
        this.previousTime = time;
    }
}
