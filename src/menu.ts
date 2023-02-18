import { BattleHaven } from './battle-haven';
import { Controller, controllers } from './controller';
import { mod } from './utils';

type EntryState = {
    port: number;
    index: number;
}

export interface Page {
    text: string;
    multiple?: boolean;
    entries?: Array<Page>;
    click?: (context: { port: number }) => void;
}

export type Component = (game: BattleHaven) => Page;

const ENTRY_HEIGHT = 26;
export class Menu {
    isOpen = true;
    cursors = new Map<Controller, EntryState>();
    pageCursor: EntryState[] = [];
    menu: Page;
    constructor(public game: BattleHaven, public component: Component) {
        this.menu = component(game);
        controllers.on('connect', (controller) => {
            controller.on('input', this.input);
            this.cursors.set(controller, {
                index: 0,
                port: controller.port,
            });
        });
    }

    input = (input: string, controller: Controller) => {
        const cursor = this.cursors.get(controller);
        if (cursor) {
            switch (input) {
                case 'attack': {
                    const selectedEntry = this.entries[cursor.index];
                    if (selectedEntry.entries) {
                        this.pageCursor.push({
                            index: cursor.index,
                            port: -1,
                        });
                        this.cursors.forEach((cursor) => cursor.index = 0);
                    } else if (selectedEntry.click) {
                        selectedEntry.click({ port: controller.port });
                    }
                    return true;
                }
                case 'defend': {
                    const pageCursorEntry = this.pageCursor.pop();
                    if (pageCursorEntry) {
                        this.setIndex(cursor, pageCursorEntry.index);
                    }
                    return true;
                }
                case 'down': {
                    this.setIndex(cursor, mod(cursor.index + 1, this.entries.length));
                    return true;
                }
                case 'up': {
                    this.setIndex(cursor, mod(cursor.index - 1, this.entries.length));
                    return true;
                }
            }
        }
    }

    setIndex(cursor: EntryState, index: number) {
        if (this.page.multiple) {
            cursor.index = index;
        } else {
            this.cursors.forEach((cursor) => cursor.index = index);
        }
    }

    setEntries(component: Component) {
        this.menu = component(this.game);
        this.pageCursor = [];
        this.cursors.forEach(cursor => cursor.index = 0);
    }

    traverseEntries(cursor: EntryState[]) {
        return cursor.reduce<Page>((acc, c) => {
            return acc.entries?.[c.index] ?? acc;
        }, this.menu);
    }
    get page() {
        return this.traverseEntries(this.pageCursor);
    }
    get entries() {
        return this.page.entries ?? [];
    }
    open() {
        controllers.ports.forEach((controller) => {
            if (controller) {
                controller.on('input', this.input);
            }
        });
        this.isOpen = true;
    }
    close() {
        controllers.ports.forEach((controller) => {
            if (controller) {
                controller.off('input', this.input);
            }
        });
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
        ctx.save();
        if (!this.isOpen) {
            return;
        }
        ctx.font = '20px mono';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 1600, 900);

        ctx.translate(400, 200);

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(
            0,
            ENTRY_HEIGHT,
            this.page.text.length * 12 + 20,
            -ENTRY_HEIGHT
        );

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillText(this.page.text, 10, 20);

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(
            0,
            ENTRY_HEIGHT,
            800,
            ENTRY_HEIGHT * this.entries.length + 36,
        );

        ctx.translate(10, 10 + ENTRY_HEIGHT * 2);

        controllers.ports.forEach((controller, port) => {
            const cursor = this.cursors.get(controller) ?? (port ? undefined : { index: 0 });
            if (!cursor && !this.page.multiple) {
                return;
            }
            ctx.save();
            if (this.page.multiple) {
                ctx.translate(200 * port, 0);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            this.entries.forEach((entry, index) => {
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
                this.page.multiple ? 180 : 780,
                ENTRY_HEIGHT * this.entries.length + 16 
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
