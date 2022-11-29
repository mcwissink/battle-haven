const combos = [
    // { sequence: ['up'], name: 'hit_U', },
    // { sequence: ['down'], name: 'hit_D', },
    // { sequence: ['left'], name: 'hit_F', },
    // { sequence: ['right'], name: 'hit_F', },
    { sequence: ['attack'], name: 'hit_a', },
    { sequence: ['jump'], name: 'hit_j', },
    { sequence: ['defend'], name: 'hit_d', },
    // { sequence: ['down', 'right'], name: 'hit_DF', },
    // { sequence: ['down', 'left'], name: 'hit_DF', },
    { sequence: ['defend', 'right', 'attack'], name: 'hit_Fa', },
    { sequence: ['defend', 'left', 'attack'], name: 'hit_Fa', },
    { sequence: ['defend', 'right', 'jump'], name: 'hit_Fj', },
    { sequence: ['defend', 'left', 'jump'], name: 'hit_Fj', },
    { sequence: ['defend', 'up', 'attack'], name: 'hit_Ua', },
    { sequence: ['defend', 'up', 'jump'], name: 'hit_Uj', },
    { sequence: ['defend', 'down', 'attack'], name: 'hit_Da', },
    { sequence: ['defend', 'down', 'jump'], name: 'hit_Dj', },
    { sequence: ['defend', 'jump', 'attack'], name: 'hit_ja', },
];

export class CircleBuffer<T> {
    private buffer: T[];
    private start = 0;
    constructor(private size: number, defaultValue: T) {
        this.buffer = new Array(this.size).fill(defaultValue);
    }
    push(item: T) {
        this.buffer[this.start] = item;
        this.start = (this.start + 1) % this.size;
    }
    at(index: number): T | undefined {
        if (Math.abs(index) <= this.size) {
            const offset = index < 0 ? this.size + index : index;
            return this.buffer[(this.start + offset) % this.size];
        }
    }
    forEach(callback: (item: T, index: number) => void) {
        for (let i = 0; i < this.size; i++) {
            callback(this.buffer[(this.start + i) % this.size], i);
        }
    }
    reset() {
        this.buffer.length = 0;
    }
}

type ComboInput = 'left' | 'right' | 'up' | 'down' | 'attack' | 'jump' | 'defend' | null;

export interface ControllerState {
    stickX: number;
    stickY: number;
    jump: number;
    defend: number;
    attack: number;
}

export class Controller {
    stickX = 0;
    stickY = 0;
    jump = 0;
    defend = 0;
    attack = 0;

    get stickDirectionX() {
        return Math.sign(this.stickX);
    }

    get stickDirectionY() {
        return Math.sign(this.stickY);
    }

    combo: {
        name: string
        direction: number
    } | null = null;

    buffer = new CircleBuffer<ComboInput>(3, null);

    clearComboBuffer() {
        this.buffer.reset();
    }

    getComboInput(control: keyof ControllerState, magnitude: number): ComboInput | undefined {
        // Prevent repeated key presses
        switch (control) {
            case 'stickX':
                if (magnitude > 0 && this.stickX <= 0) {
                    return 'right';
                }
                if (magnitude < 0 && this.stickX >= 0) {
                    return 'left'
                }
                break;
            case 'stickY':
                if (magnitude < 0 && this.stickY >= 0) {
                    return 'up';
                }
                if (magnitude > 0 && this.stickY <= 0) {
                    return 'down';
                }
                break;
            case 'attack':
                if (magnitude && !this.attack) {
                    return 'attack';
                }
                break;
            case 'defend':
                if (magnitude && !this.defend) {
                    return 'defend'
                }
                break;
            case 'jump':
                if (magnitude && !this.jump) {
                    return 'jump'
                }
                break;
        }
    }

