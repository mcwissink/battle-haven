import { BattleHaven } from './battle-haven';
import { Character } from './character';
import { entityData } from './data-loader';
import { Menu } from './menu';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const BH = new BattleHaven(canvas, {
    hitStop: 2,
    gravity: 1.7,
    friction: 1,
    health: 750,
});


const selectCharacter = (oid: number) => ({ port }: { port: number }) => {
    const existingCharacter = BH.scene.entities.find((entity) => entity.port === port);
    if (existingCharacter) {
        BH.destroy(existingCharacter);
    }
    BH.scene.entities.push(new Character(port, entityData[oid]));
};

BH.start();
BH.menu = new Menu([
    { text: 'woody', select: selectCharacter(0) },
    { text: 'davis', select: selectCharacter(1) },
    { text: 'louis', select: selectCharacter(2) },
    { text: 'deep', select: selectCharacter(3) },
    { text: 'freeze', select: selectCharacter(4) },
    { text: 'firen', select: selectCharacter(5) },
    { text: 'rudolf', select: selectCharacter(6) },
    { text: 'dennis', select: selectCharacter(7) },
]);


