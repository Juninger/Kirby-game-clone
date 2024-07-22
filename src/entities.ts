// contains logic for player and mobs

import { GameObj, KaboomCtx } from "kaboom";
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

    // define what happens with the player when it collides with an "enemy"-tagged object 
    player.onCollide("enemy", async (enemy: GameObj) => {

        // player inhales enemy
        if (player.isInhaling && enemy.isInhalable) {
            player.isInhaling = false; // disable the inhaling-status
            k.destroy(enemy); // remove the enemy object
            player.isFull = true; // change status of player to apply new sprite
            return;
        }

        // player dies
        if (player.hp() === 0) {
            k.destroy(player); // removes the player object
            k.go("level-1"); // respawn at start of current level (or latest checkpoint)
            return;
        }

        // reduce player hp by 1 (default value)
        player.hurt();
        // display "flashing" animation for player sprite when hurt
        await k.tween( // tween allows us to gradually change a value from one to another
            player.opacity, // start value
            0, // end value
            0.05, // duration in seconds
            (val) => (player.opacity = val), // tween magic and where to assign result
            k.easings.linear // rate of change
        );
        await k.tween( // reverse previous tween to create blinking effect
            player.opacity,
            1,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
    });

    // logic for when the player finishes a level
    player.onCollide("exit", () => {
        k.go("level-2"); // replace with logic for "next scene" instead
    });

    // assembles the game object for the inhale effect
    const inhaleEffect = k.add([
        k.sprite("assets", { anim: "kirbInhaleEffect" }), // define which assets to use for the sprite
        k.pos(),
        k.scale(scale),
        k.opacity(0), // initially not visible (toggled when player uses the "inhale skill")
        "inhaleEffect", // tag
    ]);

    // define hitbox area for the inhale effect
    const inhaleZone = player.add([
        k.area({ shape: new k.Rect(k.vec2(0), 20, 4) }), // definitions for hitbox size
        k.pos(), // no initial position, will be based on player direction
        "inhaleZone", // tag
    ]);

    // logic to position and flip the inhaleZone hitbox depending on the player's direction
    inhaleZone.onUpdate(() => { // create an event that runs every frame as long as the game object exists
        // since the inhale zone is a child of the player object, the position of it will be relative to the player (parent)
        if (player.direction === "left") {
            inhaleZone.pos = k.vec2(-14, 8), // THIS is relative to the player position
            inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0),
            inhaleEffect.flipX = true;
        } else { // player direction === right
            inhaleZone.pos = k.vec2(14, 8),
            inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0),
            inhaleEffect.flipX = false;
        }
    });

    // logic to handle player falling down from platforms
    player.onUpdate(() => {
        if (player.pos.y > 2000) { // higher y-value --> further down on the game canvas
            k.go("level-1"); // (placeholder value) respawn player, will also reset the game state
        }
    });

    return player; // finished player object
}