    input(control: keyof ControllerState, magnitude: number) {
        const comboInput = this.getComboInput(control, magnitude);
        if (comboInput) {
            this.buffer.push(comboInput);
            // detect combo
            combos.forEach((combo) => {
                let direction = 0;
                const complete = combo.sequence.reduce((acc, input, index) => {
                    if (input === 'right') {
                        direction = 1;
                    }
                    if (input === 'left') {
                        direction = -1;
                    }
                    return acc && this.buffer.at(index - combo.sequence.length) === input
                }, true);
                if (complete) {
                    this.combo = {
                        name: combo.name,
                        direction,
                    };
                }
            });
        }
        this[control] = magnitude;
    };

    update() { }
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
                        this.input('stickY', -1);
                    } else if (!this.keyboardState.down) {
                        this.input('stickY', 0);
                    }
                    break;
                case 'down':
                    if (active) {
                        this.input('stickY', 1);
                    } else if (!this.keyboardState.up) {
                        this.input('stickY', 0);
                    }
                    break;
                case 'left':
                    if (active) {
                        this.input('stickX', -1);
                    } else if (!this.keyboardState.right) {
                        this.input('stickX', 0);
                    }
                    break;
                case 'right':
                    if (active) {
                        this.input('stickX', 1);
                    } else if (!this.keyboardState.left) {
                        this.input('stickX', 0);
                    }
                    break;
                default:
                    this.input(input, active ? 1 : 0);
                    break;
            }
            return true;
        }
        return false;
    }
}

class GamepadController extends Controller {
    constructor(public gamepad: Gamepad) {
        super();
    }

    update() {
        this.input('attack', this.gamepad.buttons[1].value);
        this.input('defend', this.gamepad.buttons[5].value);
        this.input('jump', this.gamepad.buttons[3].value);
        this.input('stickX', this.gamepad.axes[0]);
        this.input('stickY', this.gamepad.axes[1]);
    }
}

const mappings = [
    {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        z: 'defend',
        x: 'jump',
        c: 'attack',
    },
    {
        i: 'up',
        k: 'down',
        j: 'left',
        l: 'right',
        a: 'defend',
        s: 'jump',
        d: 'attack',
    }
] as const;

type Port = Controller | null;

interface Listeners {
    connect: Array<(port: number) => void>
}

type Flat<T> = T extends Array<infer K> ? K : T;

class ControllerManager {
    ports: [Port, Port, Port, Port] = [null, null, null, null];
    keyboardControllers: KeyboardController[] = [];
    gamepads: Record<number, number> = {};
    listeners: Listeners = {
        connect: [],
    }
    static dummy = new Controller();
    constructor() {
        window.addEventListener('keyup', (e) => {
            if (!this.keyboardControllers.find((c) => c.key(e.key, false))) {
                // If the key is not handled by an existing controller, register a new controller if a matching mapping is found
                const mapping = mappings.find((m) => Object.keys(m).includes(e.key))
                if (mapping) {
                    const controller = new KeyboardController({ mapping })
                    this.keyboardControllers.push(controller);
                    this.connect(controller);
                }
            };
        });

        window.addEventListener('keydown', (e) => {
            this.keyboardControllers.find((c) => c.key(e.key, true));
        });

        window.addEventListener("gamepadconnected", (e) => {
            const port = this.connect(new GamepadController(e.gamepad));
            if (port !== -1) {
                this.gamepads[e.gamepad.index] = port;
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            this.disconnect(this.gamepads[e.gamepad.index]);
        });
    }

    get(port: number) {
        return this.ports[port] ?? ControllerManager.dummy;
    }

    on<T extends keyof Listeners>(event: T, callback: Flat<Listeners[T]>) {
        this.listeners[event].push(callback);
    }

    connect(controller: Controller) {
        const port = this.ports.indexOf(null);
        if (port !== -1) {
            this.ports[port] = controller;
            this.listeners.connect.forEach((callback) => callback(port));
            return port;
        }
        return -1;
    }

    disconnect(port: number) {
        this.ports[port] = null;
    }
}

export const controllers = new ControllerManager();

