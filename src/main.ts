import { BattleHaven } from './battle-haven';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const BH = new BattleHaven(canvas, {
    hitStop: 3,
    gravity: 1.7,
    friction: 1,
});

BH.start();

