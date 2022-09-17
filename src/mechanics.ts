const gravity = 1.7;
export class Mechanics {
    public x = 0;
    public y = 0;
    public velocityX = 0;
    public velocityY = 0;
    private mass;
    constructor({ mass = 1 }: { mass?: number } = {}) {
        this.mass = mass;
    }
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        if (this.y < 50) {
            this.velocityY += this.mass * gravity;
        } else {
            this.velocityY = 0;
        }
    }
}
