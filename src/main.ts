import { BattleHaven } from './battle-haven';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const battleHaven = new BattleHaven(canvas, { gravity: 1 });
battleHaven.start();

