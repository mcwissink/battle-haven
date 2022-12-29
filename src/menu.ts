import { controllers, Port } from './controller';
import { mod } from './utils';

type EntryState = {
    index: number;
}

interface Entries {
    text: string;
    entries?: Array<Entries>;
    select?: (context: { port: number }) => void;
}

export class Menu {
    cursors = new Map<Port, EntryState>();
    globalCursor: EntryState[] = [];
    constructor(public entries: Array<Entries>) {
        controllers.on('connect', (port) => {
            this.cursors.set(controllers.get(port), {
                index: 0,
            });
        });
    }
    get activeEntries() {
        return this.globalCursor.reduce<Array<Entries>>((acc, cursor) => {
            const { entries } = acc[cursor.index];
            return entries ? entries : acc;
        }, this.entries);
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
                                });
                                this.cursors.forEach((cursor) => cursor.index = 0);
                            } else if (selectedEntry.select) {
                                selectedEntry.select({ port });
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
        this.activeEntries.forEach((entry, index) => {
            const offsetX = 10;
            const offsetY = index * 10 + 20;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
            ctx.fillRect(offsetX, offsetY, 100, -10);
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillText(entry.text, offsetX, offsetY);
        });
        this.cursors.forEach((cursor) => {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.4)';
            ctx.fillRect(5, cursor.index * 10 + 20, 10, -10);
        });
    }
}
