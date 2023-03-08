const combos = [
    { sequence: ["attack"], name: "hit_a" },
    { sequence: ["jump"], name: "hit_j" },
    { sequence: ["defend"], name: "hit_d" },
    // { sequence: ['down', 'right'], name: 'hit_DF', },
    // { sequence: ['down', 'left'], name: 'hit_DF', },
    { sequence: ["defend", "right", "attack"], name: "hit_Fa" },
    { sequence: ["defend", "left", "attack"], name: "hit_Fa" },
    { sequence: ["defend", "right", "jump"], name: "hit_Fj" },
    { sequence: ["defend", "left", "jump"], name: "hit_Fj" },
    { sequence: ["defend", "up", "attack"], name: "hit_Ua" },
    { sequence: ["defend", "up", "jump"], name: "hit_Uj" },
    { sequence: ["defend", "down", "attack"], name: "hit_Da" },
    { sequence: ["defend", "down", "jump"], name: "hit_Dj" },
    { sequence: ["defend", "left", "defend"], name: "hit_Fd" },
    { sequence: ["defend", "right", "defend"], name: "hit_Fd" },
    // { sequence: ['up', 'up', 'attack'], name: 'debug_hitbox', },
    // { sequence: ['up', 'up', 'jump'], name: 'debug_mechanics', },
    { sequence: ["menu"], name: "toggle_menu" },
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

type ComboInput =
    | "left"
    | "right"
    | "up"
    | "down"
    | "attack"
    | "jump"
    | "defend"
    | "menu"
    | null;

export interface ControllerState {
    stickX: number;
    stickY: number;
    jump: number;
    defend: number;
    attack: number;
    menu: number;
}

type Combo = {
    name: string;
    direction: number;
};

interface ControllerListener {
    input: Array<(input: string, controller: Controller) => void>;
}

export class Controller {
    public mapping: Record<string, number | string> = {};
    stickX = 0;
    stickY = 0;
    jump = 0;
    defend = 0;
    attack = 0;
    menu = 0;
    listeners: ControllerListener = {
        input: [],
    };

    constructor(public port: number, public config: ControllerConfig) {}

    setConfig(config: ControllerConfig) {
        this.config = config;
    }

    on<T extends keyof ControllerListener>(
        event: T,
        callback: Flat<ControllerListener[T]>
    ) {
        const index = this.listeners[event].indexOf(callback);
        if (index === -1) {
            this.listeners[event].push(callback);
        }
    }

    off<T extends keyof ControllerListener>(
        event: T,
        callback: Flat<ControllerListener[T]>
    ) {
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

    getComboInput(
        control: keyof ControllerState,
        magnitude: number
    ): ComboInput | undefined {
        // Prevent repeated key presses
        switch (control) {
            case "stickX":
                if (magnitude > 0 && this.stickX <= 0) {
                    return "right";
                }
                if (magnitude < 0 && this.stickX >= 0) {
                    return "left";
                }
                break;
            case "stickY":
                if (magnitude < 0 && this.stickY >= 0) {
                    return "up";
                }
                if (magnitude > 0 && this.stickY <= 0) {
                    return "down";
                }
                break;
            case "attack":
                if (magnitude && !this.attack) {
                    return "attack";
                }
                break;
            case "defend":
                if (magnitude && !this.defend) {
                    return "defend";
                }
                break;
            case "jump":
                if (magnitude && !this.jump) {
                    return "jump";
                }
                break;
            case "menu":
                if (magnitude && !this.menu) {
                    return "menu";
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
                    if (input === "right") {
                        direction = 1;
                    }
                    if (input === "left") {
                        direction = -1;
                    }
                    return (
                        acc &&
                        this.buffer.at(index - combo.sequence.length) === input
                    );
                }, true);
                if (complete) {
                    this.combo = {
                        name: combo.name,
                        direction,
                    };
                }
            });

            this.listeners.input.forEach((callback) =>
                callback(comboInput, this)
            );
        }
        this[control] = magnitude;
    }

    async getNextInput(): Promise<any> {}

    update() {}

    key(_key: string, _active: boolean) {
        return false;
    }
}

export class KeyboardController extends Controller {
    private resolveNextInput: ((value: string) => void) | null = null;
    constructor(port: number, config: ControllerConfig) {
        super(port, config);
        this.setConfig(config);
    }

    setConfig(config: ControllerConfig) {
        this.config = config;
        this.mapping = this.config.mapping.keyboard;
    }

