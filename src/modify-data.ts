const customFrames = {
    392: {
        name: "drop",
        pic: 64, state: 22, wait: 0, next: 0, dvx: 0, dvy: 0, dvz: 0, centerx: 39, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0,
        bpoint: {
            x: 36, y: 30
        },
        wpoint: {
            kind: 1, x: 25, y: 37, weaponact: 35, attacking: 0, cover: 0, dvx: 0, dvy: 0, dvz: 0
        },
        bdy: [
            {
                kind: 0, x: 20, y: 5, w: 27, h: 38
            },
            {
                kind: 0, x: 16, y: 37, w: 36, h: 22
            }
        ]
    },
    394: {
        name: "double_jump",
        pic: 58, state: 21, wait: 1, next: 395, dvx: 0, dvy: 0, dvz: 0, centerx: 39, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0, hit_Da: 260, hit_Ua: 70,
        wpoint: {
            kind: 1, x: 38, y: 75, weaponact: 22, attacking: 0, cover: 1, dvx: 0, dvy: 0, dvz: 0
        },
        itr: {
            kind: 7, x: 36, y: 54, w: 13, h: 25, vrest: 1
        }
    },
    395: {
        name: "double_jump",
        pic: 58, state: 21, wait: 1, next: 396, dvx: 0, dvy: 0, dvz: 0, centerx: 39, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0, hit_Da: 260, hit_Ua: 70,
        wpoint: {
            kind: 1, x: 38, y: 75, weaponact: 22, attacking: 0, cover: 1, dvx: 0, dvy: 0, dvz: 0
        },
        itr: {
            kind: 7, x: 36, y: 54, w: 13, h: 25, vrest: 1
        }
    },
    396: {
        name: "double_jump",
        pic: 59, state: 21, wait: 1, next: 397, dvx: 0, dvy: 0, dvz: 0, centerx: 34, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0, hit_Da: 260, hit_Ua: 70,
        wpoint: {
            kind: 1, x: 43, y: 47, weaponact: 31, attacking: 0, cover: 1, dvx: 0, dvy: 0, dvz: 0
        },
        itr: {
            kind: 7, x: 36, y: 54, w: 13, h: 25, vrest: 1
        }
    },
    397: {
        name: "double_jump",
        pic: 69, state: 21, wait: 1, next: 398, dvx: 0, dvy: 0, dvz: 0, centerx: 34, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0, hit_Da: 260, hit_Ua: 70,
        wpoint: {
            kind: 1, x: 20, y: 61, weaponact: 25, attacking: 0, cover: 1, dvx: 0, dvy: 0, dvz: 0
        },
        itr: {
            kind: 7, x: 36, y: 54, w: 13, h: 25, vrest: 1
        }
    },
    398: {
        name: "double_jump",
        pic: 58, state: 21, wait: 1, next: 395, dvx: 0, dvy: 0, dvz: 0, centerx: 38, centery: 79, hit_a: 0, hit_d: 0, hit_j: 0, hit_Da: 260, hit_Ua: 70,
        wpoint: {
            kind: 1, x: 35, y: 74, weaponact: 22, attacking: 0, cover: 1, dvx: 0, dvy: 0, dvz: 0
        },
        itr: {
            kind: 7, x: 36, y: 54, w: 13, h: 25, vrest: 1
        }
    },
};
export const modifyData = (data: any) => {
    if (data.bmp.name) {
        data.frame = {
            ...data.frame,
            ...customFrames,
        }

        data.bmp.walking_speedz = 7;

        const modifyFrames = (frames: number[], mod: (frameData: any) => void) => {
            frames.forEach((frame) => {
                if (data.frame[frame]) {
                    mod(data.frame[frame])
                }
            });
        }



        // Mod woody teleport to see animation
        modifyFrames(new Array(28).fill(275).map((v, i) => v + i), (frameData) => {
            frameData.dvx = 0;
            frameData.dvy = 0;
        });

        modifyFrames([240], (frameData) => {
            frameData.next = 245;
            frameData.hit_a = 241;
        });

        modifyFrames([215], (frameData) => frameData.state = 20);
        // Allow action out of stop_running
        modifyFrames([218], (frameData) => frameData.state = 0);
        modifyFrames([210, 211], (frameData) => frameData.state = 20);
        modifyFrames([86], (frameData) => frameData.dvx = 0);
    }

    Object.entries(data.frame).forEach(([, frameData]: any) => {
        if ('itr' in frameData) {
            frameData.itr = Array.isArray(frameData.itr) ? frameData.itr : [frameData.itr];
        }
        if ('bdy' in frameData) {
            frameData.bdy = Array.isArray(frameData.bdy) ? frameData.bdy : [frameData.bdy];
        }
        frameData.centerx++;
        frameData.centery++;
    });

};
