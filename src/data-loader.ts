import { davis } from './data/davis';
import { davisBall } from './data/davis-ball';
import { deep } from './data/deep';
import { deepBall } from './data/deep-ball';
import { dennis } from './data/dennis';
import { dennisBall } from './data/dennis-ball';
import { dennisChase } from './data/dennis-chase';
import { effect0 } from './data/effect-0';
import { effect1 } from './data/effect-1';
import { firen } from './data/firen';
import { firenBall } from './data/firen-ball';
import { firenFlame } from './data/firen-flame';
import { freeze } from './data/freeze';
import { freezeBall } from './data/freeze-ball';
import { freezeColumn } from './data/freeze-column';
import { wind } from './data/henry_louis_rudolf_wind';
import { jumpCloud } from './data/jump_cloud.ts';
import { louis } from './data/louis';
import { rudolf } from './data/rudolf';
import { rudolfWeapon } from './data/rudolf-weapon';
import { soundpack } from './data/soundpack';
import { woody } from './data/woody';
import { woodyBall } from './data/woody-ball';
import { modifyData } from './modify-data';
import { SoundPack } from './sound';
import { SpriteSheet } from './sprite';

const entityDataMapping: Record<string, any> = {
    0: woody,
    1: davis,
    2: louis,
    3: deep,
    4: freeze,
    5: firen,
    6: rudolf,
    7: dennis,
    202: rudolfWeapon,
    203: deepBall,
    204: wind,
    205: dennisBall,
    206: woodyBall,
    207: davisBall,
    209: freezeBall,
    210: firenBall,
    211: firenFlame,
    212: freezeColumn,
    215: dennisChase,
    316: jumpCloud,
    300: effect0,
    301: effect1,
}

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

    Object.entries(entityDataMapping).forEach(([key, data]) => {
        gameData.entities[key] = loadEntity(data);
    });

    gameData.soundpacks[1] = {
        audio: await loadAudio(`${soundpack.file}.mp3`),
        mapping: soundpack.sound,
    };

    return gameData;
}



