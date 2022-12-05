import { davis } from './data/davis';
import { davisBall } from './data/davis-ball';
import { deep } from './data/deep';
import { deepBall } from './data/deep-ball';
import { firen } from './data/firen';
import { firenBall } from './data/firen-ball';
import { firenFlame } from './data/firen-flame';
import { freeze } from './data/freeze';
import { freezeBall } from './data/freeze-ball';
import { freezeColumn } from './data/freeze-column';
import { wind } from './data/henry_louis_rudolf_wind';
import { louis } from './data/louis';
import { woody } from './data/woody';
import { woodyBall } from './data/woody-ball';
import { modifyData } from './modify-data';
import { SpriteSheet } from './sprite';

const entityDataMapping: Record<string, any> = {
    0: woody,
    1: davis,
    2: louis,
    3: deep,
    4: freeze,
    5: firen,
    203: deepBall,
    204: wind,
    206: woodyBall,
    207: davisBall,
    209: freezeBall,
    210: firenBall,
    211: firenFlame,
    212: freezeColumn,
}

export interface EntityData {
    data: any;
    spriteSheet: SpriteSheet;
}

const loadImage = (source: string) => {
    const image = new Image();
    image.src = source;
    return image;
};

export const animation: Record<string, number> = {
    airborn: 212,
};

const loadData = (data: any): EntityData => {
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
        return loadImage(filePath.replace('sprite', './data'));
    });
    const {
        w: width,
        h: height,
        row: columns,
        col: rows,
    } = data.bmp.file[0];
    return {
        data,
        spriteSheet: {
            images,
            width: width + 1,
            height: height + 1,
            rows,
            columns,
        }
    }
};

export const entityData: Record<string, EntityData> = {};

Object.keys(entityDataMapping).forEach((key) => {
    entityData[key] = loadData(entityDataMapping[key]);
});


