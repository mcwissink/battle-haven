export interface ControllerState {
    stickX: number;
    stickY: number;
    jump: number;
    defend: number;
    attack: number;
}
export class Controller {
    state: ControllerState = {
        stickX: 0,
        stickY: 0,
        jump: 0,
        defend: 0,
        attack: 0,
    }

    buffer: Array<[keyof ControllerState, number]> = [];

    update(control: keyof ControllerState, magnitude: number) {
        this.buffer.push([control, magnitude]);
    };

    fetch() {
        this.buffer.forEach(([control, magnitude]) => this.state[control] = magnitude);
        this.buffer.length = 0;
    }
}

interface KeyboardControllerConfig {
    mapping: Record<string, 'up' | 'down' | 'left' | 'right' | keyof ControllerState>;
}

class KeyboardController extends Controller {
    mapping: KeyboardControllerConfig['mapping'];
    keyboardState: Record<string, boolean> = {
        up: false,
        down: false,
        right: false,
        left: false,
    }
    constructor(config: KeyboardControllerConfig) {
        super();
        this.mapping = config.mapping;
    }
    key(key: string, active: boolean) {
        const input = this.mapping[key];
        if (input) {
            this.keyboardState[input] = active;
            switch (input) {
                case 'up':
                    if (active) {
                        this.update('stickY', 1);
                    } else if (!this.keyboardState.down) {
                        this.update('stickY', 0);
                    }
                    break;
                case 'down':
                    if (active) {
                        this.update('stickY', -1);
                    } else if (!this.keyboardState.up) {
                        this.update('stickY', 0);
                    }
                    break;
                case 'left':
                    if (active) {
                        this.update('stickX', -1);
                    } else if (!this.keyboardState.right) {
                        this.update('stickX', 0);
                    }
                    break;
                case 'right':
                    if (active) {
                        this.update('stickX', 1);
                    } else if (!this.keyboardState.left) {
                        this.update('stickX', 0);
                    }
                    break;
                default:
                    this.update(input, active ? 1 : 0);
                    break;
            }
        }
    }
}

export const keyboardControllers = [
    new KeyboardController({
        mapping: {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            z: 'attack',
            x: 'jump',
            c: 'defend',
        }
    })
];

window.addEventListener('keyup', (e) => {
    keyboardControllers.forEach((keyboardController) => keyboardController.key(e.key, false));
});

window.addEventListener('keydown', (e) => {
    keyboardControllers.forEach((keyboardController) => keyboardController.key(e.key, true));
});
