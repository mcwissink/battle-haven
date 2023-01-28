export interface Body {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Point {
    x: number;
    y: number;
    w?: never;
    h?: never;
}

export type Interaction0 = Body & {
    kind: 0;
    dvx?: number;
    dvy?: number;
    fall: number;
    arest?: number;
    vrest?: number;
    bdefend: number;
    injury: number;
    effect?: number;
}

export type Interaction =
    | Interaction0
    | (Body & {
        kind: 1;
        catchingact: number[];
        caughtact: number[];
    })
    | (Body & {
        kind: 3;
        catchingact: number[];
        caughtact: number[];
    })

export type CatchPoint = Point & {
    kind: 1;
    injury: number;
    vaction: number;
    aaction: number;
    jaction: number;
    taction: number;
    throwvx: number;
    throwvy: number;
    throwvz: number;
    hurtable: number;
    throwinjury: number;
    decrease: number;
    dircontrol: number;
    cover: number;
} | Point & {
    kind: 2;
    fronthurtact: number;
    backhurtact: number;
}

export type ObjectPoint = Point & {
    kind: 1,
    action: number;
    dvx: number;
    dvy: number;
    oid: number;
    facing: number;
}

export type Combo =
    | 'hit_a'
    | 'hit_d'
    | 'hit_j'
    | 'hit_Fa'
    | 'hit_Fj'
    | 'hit_Ua'
    | 'hit_Uj'
    | 'hit_Da'
    | 'hit_jj'
    | 'hit_Dj';

export type FrameData = Record<Combo, number> & {
    name: string;
    pic: number;
    sound: string;
    state: number;
    wait: number;
    next: number;
    dvx: number;
    dvy: number;
    dvz: number;
    centerx: number;
    centery: number;
    bdy?: Array<Body & { kind: number }>;
    itr?: Interaction[];
    opoint: ObjectPoint;
    cpoint?: CatchPoint;
}
