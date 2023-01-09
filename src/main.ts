import { BattleHaven } from './battle-haven';
import { Character } from './character';
import { controllers } from './controller';
import { entityData } from './data-loader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const BH = new BattleHaven(canvas, {
    camera: {
        width: 1600,
        height: 900,
        shake: 2,
        follow: 0.5,
        zoom: 150,
    },
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
    const character = new Character(port, entityData[oid]);
    BH.scene.entities.push(character);
    BH.scene.characters.push(character);
};

export const mainMenu = {
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
            entries: Object.keys(BH.debug).map((key) => ({
                text: `debug ${key}`,
                click: () => BH.toggleDebug(key as any)
            })),
        },
    ]
};



export const gameOverMenu = {
    text: 'game over',
    entries: [
        {
            text: 'rematch',
            click: () => {
                controllers.ports.forEach((_, port) => {
                    const existingCharacter = BH.scene.characters.find((entity) => entity.port === port);
                    if (existingCharacter) {
                        BH.destroy(existingCharacter);
                        const character = new Character(port, existingCharacter.data);
                        BH.scene.entities.push(character);
                        BH.scene.characters.push(character);
                        BH.openMenu(mainMenu);
                        BH.showMenu = false;
                    }
                });
            }
        },
        { text: 'main menu', click: () => BH.openMenu(mainMenu) }
    ],
}

BH.start();
BH.openMenu(mainMenu);