    directionState = {
        up: 0,
        down: 0,
        right: 0,
        left: 0,
    };
    key(key: string, active: boolean) {
        if (this.resolveNextInput && active) {
            this.resolveNextInput(key);
        }
        switch (key) {
            case this.mapping.up:
                this.directionState.up = -Number(active);
                this.input(
                    "stickY",
                    this.directionState.up + this.directionState.down
                );
                return true;
            case this.mapping.down:
                this.directionState.down = Number(active);
                this.input(
                    "stickY",
                    this.directionState.up + this.directionState.down
                );
                return true;
            case this.mapping.left:
                this.directionState.left = -Number(active);
                this.input(
                    "stickX",
                    this.directionState.left + this.directionState.right
                );
                return true;
            case this.mapping.right:
                this.directionState.right = Number(active);
                this.input(
                    "stickX",
                    this.directionState.left + this.directionState.right
                );
                return true;
            case this.mapping.attack:
                this.input("attack", Number(active));
                return true;
            case this.mapping.defend:
                this.input("defend", Number(active));
                return true;
            case this.mapping.jump:
                this.input("jump", Number(active));
                return true;
            case this.mapping.menu:
                this.input("menu", Number(active));
                return true;
            default:
                return false;
        }
    }

    async getNextInput() {
        const input = new Promise((resolve) => {
            this.resolveNextInput = resolve;
        });
        await input;
        this.resolveNextInput = null;
        return input;
    }
}

class GamepadController extends Controller {
    private resolveNextInput: ((value: number) => void) | null = null;
    private snapshot: { buttons: number[] } = {
        buttons: [],
    };
    public mapping: Record<string, number> = {};
    constructor(
        port: number,
        config: ControllerConfig,
        public gamepad: Gamepad
    ) {
        super(port, config);
        this.setConfig(config);
    }

    setConfig(config: ControllerConfig) {
        this.config = config;
        this.mapping =
            config.mapping.controller[this.gamepad.id] ??
            DEFAULT_CONTROLLER_MAPPING;
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
        if (this.resolveNextInput) {
            const index = this.gamepad.buttons.findIndex((button, i) => {
                // Ensure buttons that were previously held down a first reset
                if (this.snapshot.buttons[i]) {
                    if (!button.value) {
                        this.snapshot.buttons[i] = 0;
                    }
                    return false;
                } else {
                    return button.value;
                }
            });
            if (index !== -1) {
                this.resolveNextInput(index);
            }
            return;
        }
        this.input("attack", this.gamepad.buttons[this.mapping.attack].value);
        this.input("defend", this.gamepad.buttons[this.mapping.defend].value);
        this.input("jump", this.gamepad.buttons[this.mapping.jump].value);
        this.input("menu", this.gamepad.buttons[this.mapping.menu].value);
        this.input("stickX", this.roundAxis(this.gamepad.axes[0]));
        this.input("stickY", this.roundAxis(this.gamepad.axes[1]));
    }

    async getNextInput() {
        const input = new Promise((resolve) => {
            this.snapshot.buttons = this.gamepad.buttons.map(
                ({ value }) => value
            );
            this.resolveNextInput = resolve;
        });
        await input;
        this.resolveNextInput = null;
        return input;
    }
}

interface ControllerConfig {
    name: string;
    mapping: {
        keyboard: Record<string, string>;
        controller: Record<string, Record<string, number>>;
    };
}

interface ManagerListener {
    connect: Array<(controller: Controller) => void>;
}

type Flat<T> = T extends Array<infer K> ? K : T;

const DEFAULT_CONTROLLER_MAPPING = {
    defend: 5,
    jump: 3,
    attack: 0,
    menu: 7,
};

const DEFAULT_CONTROLLER_CONFIG = {
    "0079-1844-mayflash limited MAYFLASH GameCube Controller Adapter": {
        defend: 5,
        jump: 3,
        attack: 1,
        menu: 9,
    },
    "045e-028e-Microsoft X-Box 360 pad": {
        defend: 5,
        jump: 3,
        attack: 1,
        menu: 7,
    },
};

