import { BattleHaven } from './battle-haven';
import { Controller } from './controller';
import { mod } from './utils';

type EntryState = {
    port: number;
    index: number;
    path: PathEntry[];
}

interface PathEntry {
    index: number;
}

export interface Page {
    text: string;
    isSplit?: boolean;
    isConfirmed?: boolean;
    disableButtonNavigation?: boolean;
    entries?: Array<Page> | ((context: { controller: Controller }) => Array<Page>);
    click?: (context: { port: number }) => void;
    confirm?: (context: Array<{ port: number, index: number }>) => void;
}

export type Component = (game: BattleHaven) => Page;

const ENTRY_HEIGHT = 26;
export class Menu {
    isOpen = true;
    cursors = new Map<Controller, EntryState>();
    globalPath: PathEntry[] = [];
    menu: Page;
    constructor(public game: BattleHaven, public component: Component) {
        this.menu = component(game);
    }

    input = (input: string, controller: Controller) => {
        const cursor = this.cursors.get(controller);
        if (cursor) {
            const goBack = () => {
                const pathEntry = cursor.path.pop()
                if (pathEntry) {
                    this.setIndex(cursor, pathEntry.index);
                } else {
                    const globalPathEntry = this.globalPath.pop();
                    this.cursors.forEach((cursor) => cursor.path = []);
                    this.setIndex(cursor, globalPathEntry?.index ?? 0);
                }
            }
            switch (input) {
                case 'attack': {
                    const selectedEntry = this.getActiveEntries(cursor)[cursor.index];
                    if (selectedEntry.entries) {
                        if (this.globalPage.isSplit) {
                            cursor.path.push({ index: cursor.index });
                        } else {
                            this.globalPath.push({ index: cursor.index });
                        }
                        this.setIndex(cursor, 0);
                    } else if (selectedEntry.click) {
                        selectedEntry.click({ port: controller.port });
                    } else if (selectedEntry.text === 'back') {
                        goBack();
                    }
                    if (this.globalPage.confirm) {
                        let isConfirmed = true;
                        const context: Array<{ port: number; index: number }> = [];
                        this.cursors.forEach((cursor) => {
                            isConfirmed = Boolean(this.getPage(cursor).isConfirmed) && isConfirmed;
                            if (isConfirmed) {
                                context.push({
                                    port: cursor.port,
                                    index: cursor.path[cursor.path.length - 1].index
                                });
                            } 
                        });
                        if (isConfirmed) {
                            this.globalPage.confirm(context);
                        }
                    }
                    break;
                }
                case 'defend': {
                    if (!this.globalPage.disableButtonNavigation) {
                        goBack();
                    }
                    break;
                }
                case 'down': {
                    this.setIndex(cursor, mod(cursor.index + 1, this.getActiveEntries(cursor).length));
                    break;
                }
                case 'up': {
                    this.setIndex(cursor, mod(cursor.index - 1, this.getActiveEntries(cursor).length));
                    break;
                }
                case 'menu': {
                    if (!this.globalPage.disableButtonNavigation) {
                        this.close();
                    }
                    break;
                }
            }
        }

        // Clear any combos built in menu
        controller.processCombo(() => true);
        controller.clearComboBuffer();
    }

    setIndex(cursor: EntryState, index: number) {
        if (this.globalPage.isSplit) {
            cursor.index = index;
        } else {
            this.cursors.forEach((cursor) => cursor.index = index);
        }
    }

    setEntries(component: Component) {
        this.menu = component(this.game);
        this.globalPath = [];
        this.cursors.forEach(cursor => cursor.index = 0);
    }

    traverseEntries(cursor: EntryState, path: PathEntry[]) {
        return path.reduce<Page>((acc, p) => {
            return this.getEntries(cursor, acc.entries)?.[p.index] ?? acc;
        }, this.menu);
    }

    get globalPage() {
        const cursor = Array.from(this.cursors.values())[0];
        return this.traverseEntries(cursor, this.globalPath);
    }

    getPage(cursor: EntryState) {
        return this.traverseEntries(cursor, this.globalPath.concat(cursor.path));
    }

    getEntries(cursor: EntryState, entries?: Page['entries']) {
        if (typeof entries === 'function') {
            return entries({ controller: this.game.controllers.get(cursor.port) });
        }
        return entries ?? [];
    }

    getActiveEntries(cursor: EntryState): Array<Page> {
        return this.getEntries(cursor, this.getPage(cursor).entries);
    }

    open() {
        this.game.controllers.on('connect', (controller) => {
            controller.on('input', this.input);
            this.cursors.set(controller, {
                index: this.globalPage.isSplit ? 0 : Array.from(this.cursors.values())[0]?.index ?? 0,
                port: controller.port,
                path: [],
            });
        });
        this.game.controllers.ports.forEach((controller) => {
            if (controller) {
                controller.on('input', this.input);
            }
        });
        this.isOpen = true;
    }
    close() {
        this.game.controllers.ports.forEach((controller) => {
            if (controller) {
                controller.off('input', this.input);
            }
        });
        this.globalPath = [];
        this.cursors.forEach((cursor) => cursor.path = []);
        this.isOpen = false;
    }
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        if (!this.isOpen) {
            return;
        }

        ctx.save();
        ctx.font = '20px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 1600, 900);

        ctx.translate(400, 200);

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(
            0,
            ENTRY_HEIGHT,
            this.globalPage.text.length * 12 + 20,
            -ENTRY_HEIGHT
        );

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillText(this.globalPage.text, 10, 20);

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        const maxEntryLength = this.game.controllers.ports.reduce((acc, controller) => {
            const cursor = this.cursors.get(controller);
            return cursor ? Math.max(this.getActiveEntries(cursor).length, acc) : acc;
        }, this.globalPage.entries?.length || 0);
        ctx.fillRect(
            0,
            ENTRY_HEIGHT,
            800,
            ENTRY_HEIGHT * maxEntryLength + 36,
        );

        ctx.translate(10, 10 + ENTRY_HEIGHT * 2);

        this.game.controllers.ports.forEach((controller, port) => {
            const cursor = this.cursors.get(controller) ?? (port ? undefined : { index: 0, port: -1, path: [] });
            if (!cursor) {
                return;
            }
            ctx.save();
            if (this.globalPage.isSplit) {
                ctx.translate(200 * port, 0);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            this.getActiveEntries(cursor).forEach((entry, index) => {
                ctx.fillText(
                    entry.text,
                    40,
                    index * ENTRY_HEIGHT
                );
            });

            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.strokeRect(
                0,
                -ENTRY_HEIGHT,
                this.globalPage.isSplit ? 180 : 780,
                ENTRY_HEIGHT * this.getActiveEntries(cursor).length + 16 
            );

            if (cursor) {
                ctx.fillText(
                    '>',
                    12,
                    cursor.index * ENTRY_HEIGHT
                );
            }
            ctx.restore();
        });
        ctx.restore();
    }
}
