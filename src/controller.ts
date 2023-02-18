const combos = [
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
    // { sequence: ['up', 'up', 'attack'], name: 'debug_hitbox', },
    // { sequence: ['up', 'up', 'jump'], name: 'debug_mechanics', },
    { sequence: ['menu'], name: 'toggle_menu', },
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

type ComboInput = 'left' | 'right' | 'up' | 'down' | 'attack' | 'jump' | 'defend' | 'menu' | null;

export interface ControllerState {
    stickX: number;
    stickY: number;
    jump: number;
    defend: number;
    attack: number;
    menu: number;
}

type Combo = {
    name: string
    direction: number
};

interface ControllerListener {
    input: Array<(input: string, controller: Controller) => void>
}

export class Controller {
    stickX = 0;
    stickY = 0;
    jump = 0;
    defend = 0;
    attack = 0;
    menu = 0;
    listeners: ControllerListener = {
        input: [],
    }

    constructor(public port: number, public config: ControllerConfig) { }

    on<T extends keyof ControllerListener>(event: T, callback: Flat<ControllerListener[T]>) {
        const index = this.listeners[event].indexOf(callback);
        if (index === -1) {
            this.listeners[event].push(callback);
        }
    }

    off<T extends keyof ControllerListener>(event: T, callback: Flat<ControllerListener[T]>) {
        const index = this.listeners[event].indexOf(callback);
        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    get stickMagnitudeX() {
        return Math.abs(this.stickX);
    }

    get stickDirectionX() {
        return Math.sign(this.stickX);
    }

    get stickDirectionY() {
        return Math.sign(this.stickY);
    }

    combo: Combo | null = null;

    processCombo(callback: (combo: Combo) => boolean | void) {
        if (this.combo) {
            const isConsumed = callback(this.combo);
            if (isConsumed) {
                this.combo = null;
            }
        }
    }

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
            case 'menu':
                if (magnitude && !this.menu) {
                    return 'menu'
                }
                break;
        }
    }

    input(control: keyof ControllerState, magnitude: number) {
        const comboInput = this.getComboInput(control, magnitude);

        if (comboInput) {
            this.listeners.input.forEach((callback) => callback(comboInput, this));
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

    key(_key: string, _active: boolean) { return false; }
}

class KeyboardController extends Controller {
    directionState = {
        up: 0,
        down: 0,
        right: 0,
        left: 0,
    }
    key(key: string, active: boolean) {
        const input = this.config.mapping.keyboard[key];
        if (input) {
            switch (input) {
                case 'up':
                    this.directionState[input] = -Number(active);
                    this.input(
                        'stickY',
                        this.directionState.up + this.directionState.down
                    );
                    break;
                case 'down':
                    this.directionState[input] = Number(active);
                    this.input(
                        'stickY',
                        this.directionState.up + this.directionState.down
                    );
                    break;
                case 'left':
                    this.directionState[input] = -Number(active);
                    this.input(
                        'stickX',
                        this.directionState.left + this.directionState.right
                    );
                    break;
                case 'right':
                    this.directionState[input] = Number(active);
                    this.input(
                        'stickX',
                        this.directionState.left + this.directionState.right
                    );
                    break;
                default:
                    this.input(input as keyof ControllerState, Number(active));
                    break;
            }
            return true;
        }
        return false;
    }
}

class GamepadController extends Controller {
    public mapping: Record<string, number>
    constructor(port: number, config: ControllerConfig, public gamepad: Gamepad) {
        super(port, config);
        console.log(gamepad.id);
        this.mapping = config.mapping.controller[gamepad.id] ?? DEFAULT_CONTROLLER_MAPPING;
    }

    roundAxis(axis: number) {
        const value = Math.abs(axis);
        const sign = Math.sign(axis);
        if (value > 0.75) {
            return 1 * sign;
        } else if (value > 0.25) {
            return 0.5 * sign;
        } else {
            return 0;
        }
    }

    update() {
        this.input('attack', this.gamepad.buttons[this.mapping.attack].value);
        this.input('defend', this.gamepad.buttons[this.mapping.defend].value);
        this.input('jump', this.gamepad.buttons[this.mapping.jump].value);
        this.input('menu', this.gamepad.buttons[this.mapping.menu].value);
        this.input('stickX', this.roundAxis(this.gamepad.axes[0]));
        this.input('stickY', this.roundAxis(this.gamepad.axes[1]));
    }
}

interface ControllerConfig {
    name: string;
    mapping: {
        keyboard: Record<string, string>
        controller: Record<string, Record<string, number>>
    }
}

interface ManagerListener {
    connect: Array<(controller: Controller) => void>
}

type Flat<T> = T extends Array<infer K> ? K : T;

const DEFAULT_CONTROLLER_MAPPING = {
    defend: 5,
    jump: 3,
    attack: 0,
    menu: 7,
};
const DEFAULT_CONFIGS: ControllerConfig[] = [
    {
        name: 'no name',
        mapping: {
            keyboard: {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right',
                z: 'defend',
                x: 'jump',
                c: 'attack',
                Escape: 'menu',
            },
            controller: {
                '045e-028e-Microsoft X-Box 360 pad': {
                    defend: 5,
                    jump: 3,
                    attack: 1,
                    menu: 7,
                },
            }
        }
    },
    {
        name: 'no name',
        mapping: {
            keyboard: {
                i: 'up',
                k: 'down',
                j: 'left',
                l: 'right',
                a: 'defend',
                s: 'jump',
                d: 'attack',
                Escape: 'menu',
            },
            controller: {
                '045e-028e-Microsoft X-Box 360 pad': {
                    defend: 5,
                    jump: 3,
                    attack: 0,
                    menu: 7,
                },
            }
        }
    },
    { name: 'no name', mapping: { keyboard: {}, controller: {} } },
    { name: 'no name', mapping: { keyboard: {}, controller: {} } }
];

class ControllerManager {
    ports: [Controller, Controller, Controller, Controller] = [
        ControllerManager.dummy,
        ControllerManager.dummy,
        ControllerManager.dummy,
        ControllerManager.dummy
    ];
    configs = DEFAULT_CONFIGS;
    gamepads: Record<number, number> = {};
    listeners: ManagerListener = {
        connect: [],
    }
    static dummy = new Controller(-1, DEFAULT_CONFIGS[0]);
    constructor() {
        window.addEventListener('keyup', (e) => {
            if (!this.ports.find((controller) => controller.key(e.key, false))) {
                // If the key is not handled by an existing controller, register a new controller if a matching mapping is found
                const config = this.configs.find((config) => Object.keys(config.mapping.keyboard).includes(e.key))
                if (config) {
                    this.connect((port) => new KeyboardController(port, config));
                }
            };
        });

        window.addEventListener('keydown', (e) => {
            this.ports.find((controller) => controller.key(e.key, true));
        });

        window.addEventListener("gamepadconnected", (e) => {
            const port = this.connect((port) => new GamepadController(port, this.configs[port], e.gamepad));
            if (port !== -1) {
                this.gamepads[e.gamepad.index] = port;
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            this.disconnect(this.gamepads[e.gamepad.index]);
        });
    }

    get(port: number): Controller {
        return this.ports[port] ?? ControllerManager.dummy;
    }

    on<T extends keyof ManagerListener>(event: T, callback: Flat<ManagerListener[T]>) {
        this.listeners[event].push(callback);
    }

    connect(buildController: (port: number) => Controller) {
        const port = this.ports.findIndex((controller) => controller === ControllerManager.dummy);
        if (port !== -1) {
            const controller = buildController(port)
            this.ports[port] = controller;
            this.listeners.connect.forEach((callback) => callback(controller));
            return port;
        }
        return -1;
    }

    disconnect(port: number) {
        this.ports[port] = ControllerManager.dummy;
    }
}

export const controllers = new ControllerManager();

