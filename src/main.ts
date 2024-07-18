// entry point of the project

import { k } from "./kaboomCtx";
import { makeMap } from "./utils";

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

    k.loadSprite("level-1", "./level-1.png");

    // fetch data for level 1 and rename references for clarity and separation for multiple levels
    const { map: level1Layout, spawnPoints: level1SpawnPoints } = await makeMap(
        k,
        "level-1"
    );

    k.scene("level-1", () => {
        k.setGravity(2100);
        // assemble the game object for level 1
        k.add([
            // draw a rectangle, fill with width+height from the game canvas
            k.rect(k.width(), k.height()), 
            // add background color
            k.color(k.Color.fromHex("#f7d7db")),
            // makes this object unaffected by the camera
            k.fixed(),
        ]);

        // add layout to the game
        k.add(level1Layout);
    });

    k.go("level-1");
}

gameSetup();