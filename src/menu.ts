import { Controller, controllers, Port } from './controller';
import { mod } from './utils';

type EntryState = {
    port: number;
    index: number;
}

export interface Entries {
    text: string;
    entries?: Array<Entries>;
    click?: (context: { port: number }) => void;
}

const ENTRY_HEIGHT = 26;
export class Menu {
    isOpen = true;
    cursors = new Map<Port, EntryState>();
    menuCursor: EntryState[] = [];
    constructor(public entries: Entries) {
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
                    const selectedEntry = this.activeEntries[cursor.index];
                    if (selectedEntry.entries) {
                        this.menuCursor.push({
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
                    const globalCursor = this.menuCursor.pop();
                    if (globalCursor) {
                        this.cursors.forEach((cursor) => cursor.index = globalCursor.index);
                    }
                    return true;
                }
                case 'down': {
                    cursor.index = mod(cursor.index + 1, this.activeEntries.length);
                    return true;
                }
                case 'up': {
                    cursor.index = mod(cursor.index - 1, this.activeEntries.length);
                    return true;
                }
            }
        }
    }

    setEntries(entries: Entries) {
        this.entries = entries;
        this.menuCursor = [];
        this.cursors.forEach(cursor => cursor.index = 0);
    }
    traverseEntries(cursor: EntryState[]) {
        return cursor.reduce<Entries>((acc, c) => {
            return acc.entries?.[c.index] ?? acc;
        }, this.entries);
    }
    get title() {
        return this.traverseEntries(this.menuCursor).text;
    }
    get activeEntries() {
        return this.traverseEntries(this.menuCursor).entries ?? [];
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
        if (!this.isOpen) {
            return;
        }
        ctx.font = '20px mono';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, 1600, 900);

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(
            0,
            ENTRY_HEIGHT,
            this.title.length * 12 + 20,
            -ENTRY_HEIGHT
        );
        const width = this.activeEntries.reduce((acc, entry) => Math.max(acc, entry.text.length), 0);
        this.activeEntries.forEach((_, index) => {
            ctx.fillRect(
                0,
                (index + 2) * ENTRY_HEIGHT,
                width * 12 + 100,
                -ENTRY_HEIGHT);
        });

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillText(this.title, 10, 20);
        this.activeEntries.forEach((entry, index) => {
            ctx.fillText(
                entry.text,
                80,
                (index + 2) * ENTRY_HEIGHT - 6
            );
        });
        this.cursors.forEach((cursor) => {
            ctx.fillText(
                String(cursor.port),
                cursor.port * 16 + 12,
                (cursor.index + 2) * ENTRY_HEIGHT - 6,
            );
        });
    }
}
