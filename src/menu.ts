import { controllers, Port } from './controller';
import { mod } from './utils';

type EntryState = {
    port: number;
    index: number;
}

interface Entries {
    text: string;
    entries?: Array<Entries>;
    click?: (context: { port: number }) => void;
}

const ENTRY_HEIGHT = 26;
export class Menu {
    cursors = new Map<Port, EntryState>();
    globalCursor: EntryState[] = [];
    constructor(public entries: Entries) {
        controllers.on('connect', (port) => {
            this.cursors.set(controllers.get(port), {
                index: 0,
                port,
            });
        });
    }
    traverseEntries(cursor: EntryState[]) {
        return cursor.reduce<Entries>((acc, c) => {
            return acc.entries?.[c.index] ?? acc;
        }, this.entries);
    }
    get title() {
        return this.traverseEntries(this.globalCursor).text;
    }
    get activeEntries() {
        return this.traverseEntries(this.globalCursor).entries ?? [];
    }
    update() {
        controllers.ports.forEach((controller, port) => {
            const cursor = this.cursors.get(controller);
            if (controller && cursor) {
                controller.processCombo(combo => {
                    switch (combo.name) {
                        case 'hit_a': {
                            const selectedEntry = this.activeEntries[cursor.index];
                            if (selectedEntry.entries) {
                                this.globalCursor.push({
                                    index: cursor.index,
                                    port: -1,
                                });
                                this.cursors.forEach((cursor) => cursor.index = 0);
                            } else if (selectedEntry.click) {
                                selectedEntry.click({ port });
                            }
                            return true;
                        }
                        case 'hit_d': {
                            const globalCursor = this.globalCursor.pop();
                            if (globalCursor) {
                                this.cursors.forEach((cursor) => cursor.index = globalCursor.index);
                            }
                            return true;
                        }
                        case 'hit_D': {
                            cursor.index = mod(cursor.index + 1, this.activeEntries.length);
                            return true;
                        }
                        case 'hit_U': {
                            cursor.index = mod(cursor.index - 1, this.activeEntries.length);
                            return true;
                        }
                    }
                });
            }
        });
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, 1600, 900);

        ctx.font = '20px mono';

        ctx.fillStyle = 'rgba(0, 0, 0)';
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
