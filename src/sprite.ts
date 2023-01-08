export interface Dimensions {
    imageOffset: number;
    relativeOffset: number;
    rows: number;
    columns: number;
    width: number;
    height: number;
}

export interface SpriteSheet {
    images: HTMLImageElement[];
    dimensions: (frame: number) => Dimensions;
}


export class Sprite {
    x = 0;
    y = 0;
    directionX = 1;
    directionY = 1;
    frameOffsetX = 0;
    frameOffsetY = 0;
    frameOffsetImage = 0;
    isFlippedX = false;
    isFlippedY = false;
    dimensions: Dimensions;
    constructor(public spriteSheet: SpriteSheet) {
        this.dimensions = spriteSheet.dimensions(0);
    }

    setFrame(frame: number, direction: number) {
        this.dimensions = this.spriteSheet.dimensions(frame);
        this.frameOffsetImage = this.dimensions.imageOffset;
        const relativeFrame = frame - this.dimensions.relativeOffset;
        this.frameOffsetX = (relativeFrame % this.dimensions.columns) * this.dimensions.width;
        this.frameOffsetY = Math.floor(relativeFrame / (this.dimensions.columns)) * this.dimensions.height;
        this.directionX = direction;
    }

    render(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(this.directionX, this.directionY);
        if (this.spriteSheet) {
            ctx.drawImage(
                this.spriteSheet.images[this.frameOffsetImage],
                this.frameOffsetX + 1,
                this.frameOffsetY + 1,
                this.dimensions.width - 2,
                this.dimensions.height - 2,
                this.directionX === -1 ? -(this.dimensions.width - 2) : 0,
                this.directionY === -1 ? -(this.dimensions.height - 2) : 0,
                this.dimensions.width - 2,
                this.dimensions.height - 2
            );
        }
        ctx.restore();
    }
}
