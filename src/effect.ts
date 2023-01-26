import { BattleHaven, SpawnTask } from "./battle-haven";
import { EntityData } from "./data-loader";
import { Entity } from "./entity";
import { Mechanics, Rectangle } from "./mechanics";
import { Sprite } from "./sprite";

interface EffectFrameData {
    pic: number;
    wait: number;
    next: number;
    centerx: number;
    centery: number;
}

export type EffectFrames = Record<number, EffectFrameData>;

export class Effect extends Entity {
    type = 'effect';
    constructor(
        public game: BattleHaven,
        public spawnTask: SpawnTask,
        data: EntityData,
    ) {
        super(
            game,
            new Mechanics(
                game,
                new Rectangle(10, 10),
                {
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
        this.reset(spawnTask, data);
    }

    reset(spawnTask: SpawnTask, data: EntityData) {
        this.frames = data.data.frame;
        this.sprite.spriteSheet = data.spriteSheet;
        this.spawnTask = spawnTask;
        const { x, y } = spawnTask.opoint;
        this.mechanics.position = [
            spawnTask.parent.mechanics.position[0] + x,
            spawnTask.parent.mechanics.position[1] + y,
        ];
        this.next.frame = Math.random() > 0.5 ? 999 : 10;
    }
}
