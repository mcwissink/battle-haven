import { modifyData } from './modify-data';
import { SoundPack } from './sound';
import { SpriteSheet } from './sprite';
import { data } from './data/index';

export interface EntityData {
    data: any;
    face: HTMLImageElement | null;
    spriteSheet: SpriteSheet;
}

const context = new AudioContext();
const loadAudio = async (source: string) => {
    const file = await fetch(source.replace('sound', './data'));
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    return buffer;
}

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source.replace('sprite', './data');
    return image;
};

export const animation: Record<string, number> = {
    airborn: 212,
};

const loadEntity = (data: any): EntityData => {
    modifyData(data);
    Object.entries(data.frame).forEach(([frame, frameData]: any) => {
        if (!animation[frameData.name]) {
            animation[frameData.name] = (Number(frame) || 999);
        }
    });

    const images = data.bmp.file.map((file: Record<string, string>) => {
        const filePath = Object.values(file).find((v) => v.includes('sprite'))
        if (!filePath) {
            throw new Error('Missing file path');
        }
        return loadImage(filePath);
    });

    const dimensions =
        (data.bmp.file as any[])
            .map((file: Record<string, string>) => {
                const fileKey = Object.keys(file).find((v) => v.includes('file'))
                const [_, lower, upper] = fileKey?.match(/file\((\d+)-(\d+)\)/) ?? [];
                if (!lower || !upper) {
                    throw new Error('Missing size mapping');
                }
                return [Number(lower), Number(upper)];
            })
            .reduce<Record<number, any>>((acc, [lower, upper], index) => {
                const {
                    w: width,
                    h: height,
                    row: columns,
                    col: rows,
                } = data.bmp.file[index]
                acc[upper] = {
                    imageOffset: index,
                    relativeOffset: lower,
                    width: width + 1,
                    height: height + 1,
                    columns,
                    rows,
                };
                return acc;
            }, {});

    const breakpoints = Object.keys(dimensions).map(Number);

    return {
        data,
        face: data.bmp.head ? loadImage(data.bmp.head) : null,
        spriteSheet: {
            images,
            dimensions(frame: number) {
                return dimensions[breakpoints.find((breakpoint) => frame <= breakpoint) ?? 0]
            }
        }
    }
};

const loadStage = (stage: any) => {
    return {
        ...stage,
        layer: stage.layer.map((layer: any) => ({
            ...layer,
            spriteSheet: {
                images: loadImage(layer.pic)
            }
        })),
    }
};

export type GameData = {
    shadow: HTMLImageElement;
    entities: Record<string, EntityData>;
    soundpacks: Record<string, SoundPack>;
};

export const loadData = async () => {
    const gameData: GameData = {
        shadow: loadImage('./data/shadow.png'),
        entities: {},
        soundpacks: {},
    }

    Object.entries(data.entities).forEach(([key, data]) => {
        gameData.entities[key] = loadEntity(data);
    });

    gameData.soundpacks[1] = {
        audio: await loadAudio(`${data.soundpack.file}.mp3`),
        mapping: data.soundpack.sound,
    };

    return gameData;
}



