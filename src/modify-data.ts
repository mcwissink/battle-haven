const buildCustomFrames = (rollingPics: number[]) => ({
    391: {
        name: "dash_go",
        pic: 63,
        state: 23,
        wait: 8,
        next: 216,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        bpoint: {
            x: 48,
            y: 33,
        },
        wpoint: {
            kind: 1,
            x: 33,
            y: 34,
            weaponact: 21,
            attacking: 0,
            cover: 0,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 0,
            x: 20,
            y: 20,
            w: 45,
            h: 39,
            dvx: 5,
            dvy: -15,
            fall: 70,
            arest: 20,
            bdefend: 60,
            injury: 0,
        },
        bdy: [
            {
                kind: 0,
                x: 43,
                y: 5,
                w: 23,
                h: 33,
            },
            {
                kind: 0,
                x: 28,
                y: 29,
                w: 21,
                h: 33,
            },
            {
                kind: 0,
                x: 18,
                y: 48,
                w: 27,
                h: 21,
            },
        ],
    },
    392: {
        name: "drop",
        pic: 64,
        state: 22,
        wait: 4,
        next: 393,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        bpoint: {
            x: 36,
            y: 30,
        },
        wpoint: {
            kind: 1,
            x: 25,
            y: 37,
            weaponact: 35,
            attacking: 0,
            cover: 0,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        bdy: [
            {
                kind: 0,
                x: 20,
                y: 5,
                w: 27,
                h: 38,
            },
            {
                kind: 0,
                x: 16,
                y: 37,
                w: 36,
                h: 22,
            },
        ],
    },
    393: {
        name: "drop",
        pic: 64,
        state: 22,
        wait: 8,
        next: 999,
        dvx: 0.01,
        dvy: 0.01,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        bpoint: {
            x: 36,
            y: 30,
        },
        wpoint: {
            kind: 1,
            x: 25,
            y: 37,
            weaponact: 35,
            attacking: 0,
            cover: 0,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        bdy: [
            {
                kind: 0,
                x: 20,
                y: 5,
                w: 27,
                h: 38,
            },
            {
                kind: 0,
                x: 16,
                y: 37,
                w: 36,
                h: 22,
            },
        ],
    },
    394: {
        name: "double_jump",
        pic: rollingPics[0],
        state: 21,
        wait: 1,
        next: 395,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 38,
            y: 75,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    395: {
        name: "double_jump",
        pic: rollingPics[0],
        state: 21,
        wait: 1,
        next: 396,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 38,
            y: 75,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    396: {
        name: "double_jump",
        pic: rollingPics[1],
        state: 21,
        wait: 1,
        next: 397,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 34,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 43,
            y: 47,
            weaponact: 31,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    397: {
        name: "double_jump",
        pic: rollingPics[2],
        state: 21,
        wait: 1,
        next: 398,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 34,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 20,
            y: 61,
            weaponact: 25,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    398: {
        name: "double_jump",
        pic: rollingPics[3],
        state: 21,
        wait: 1,
        next: 395,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 38,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 35,
            y: 74,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    399: {
        name: "fly",
        pic: rollingPics[0],
        state: 24,
        wait: 1,
        next: 400,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 38,
            y: 75,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    400: {
        name: "fly",
        pic: rollingPics[0],
        state: 24,
        wait: 1,
        next: 401,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 38,
            y: 75,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    401: {
        name: "fly",
        pic: rollingPics[1],
        state: 24,
        wait: 1,
        next: 402,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 34,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 43,
            y: 47,
            weaponact: 31,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    402: {
        name: "fly",
        pic: rollingPics[2],
        state: 24,
        wait: 1,
        next: 403,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 34,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 20,
            y: 61,
            weaponact: 25,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    403: {
        name: "fly",
        pic: rollingPics[3],
        state: 24,
        wait: 1,
        next: 400,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 38,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 35,
            y: 74,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 7,
            x: 36,
            y: 54,
            w: 13,
            h: 25,
            vrest: 1,
        },
    },
    404: {
        name: "grab",
        pic: 51,
        state: 0,
        wait: 10,
        next: 999,
        dvx: 0,
        dvy: 0,
        dvz: 0,
        centerx: 38,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        wpoint: {
            kind: 1,
            x: 35,
            y: 74,
            weaponact: 22,
            attacking: 0,
            cover: 1,
            dvx: 0,
            dvy: 0,
            dvz: 0,
        },
        itr: {
            kind: 1,
            x: 40,
            y: 16,
            w: 25,
            h: 65,
            catchingact: [120, 120],
            caughtact: [130, 130],
        },
    },
    405: {
        name: "transmission",
        pic: 60,
        state: 4,
        wait: 1,
        next: 406,
        dvx: 100,
        dvy: -1,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
    },
    406: {
        name: "transmission",
        pic: 60,
        state: 4,
        wait: 1,
        next: 999,
        dvx: -1,
        dvy: 0,
        dvz: 0,
        centerx: 39,
        centery: 79,
        hit_a: 0,
        hit_d: 0,
        hit_j: 0,
        hit_Da: 260,
        hit_Ua: 70,
        itr: {
            kind: 0,
            x: -200,
            y: 6,
            w: 200,
            h: 40,
            dvx: 13,
            dvy: -10,
            fall: 70,
            vrest: 10,
            bdefend: 60,
            injury: 55,
        },
    },
});

export const modifyData = (data: any) => {
    const modifyFrames = (frames: number[], mod: (frameData: any) => void) => {
        frames.forEach((frame) => {
            if (data.frame[frame]) {
                mod(data.frame[frame]);
            }
        });
    };

    // Fix davis and dennis ball
    modifyFrames([30], (frameData) => {
        if (frameData.pic === 42) {
            frameData.pic = 4;
        }
    });

    // Character mods
    if (data.bmp.name) {
        const rollingPics = new Array(4)
            .fill(102)
            .map((v, i) => data.frame[v + i].pic);
        data.frame = {
            ...data.frame,
            ...buildCustomFrames(rollingPics),
        };

        data.bmp.walking_speed *= 0.8;
        // data.bmp.running_speed *= 1.1;
        data.bmp.jump_height *= 0.8;
        data.bmp.jump_distance *= 0.8;
        data.bmp.dash_height *= 0.8;
        data.bmp.dash_distance *= 0.8;

        // Mod woody teleport to see animation
        // modifyFrames(new Array(28).fill(275).map((v, i) => v + i), (frameData) => {
        //     frameData.dvx = 0;
        //     frameData.dvy = 0;
        // });

        // modifyFrames([240], (frameData) => {
        //     frameData.next = 245;
        //     frameData.hit_a = 241;
        // });

        // Chain punches together
        Object.keys(data.frame).map((frame, index, frames) => {
            const frameData = data.frame[frame];
            if (frameData.name === "punch" && frameData.next === 999) {
                frameData.hit_a = frames[index + 1];
            }
        });

        // Lower cpoint on grab
        Object.keys(data.frame).map((frame, index, frames) => {
            const frameData = data.frame[frame];
            if (frameData.cpoint) {
                frameData.cpoint.y += 15;
            }
        });

        // Remove grab from walk
        modifyFrames([5, 8], (frameData) => delete frameData.itr);

        modifyFrames([215], (frameData) => (frameData.state = 20));
        // Allow action out of stop_running
        modifyFrames([218], (frameData) => (frameData.state = 0));
        modifyFrames([210, 211], (frameData) => (frameData.state = 20));
    } else {
        Object.values(data.frame).forEach((frameData) => {
            frameData.dvx *= 0.5;
            frameData.dvy *= 0.5;
        });
    }

    Object.entries(data.frame).forEach(([, frameData]: any) => {
        if ("itr" in frameData) {
            frameData.itr = Array.isArray(frameData.itr)
                ? frameData.itr
                : [frameData.itr];
        }
        if ("bdy" in frameData) {
            frameData.bdy = Array.isArray(frameData.bdy)
                ? frameData.bdy
                : [frameData.bdy];
        }
        frameData.centerx++;
        frameData.centery++;
        if (frameData.dvy !== 550) {
            frameData.dvy *= 2;
        }
    });

    Object.values(data.frame).forEach((frameData) => {
        frameData.wait *= 2;
        if ("itr" in frameData) {
            frameData.itr.forEach((itr) => {
                itr.dvx *= 0.5;
                itr.dvy *= 0.5;
                itr.vrest *= 2;
                itr.arest *= 2;
            });
        }
    });
};
