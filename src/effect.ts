import { EntityData } from "./data-loader";
import { Entity } from "./entity";
import { Mechanics, Rectangle, Vector } from "./mechanics";
import { Sprite } from "./sprite";

interface EffectFrameData {
    pic: number;
    wait: number;
    next: number;
    centerx: number;
    centery: number;
}

type EffectFrames = Record<number, EffectFrameData>;

export class Effect extends Entity {
    type = 'effect';
    constructor(
        public position: Vector,
        data: EntityData,
    ) {
        super(
            new Mechanics(
                new Rectangle(10, 10),
                {
                    position,
                    mass: 0,
                }
            ),
            new Rectangle(12, 12),
            new Sprite(data.spriteSheet),
            data.data.frame,
            {
                default: {}
            }
        );
        // TODO: choose variant (0 or 10)
        this.frame = 10;
    }
}