const DEFAULT_CONTROLLER_NAME = "__default__";
const DEFAULT_CONFIGS: ControllerConfig[] = [
    {
        name: DEFAULT_CONTROLLER_NAME,
        mapping: {
            keyboard: {
                up: "ArrowUp",
                down: "ArrowDown",
                left: "ArrowLeft",
                right: "ArrowRight",
                defend: "z",
                jump: "x",
                attack: "c",
                menu: "Escape",
            },
            controller: DEFAULT_CONTROLLER_CONFIG,
        },
    },
    {
        name: DEFAULT_CONTROLLER_NAME,
        mapping: {
            keyboard: {
                up: "i",
                down: "k",
                left: "j",
                right: "l",
                defend: "a",
                jump: "s",
                attack: "d",
                menu: "Escape",
            },
            controller: DEFAULT_CONTROLLER_CONFIG,
        },
    },
    {
        name: DEFAULT_CONTROLLER_NAME,
        mapping: {
            keyboard: {
                up: "t",
                down: "g",
                left: "f",
                right: "h",
                defend: "q",
                jump: "w",
                attack: "e",
                menu: "Escape",
            },
            controller: DEFAULT_CONTROLLER_CONFIG,
        },
    },
    {
        name: DEFAULT_CONTROLLER_NAME,
        mapping: {
            keyboard: {
                up: "1",
                down: "2",
                left: "3",
                right: "4",
                defend: "5",
                jump: "6",
                attack: "7",
                menu: "Escape",
            },
            controller: DEFAULT_CONTROLLER_CONFIG,
        },
    },
];

const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

type SavedControllerConfigs = Record<string, ControllerConfig>;

export class ControllerManager {
    static dummy = new Controller(-1, DEFAULT_CONFIGS[0]);
    static configKey = "controller/configs";
    ports: [Controller, Controller, Controller, Controller];
    configs: SavedControllerConfigs;
    gamepads: Record<number, number> = {};
    listeners: ManagerListener = {
        connect: [],
    };
    constructor() {
        this.configs = this.loadConfigs();
        this.ports = [
            ControllerManager.dummy,
            ControllerManager.dummy,
            ControllerManager.dummy,
            ControllerManager.dummy,
        ];
        window.addEventListener("keyup", (e) => {
            this.ports.find((controller) => controller.key(e.key, false));
        });

        window.addEventListener("keydown", (e) => {
            if (
                !this.ports.find((controller) => controller.key(e.key, true))
            ) {
                // If the key is not handled by an existing controller, register a new controller if a matching mapping is found
                const config = DEFAULT_CONFIGS.find((config) =>
                    Object.values(config.mapping.keyboard).includes(e.key)
                );
                if (config) {
                    this.connect(
                        (port) => new KeyboardController(port, clone(config))
                    );
                }
            }
        });

        window.addEventListener("gamepadconnected", (e) => {
            const port = this.connect(
                (port) =>
                    new GamepadController(
                        port,
                        clone(DEFAULT_CONFIGS[port]),
                        e.gamepad
                    )
            );
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

    on<T extends keyof ManagerListener>(
        event: T,
        callback: Flat<ManagerListener[T]>
    ) {
        this.listeners[event].push(callback);
    }

    off<T extends keyof ManagerListener>(
        event: T,
        callback: Flat<ManagerListener[T]>
    ) {
        const index = this.listeners[event].indexOf(callback);
        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    connect(buildController: (port: number) => Controller) {
        const port = this.ports.findIndex(
            (controller) => controller === ControllerManager.dummy
        );
        if (port !== -1) {
            const controller = buildController(port);
            this.ports[port] = controller;
            this.listeners.connect.forEach((callback) => callback(controller));
            return port;
        }
        return -1;
    }

    loadConfigs(): SavedControllerConfigs {
        return JSON.parse(
            localStorage.getItem(ControllerManager.configKey) ?? "{}"
        );
    }

    saveConfig(port: number) {
        const configs = this.loadConfigs();
        const config = this.ports[port].config;
        config.name =
            config.name === DEFAULT_CONTROLLER_NAME
                ? (Math.random() + 1).toString(36).substring(4)
                : config.name;
        configs[config.name] = config;
        this.configs = configs;
        localStorage.setItem(
            ControllerManager.configKey,
            JSON.stringify(configs)
        );
        this.setConfig(port, config.name);
    }

    getConfigNames() {
        return Object.keys(this.configs);
    }

    setConfig(port: number, name: string) {
        this.ports[port].setConfig(this.configs[name]);
    }

    clearConfig(port: number) {
        this.ports[port].setConfig(DEFAULT_CONFIGS[port]);
        console.log('set the config');
    }

    disconnect(port: number) {
        this.ports[port] = ControllerManager.dummy;
    }

    async updateMapping(controller: Controller, target: string) {
        controller.mapping[target] = await controller.getNextInput();
    }
}
