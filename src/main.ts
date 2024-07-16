// entry point of the project

import { k } from "./kaboomCtx";

async function gameSetup() {
    k.loadSprite("assets", "./kirby-like.png", {
        sliceX: 9, // number of sprites on X-axis
        sliceY: 10, // number of sprites on Y-axis
        anims: { // relates animations to sprites: <name: sprite-index>. Animations with more than one frame uses <name: {object}> to specify details
            kirbIdle: 0,
            kirbInhaling: 1,
            kirbFull: 2,
            kirbInhaleEffect: { from: 3, to: 8, speed: 15, loop: true },
            shootingStar: 9,
            flame: { from: 36, to: 37, speed: 4, loop: true },
            guyIdle: 18,
            guyWalk: { from: 18, to: 19, speed: 4, loop: true },
            bird: { from: 27, to: 28, speed: 4, loop: true },
        },
    });
}

gameSetup();