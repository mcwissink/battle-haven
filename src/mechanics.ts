const gravity = 1.7;
const friction = 1;

export type Vector = [number, number];

export const UP_VECTOR: Vector = [0, 1];

const perpendicular = ([x, y]: Vector): Vector => [x, -y];

export const normalize = ([x, y]: Vector): Vector => {
    const magnitude = Math.hypot(x, y) || 1;
    return [x / magnitude, y / magnitude];
}

export const dot = (vector1: Vector, vector2: Vector) => vector1[0] * vector2[0] + vector1[1] * vector2[1];

// TODO: remove duplicate axes
const getAxes = (corners: Vector[]) => corners.reduce<Vector[]>((axes, corner, index) => {
    const previousCorner = index === 0 ? corners[corners.length - 1] : corners[index - 1];
    axes.push(normalize(perpendicular([corner[0] - previousCorner[0], corner[1] - previousCorner[1]])));
    return axes;
}, []);

const project = (axis: Vector, corners: Vector[]) => corners.reduce<Vector>((projection, corner) => {
    const product = dot(corner, axis);
    if (product < projection[0]) {
        projection[0] = product;
    }
    if (product > projection[1]) {
        projection[1] = product;
    }
    return projection;
}, [Infinity, -Infinity]);

export const collide = (shape1: Shape, shape2: Shape): Vector | undefined => {
    // minimum translation vector
    let mtv: Vector = [0, 0];
    let minDistance = Infinity;

    const axes = getAxes(shape1.corners).concat(getAxes(shape2.corners));
    for (const axis of axes) {
        const [min1, max1] = project(axis, shape1.corners);
        const [min2, max2] = project(axis, shape2.corners);
        const overlaps = [[max1, min2, 1], [max2, min1, -1]];
        for (const [p1, p2, sign] of overlaps) {
            if (p1 <= p2) {
                return;
            }
            const overlap = sign * (p1 - p2);
            // if (Math.abs(overlap) < Math.abs(minOverlap)) {
            //     minOverlap = overlap;
            //     mtv = [axis[0] * minOverlap, axis[1] * minOverlap];
            // }
            const tv: Vector = [axis[0] * overlap, axis[1] * overlap]
            const distance = Math.hypot(
                shape1.previousPosition[0] - (shape1.position[0] - tv[0]),
                shape1.previousPosition[1] - (shape1.position[1] - tv[1]),
            );
            if (distance < minDistance) {
                minDistance = distance;
                mtv = tv;
            }
        }
    }
    return mtv;
};

export class Shape {
    public corners: Vector[] = [];
    public position: Vector = [0, 0];
    public previousPosition: Vector = [0, 0];
    update(_position: Vector): Vector[] {
        return [];
    };
    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(100, 0, 0, 0.4)';
        ctx.beginPath();
        this.corners.forEach((corner, index) => {
            if (index) {
                ctx.lineTo(corner[0], corner[1]);
            } else {
                ctx.moveTo(corner[0], corner[1]);
            }
        });
        ctx.closePath();
        ctx.fill();
    };
}

export class Diamond extends Shape {
    public corners: Vector[] = new Array(4).fill(null).map(() => [0, 0]);
    public halfWidth;
    public halfHeight;
    constructor(width: number, height: number) {
        super();
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }
    update(position: Vector): Vector[] {
        this.previousPosition = [...this.position];
        this.position = [...position];
        this.corners[0][0] = position[0] - this.halfWidth;
        this.corners[0][1] = position[1];
        this.corners[1][0] = position[0];
        this.corners[1][1] = position[1] + this.halfHeight;
        this.corners[2][0] = position[0] + this.halfWidth;
        this.corners[2][1] = position[1];
        this.corners[3][0] = position[0];
        this.corners[3][1] = position[1] - this.halfHeight;
        return this.corners;
    }
}

export class Rectangle extends Shape {
    public corners: Vector[] = new Array(4).fill(null).map(() => [0, 0]);
    public halfWidth;
    public halfHeight;
    constructor(width: number, height: number) {
        super();
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }
    update(position: Vector): Vector[] {
        this.previousPosition = [...this.position];
        this.position = [...position];
        this.corners[0][0] = position[0] - this.halfWidth;
        this.corners[0][1] = position[1] + this.halfHeight;
        this.corners[1][0] = position[0] + this.halfWidth;
        this.corners[1][1] = position[1] + this.halfHeight;
        this.corners[2][0] = position[0] + this.halfWidth;
        this.corners[2][1] = position[1] - this.halfHeight;
        this.corners[3][0] = position[0] - this.halfWidth;
        this.corners[3][1] = position[1] - this.halfHeight;
        return this.corners;
    }
}

export class Mechanics {
    public position: Vector;
    public velocity = [0, 0];
    public isGrounded = true;
    public mass;
    constructor(public shape: Shape, { mass = 1, position = [0, 0] }: { mass?: number, position?: Vector } = {}) {
        this.mass = mass;
        this.position = position;
        this.shape.update(this.position);
    }

    force(force: number, axis = 0) {
        const applied = Math.sign(force) * Math.min(Math.abs(force), Math.abs(force - this.velocity[axis]))
        if (applied < 0 && axis) {
            this.velocity[axis] = 0;
        }
        this.velocity[axis] += applied;

    }

    update() {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
        if (this.isGrounded) {
            this.velocity[0] += -Math.sign(this.velocity[0]) * Math.min(Math.abs(this.velocity[0]), friction);
        } else {
            this.velocity[1] += this.mass * gravity;
        }
        this.shape.update(this.position);
    }

    render(ctx: CanvasRenderingContext2D) {
        this.shape.update(this.position);
        this.shape.render(ctx);
    }
}
