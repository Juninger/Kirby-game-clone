// contains logic for player and mobs

import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

// creates game object for the player
export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
    const player = k.make([
        // select player sprite from kirby-like.png
        k.sprite("assets", { anim: "kirbIdle" }),
        // define shape and size for player, rectangle with width 8 and height 10, positioned at x-value 4 and y-value 5.9 RELATIVE to the sprite
        k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }), // manually assigned position to make sprite not "sink in" the platforms
        k.body(), // enable collision and make player affected by gravity
        k.pos(posX * scale, posY * scale), // multiply passed position params with global scale variable
        k.scale(scale), // scaling of sprite, ensure character takes up the correct amount of space
        k.doubleJump(10), // set the amount of jumps that are allowed
        k.health(3), // set health of the player
        k.opacity(1), // fully visible
        // additional custom player attributes, can be accessed like "player.speed" / "player.isInhaling" etc.
        {
            speed: 300,
            direction: "right",
            isInhaling: false,
            isFull: false,
        },
        "player", // tag
    ]);
}