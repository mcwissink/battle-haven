import { BattleHaven } from "./battle-haven";

export type Vector = [number, number];

export const UP_VECTOR: Vector = [0, -1];

const perpendicular = ([x, y]: Vector): Vector => [y, -x];

export const difference = (vector1: Vector, vector2: Vector): Vector => ([
    vector2[0] - vector1[0],
    vector2[1] - vector1[1],
]);

export const minimum = (vector1: Vector, vector2: Vector): Vector => {
    if (Math.hypot(vector1[0], vector1[0]) < Math.hypot(vector2[0], vector2[1])) {
        return vector1;
    } else {
        return vector2;
    }
}

export const normalize = ([x, y]: Vector): Vector => {
    const magnitude = Math.hypot(x, y) || 1;
    return [x / magnitude, y / magnitude];
}

export const dot = (vector1: Vector, vector2: Vector) => vector1[0] * vector2[0] + vector1[1] * vector2[1];

// TODO: remove duplicate axes
const getNormals = (corners: Vector[]) => corners.reduce<Vector[]>((normals, corner, index) => {
    const previousCorner = index === 0 ? corners[corners.length - 1] : corners[index - 1];
    normals.push(normalize(perpendicular([corner[0] - previousCorner[0], corner[1] - previousCorner[1]])));
    return normals;
}, []);

const project = (axis: Vector, corners: Vector[]): Vector => {
    const cornerProjections = corners.map(corner => dot(corner, axis));
    return [
        Math.min(...cornerProjections),
        Math.max(...cornerProjections),
    ];
};

const overlap = ([min1, max1]: Vector, [min2, max2]: Vector) => {
    if (!(max1 > min2 && max2 > min1)) {
        return 0;
    }
    return max1 > max2 ? max2 - min1 : min2 - max1;
}

export const collide = (shape1: Shape, shape2: Shape): Vector | undefined => {
    // minimum translation vector
    let mtv: Vector = [0, 0];
    let minDistance = Infinity;

    const normals = getNormals(shape1.corners).concat(getNormals(shape2.corners));
    for (const axis of normals) {
        const ov = overlap(project(axis, shape1.corners), project(axis, shape2.corners));
        if (!ov) {
            return;
        }
        const tv: Vector = [axis[0] * ov, axis[1] * ov]
        if (Math.abs(ov) < minDistance) {
            minDistance = Math.abs(ov);
            mtv = tv;
        }
    }
    return mtv;
};

export class Shape {
    public _corners: Vector[] = [];
    public position: Vector = [0, 0];
    public previousPosition: Vector = [0, 0];
    constructor(position?: Vector) {
        if (position) {
            this.position = position;
        }
    }

    follow(position: Vector) {
        this.position = position;
        this.corners;
    }

    get corners() {
        return this._corners;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        this._corners.forEach((corner, index) => {
            if (index) {
                ctx.lineTo(corner[0], corner[1]);
            } else {
                ctx.moveTo(corner[0], corner[1]);
            }
        });
        ctx.closePath();
        ctx.stroke();
    };
}

export class Diamond extends Shape {
    _corners: Vector[] = new Array(4).fill(null).map(() => [0, 0]);
    public halfWidth;
    public halfHeight;
    constructor(width: number, height: number) {
        super();
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }
    get corners(): Vector[] {
        this.previousPosition = [...this.position];
        this._corners[0][0] = this.position[0] - this.halfWidth;
        this._corners[0][1] = this.position[1];
        this._corners[1][0] = this.position[0];
        this._corners[1][1] = this.position[1] + this.halfHeight;
        this._corners[2][0] = this.position[0] + this.halfWidth;
        this._corners[2][1] = this.position[1];
        this._corners[3][0] = this.position[0];
        this._corners[3][1] = this.position[1] - this.halfHeight;
        return this._corners;
    }
}

export class Rectangle extends Shape {
    _corners: Vector[] = new Array(4).fill(null).map(() => [0, 0]);
    public halfWidth;
    public halfHeight;
    constructor(width: number, height: number) {
        super();
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }
    get corners(): Vector[] {
        this.previousPosition = [...this.position];
        this._corners[0][0] = this.position[0] - this.halfWidth;
        this._corners[0][1] = this.position[1] + this.halfHeight;
        this._corners[1][0] = this.position[0] + this.halfWidth;
        this._corners[1][1] = this.position[1] + this.halfHeight;
        this._corners[2][0] = this.position[0] + this.halfWidth;
        this._corners[2][1] = this.position[1] - this.halfHeight;
        this._corners[3][0] = this.position[0] - this.halfWidth;
        this._corners[3][1] = this.position[1] - this.halfHeight;
        return this._corners;
    }
}

export class Mechanics {
    public position: Vector;
    public passthrough?: Vector;
    public velocity: Vector = [0, 0];
    public isGrounded = false;
    public isOverlapping = false;
    public ignorePassthrough = false;
    public mass;
    constructor(
        public game: BattleHaven,
        public shape: Shape,
        {
            mass = 1,
            position = [0, 0],
            passthrough,
        }: {
            mass?: number,
            passthrough?: Vector,
            position?: Vector
        } = {}
    ) {
        this.mass = mass;
        this.position = position;
        this.passthrough = passthrough;
        this.shape.follow(this.position);
    }

    force(force: number, axis = 0, acceleration = force * Math.sign(force)) {
        const direction = Math.sign(force);
        const diff = force * direction - this.velocity[axis] * direction;
        const applied = direction * Math.min(
            diff > 0 ? diff : 0,
            acceleration
        )
        if (applied < 0 && axis) {
            this.velocity[axis] = 0;
        }
        this.velocity[axis] += applied;
    }

    update() {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
        if (this.isGrounded) {
            this.velocity[0] += -Math.sign(this.velocity[0]) * Math.min(Math.abs(this.velocity[0]), this.game.config.friction);
        } else {
            this.velocity[1] += this.mass * this.game.config.gravity;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.isOverlapping ? 'orange' : 'blue';
        this.shape.render(ctx);
    }
}
