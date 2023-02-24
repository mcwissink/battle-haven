import { BattleHaven } from './battle-haven';
import { Mechanics, Rectangle, Diamond, UP_VECTOR } from './mechanics';
import { Character } from './character';
import { loadData } from './data-loader';
import { Page } from './menu';
import { Scene } from './scene';
import { EntityData } from './data-loader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const READY: Page[] = [{ text: 'Ready' }];

const level = (game: BattleHaven) => ({
    platforms: [
        new Mechanics(game, new Rectangle(200, 20), { position: [500, 245], passthrough: UP_VECTOR }),
        new Mechanics(game, new Rectangle(200, 20), { position: [800, 150], passthrough: UP_VECTOR }),
        new Mechanics(game, new Rectangle(200, 20), { position: [1100, 245], passthrough: UP_VECTOR }),
        new Mechanics(game, new Diamond(1000, 120), { position: [800, 350] }),
        new Mechanics(game, new Rectangle(1000, 120), { position: [800, 400] }),
        new Mechanics(game, new Rectangle(150, 600), { position: [5, 210] }),
        new Mechanics(game, new Rectangle(1500, 100), { position: [800, 510] }),
        new Mechanics(game, new Rectangle(150, 600), { position: [1600, 210] }),
    ],
});

export const mainMenu = (game: BattleHaven): Page => {
    return {
        text: 'main menu',
        entries: [
            {
                text: 'select character',
                isSplit: true,
                confirm: (context) => {
                    game.scene = new Scene(game, level(game));
                    context.forEach(({ port, index: oid }) => {
                        const character = new Character(game, port, game.data.entities[oid]);
                        game.scene.entities.push(character);
                        game.scene.characters.push(character);
                        game.menu.close();
                    });
                },
                entries: [
                    { text: 'woody', entries: READY, isConfirmed: true },
                    { text: 'davis', entries: READY, isConfirmed: true },
                    { text: 'louis', entries: READY, isConfirmed: true },
                    { text: 'deep', entries: READY, isConfirmed: true },
                    { text: 'freeze', entries: READY, isConfirmed: true },
                    { text: 'firen', entries: READY, isConfirmed: true },
                    { text: 'rudolf', entries: READY, isConfirmed: true },
                    { text: 'dennis', entries: READY, isConfirmed: true },
                ],
            },
            {
                text: 'settings',
                entries: [
                    {
                        text: 'fullscreen',
                        // TODO: Add listener on canvas to rescale when changing screen size
                        click: () => document.fullscreenElement ? document.exitFullscreen() : canvas.requestFullscreen(),
                    },
                    {
                        text: 'controllers',
                        isSplit: true,
                        disableButtonNavigation: true,
                        entries: ({ controller }) => [
                            ...Object.entries(controller.mapping).map(([target, source]) => ({
                                text: `${target.padEnd(7)}: ${source}`,
                                click: () => game.controllers.updateMapping(controller, target),
                            })),
                            {
                                text: 'back',
                            },
                        ]
                    },
                    {
                        text: 'back',
                    },
                ],
            },
            {
                text: 'debug',
                entries: [
                    ...Object.keys(game.debug).map((key) => ({
                        text: `debug ${key}`,
                        click: () => game.toggleDebug(key as any)
                    })),
                    {
                        text: 'back',
                    },
                ],
            },
        ]
    }
};



export const gameOverMenu = (game: BattleHaven): Page => ({
    text: 'game over',
    entries: [
        {
            text: 'rematch',
            click: () => {
                const characters = game.controllers.ports.reduce<Record<number, EntityData>>((acc, _, port) => {
                    const character = game.scene.characters.find((entity) => entity.port === port);
                    if (character) {
                        acc[port] = character.data;
                    }
                    return acc;
                }, {});
                game.scene = new Scene(game, level(game));
                Object.entries(characters).forEach(([port, data]) => {
                    const character = new Character(game, Number(port), data);
                    game.scene.entities.push(character);
                    game.scene.characters.push(character);
                });
                game.menu.setEntries(mainMenu);
                game.menu.close();
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
            friction: 1.5,
            health: 750,
        }
    );
    BH.start();
    BH.menu.setEntries(mainMenu);
    BH.menu.open();
});

