interface SpriteSheet {
    images: HTMLImageElement[];
    rows: number;
    columns: number;
    width: number;
    height: number;
}

export class Sprite {
    x = 0;
    y = 0;
    spriteSheet: SpriteSheet;
    directionX = 1;
    directionY = 1;
    frameOffsetX = 0;
    frameOffsetY = 0;
    frameOffsetImage = 0;
    isFlippedX = false;
    isFlippedY = false;
    constructor(spriteSheet: SpriteSheet) {
        this.spriteSheet = spriteSheet;
    }

    setFrame(frame: number, direction: number) {
        const sheetSize = this.spriteSheet.rows * this.spriteSheet.columns;
        this.frameOffsetImage = Math.floor(frame / sheetSize);
        const relativeFrame = frame - this.frameOffsetImage * sheetSize;
        this.frameOffsetX = (relativeFrame % this.spriteSheet.columns) * this.spriteSheet.width;
        this.frameOffsetY = Math.floor(relativeFrame / (this.spriteSheet.columns)) * this.spriteSheet.height;
        this.directionX = direction;
    }

    render(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.translate(x, y);
        ctx.scale(this.directionX, this.directionY);
        if (this.spriteSheet) {
            ctx.drawImage(
                this.spriteSheet.images[this.frameOffsetImage],
                this.frameOffsetX,
                this.frameOffsetY,
                this.spriteSheet.width,
                this.spriteSheet.height,
                this.directionX === -1 ? -this.spriteSheet.width : 0,
                this.directionY === -1 ? -this.spriteSheet.height : 0,
                this.spriteSheet.width,
                this.spriteSheet.height
            );
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
