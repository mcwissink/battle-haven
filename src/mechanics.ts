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
    if (max1 < min2 || max2 < min1) {
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

export const collide2 = (m1: Mechanics, m2: Mechanics): Vector | undefined => {
    // minimum translation vector
    let minVMult = Infinity;
    let mtv: Vector = [0, 0];

    const normals = getNormals(m1.shape.corners).concat(getNormals(m2.shape.corners));
    for (const axis of normals) {
        const project1 = project(axis, m1.shape.corners);
        const project2 = project(axis, m2.shape.corners);
        const v = dot(axis, m1.velocity);
        const ov = overlap(project1, project2);
        if (!ov) {
            if (v > 0 && project2[0] >= project1[1]) {
                const vMult = (project2[0] - project1[1]) / v;
                if (vMult < 1) {
                    if (vMult < minVMult) {
                        minVMult = vMult;
                        mtv = axis;
                    }
                } else {
                    return;
                }
            } else if (v < 0 && project1[1] >= project2[0]) {
                const vMult = (project2[1] - project1[0]) / v;
                if (vMult < 1) {
                    if (vMult < minVMult) {
                        minVMult = vMult;
                        mtv = axis;
                    }
                } else {
                    return;
                }
            } else {
                return;
            }
        }
    }

    if (minVMult < 1) {
        const test = dot(mtv, m1.velocity);
        m1.position[0] += m1.velocity[0] * minVMult * 0.99;
        m1.position[1] += m1.velocity[1] * minVMult * 0.99;
        m1.velocity[0] -= mtv[0] * test;
        m1.velocity[1] -= mtv[1] * test;
        return mtv;
    }
};

export interface CollisionResolution {
    time: number;
    velocityCorrection: Vector;
}

export const distance = (axis: Vector, m1: Mechanics, m2: Mechanics) => {
    const perpendicularAxis = perpendicular(axis);
    if (overlap(project(perpendicularAxis, m1.shape.corners), project(perpendicularAxis, m2.shape.corners))) {
        const [min1] = project(axis, m1.shape.corners);
        const [, max2] = project(axis, m2.shape.corners);
        return min1 - max2;
    }
    return Infinity;
}

export const collide3 = (m1: Mechanics, m2: Mechanics, time = 1): CollisionResolution | undefined => {
    let maxOverlapStart = -Infinity;
    let minOverlapEnd = Infinity;
    let collisionVector: Vector = [0, 0];

    const normals = getNormals(m1.shape.corners).concat(getNormals(m2.shape.corners));
    for (const axis of normals) {
        const [min1, max1] = project(axis, m1.shape.corners);
        const [min2, max2] = project(axis, m2.shape.corners);
        const vel: Vector = [
            m2.velocity[0] - m1.velocity[0],
            m2.velocity[1] - m1.velocity[1]
        ];
        const velocityDifference = dot(axis, vel);

        if (velocityDifference > 0) {
            if (max1 < min2 || (m2.passthrough && (m1.ignorePassthrough || dot(normalize(vel), m2.passthrough) < 0))) {
                return;
            } else {
                if ((min1 <= min2 && min2 <= max1) || (min2 <= min1 && min1 <= max2)) {
                    minOverlapEnd = Math.min(minOverlapEnd, (max1 - min2) / velocityDifference);
                } else {
                    const maxOverlapStartAxis = (min1 - max2) / velocityDifference;
                    if (maxOverlapStartAxis > time) {
                        return;
                    }
                    if (maxOverlapStartAxis > maxOverlapStart) {
                        maxOverlapStart = maxOverlapStartAxis;
                        collisionVector = axis;
                    }
                    minOverlapEnd = Math.min(minOverlapEnd, (max1 - min2) / velocityDifference);
                }
                if (minOverlapEnd < maxOverlapStart) {
                    return;
                }
            }
        } else if (velocityDifference < 0) {
            if (max2 < min1 || (m2.passthrough && (m1.ignorePassthrough || dot(normalize(vel), m2.passthrough) < 0))) {
                return;
            } else {
                if ((min2 <= min1 && min1 <= max2) || (min1 <= min2 && min2 <= max1)) {
                    minOverlapEnd = Math.min(minOverlapEnd, (max2 - min1) / -velocityDifference);
                } else {
                    const maxOverlapStartAxis = (min2 - max1) / -velocityDifference;
                    if (maxOverlapStartAxis > time) {
                        return;
                    }
                    if (maxOverlapStartAxis > maxOverlapStart) {
                        maxOverlapStart = maxOverlapStartAxis;
                        collisionVector = axis;
                    }
                    minOverlapEnd = Math.min(minOverlapEnd, (max2 - min1) / -velocityDifference);
                }
                if (minOverlapEnd < maxOverlapStart) {

                    return;
                }
            }
        } else {
            if (!((min2 <= min1 && min1 <= max2) || (min1 <= min2 && min2 <= max1))) {
                return;
            }
        }
    }


    if (minOverlapEnd !== Infinity && maxOverlapStart !== -Infinity) {
        if (m2.passthrough && dot(collisionVector, m2.passthrough) !== 1) {
            return;
        }
        const collisionForce = -dot(collisionVector, [
            m1.velocity[0],
            m1.velocity[1],
        ]);
        return {
            time: maxOverlapStart,
            velocityCorrection: [
                collisionVector[0] * collisionForce * 1.01,
                collisionVector[1] * collisionForce * 1.01
            ],
        };
    }
};

export class Shape {
    public _corners: Vector[] = [];
    public halfWidth = 0;
    public halfHeight = 0;
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
    public distanceToFloor: number = 0;
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
        this.velocity[1] += this.mass * this.game.config.gravity;
        if (this.isGrounded) {
            this.velocity[0] += -Math.sign(this.velocity[0]) * Math.min(Math.abs(this.velocity[0]), this.game.config.friction);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.isOverlapping ? 'orange' : 'blue';
        this.shape.render(ctx);
        ctx.strokeStyle = 'red';
        if (this.distanceToFloor !== Infinity) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.lineTo(this.position[0], this.position[1] + this.shape.halfHeight);
            ctx.lineTo(this.position[0], this.position[1] + this.shape.halfHeight + this.distanceToFloor);
            ctx.closePath();
            ctx.stroke();
            
        }
    }
}
