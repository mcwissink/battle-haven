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
BH.menu = new Menu({
    text: 'main menu',
    entries: [
        {
            text: 'select character',
            entries: [
                { text: 'woody', click: selectCharacter(0) },
                { text: 'davis', click: selectCharacter(1) },
                { text: 'louis', click: selectCharacter(2) },
                { text: 'deep', click: selectCharacter(3) },
                { text: 'freeze', click: selectCharacter(4) },
                { text: 'firen', click: selectCharacter(5) },
                { text: 'rudolf', click: selectCharacter(6) },
                { text: 'dennis', click: selectCharacter(7) },
            ],
        },
        {
            text: 'settings',
            entries: [
                { text: 'debug hitbox', click: BH.debugHitbox },
                { text: 'debug mechanics', click: BH.debugMechanics },
            ],
        },
    ]
});


