import { BattleHaven } from './battle-haven';
import { Character } from './character';
import { controllers } from './controller';
import { loadData } from './data-loader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

export const mainMenu = (game: BattleHaven) => {
    const selectCharacter = (oid: number) => ({ port }: { port: number }) => {
        const existingCharacter = game.scene.entities.find((entity) => entity.port === port);
        if (existingCharacter) {
            game.destroy(existingCharacter);
        }
        const character = new Character(game, port, game.data.entities[oid]);
        game.scene.entities.push(character);
        game.scene.characters.push(character);
    };

    return {
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
                entries: Object.keys(game.debug).map((key) => ({
                    text: `debug ${key}`,
                    click: () => game.toggleDebug(key as any)
                })),
            },
        ]
    }
};



export const gameOverMenu = (game: BattleHaven) => ({
    text: 'game over',
    entries: [
        {
            text: 'rematch',
            click: () => {
                controllers.ports.forEach((_, port) => {
                    const existingCharacter = game.scene.characters.find((entity) => entity.port === port);
                    if (existingCharacter) {
                        game.destroy(existingCharacter);
                        const character = new Character(game, port, existingCharacter.data);
                        game.scene.entities.push(character);
                        game.scene.characters.push(character);
                        game.menu.setEntries(mainMenu);
                        game.menu.close();
                    }
                });
            }
        },
        { text: 'main menu', click: () => game.menu.setEntries(mainMenu) }
    ],
});

loadData().then((data) => {
    const BH = new BattleHaven(
        canvas,
        data,
        {
            camera: {
                width: 1600,
                height: 900,
                shake: 2,
                follow: 1,
                zoom: 90,
                speed: 50,
            },
            hitStop: 3,
            gravity: 1.7,
            friction: 1,
            health: 750,
        }
    );
    BH.start();
    BH.menu.setEntries(mainMenu);
    BH.menu.open();
});

