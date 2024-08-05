// contains logic for player and mobs

import { AreaComp, BodyComp, DoubleJumpComp, GameObj, HealthComp, KaboomCtx, OpacityComp, PosComp, ScaleComp, SpriteComp } from "kaboom";
import { scale } from "./constants";

// custom type for the player object (modified version of the default KaboomJS GameObj)
type PlayerGameObj = GameObj<
    SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp &
    {
        speed: number;
        direction: string;
        isInhaling: boolean;
        isFull: boolean;
    }
>;

// defines types of player actions that needs an input
type Action = "moveLeft" | "moveRight" | "inhale";

// specifies valid input keys for performing an Action
type KeyMap = Record<"left" | "a" | "right" | "d" | "z" | "1", Action>;

// tracks which actions are currently being triggered by the player (used to handle the 'multiple inputs scaling the action effect'-bug)
type ActionState = {
    moveLeft: boolean;
    moveRight: boolean;
    inhale: boolean;
};

// sets all actionstate defaults to false
const actionState: ActionState = {
    moveLeft: false,
    moveRight: false,
    inhale: false,
};

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
};

// defines player controls for the game
export function setControls(k: KaboomCtx, player: PlayerGameObj) {
    // reference variable to the inhale effect we added in makePlayer()
    const inhaleEffectRef = k.get("inhaleEffect")[0]; // k.get() returns an array with all objects tagged with "inhaleEffect", we want the first (and only)

    // defines control scheme and allows multiple inputs for the same Action
    const keyMappings: KeyMap = {
        left: "moveLeft",
        a: "moveLeft",
        right: "moveRight",
        d: "moveRight",
        z: "inhale",
        '1': "inhale"
    };

    k.onKeyDown((key: string) => { // pressed key will be handled as any string
        if (!(key in keyMappings)) return; // invalid input, do nothing
        const action = keyMappings[key as keyof KeyMap]; // fetch action for pressed key
        actionState[action] = true; // sets the actionstate for the requested action to active
    });

    // jumping
    k.onKeyPress((key) => {
        if (key == 'x' || key == 'space') { // x or spacebar
            player.doubleJump(); // amount is limited in the playerObject creation
        }
    });

    // spit out an enemy
    k.onKeyRelease((key: string) => {
        if (!(key in keyMappings)) return; // invalid input, do nothing
        const action = keyMappings[key as keyof KeyMap]; // fetch action for pressed key
        actionState[action] = false; // sets the actionstate for the requested action to inactive

        if (key == 'z' || key == '1') {
            if (player.isFull) { // an enemy is currently swallowed (ready to be spit out)
                player.play("kirbInhaling"); // same sprite/animation for inhaling and spitting
                const shootingStar = k.add([ // create game object for spitting ability
                    k.sprite("assets", {
                        anim: "shootingStar",
                        flipX: player.direction === "right",
                    }),
                    // definitions for size and position of the ability sprite
                    k.area({ shape: new k.Rect(k.vec2(5, 4), 6, 6) }),
                    k.pos(
                        player.direction === "left" ? player.pos.x - 80 : player.pos.x + 80,
                        player.pos.y + 5
                    ),
                    k.scale(scale),
                    player.direction === "left" // move the sprite
                        ? k.move(k.LEFT, 800)
                        : k.move(k.RIGHT, 800),
                    "shootingStar", // tag
                ]);
                // destroy the projectile when it collides with terrain
                shootingStar.onCollide("platform", () => k.destroy(shootingStar));

                player.isFull = false; // reset isFull status to allow player to swallow a new enemy
                k.wait(1, () => player.play("kirbIdle")); // wait one second before reverting player sprite to the idle status
                return;
            }

            inhaleEffectRef.opacity = 0; // hide inhale effect
            player.isInhaling = false; // no longer inhaling
            player.play("kirbIdle"); // revert to default sprite
        }
    });

    k.onUpdate(() => {
        if (actionState.moveLeft && !actionState.moveRight) {
            player.direction = "left";
            player.flipX = true; // flip the sprite 
            player.move(-player.speed, 0); // we use - to move to the left
        } else if (actionState.moveRight && !actionState.moveLeft) {
            player.direction = "right";
            player.flipX = false;
            player.move(player.speed, 0);
        }

        if (actionState.inhale) {
            if (player.isFull) {
                player.play("kirbFull"); // play kirbFull animation
                inhaleEffectRef.opacity = 0; // hide the inhale effect
            } else {
                player.isInhaling = true;
                player.play("kirbInhaling"); // play inhale effect animation
                inhaleEffectRef.opacity = 1; // show the inhale effect
            }
        }
    });
};

// logic for inhaling and shooting out enemies
export function makeInhalable(k: KaboomCtx, enemy: GameObj) {

    // while enemy is within the hitbox of the inhaleZone of the player, make the enemy inhalable
    enemy.onCollide("inhaleZone", () => {
        enemy.isInhalable = true; // this happens even if the player is not currently using the inhale-skill (inhaleZone hitbox could still be invisible)
    });

    // revert the isInhalable status if the enemy leaves the player's inhaleZone hitbox
    enemy.onCollideEnd("inhaleZone", () => {
        enemy.isInhalable = false; 
    });

    // if the enemy gets hit with the shootingStar projectile, destroy the game objects for both (enemy & shootingStar)
    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
        k.destroy(enemy);
        k.destroy(shootingStar);
    });

    const playerRef = k.get("player")[0]; // fetch reference to the player game object
    enemy.onUpdate(() => { // runs every frame while specified enemy game object exists
        if (playerRef.isInhaling && enemy.isInhalable) { // player is using the inhale skill and enemy is within inhaleZone hitbox
            playerRef.direction === "right" ? enemy.move(-800, 0) : enemy.move(800, 0); // decide which direction to move enemy object when inhaled
        }
    });
}

export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
    const flame = k.add([
        k.sprite("assets", { anim: "flame" }), // sprite selection
        k.scale(scale), // scale the sprite
        k.pos(posX * scale, posY * scale), // position of enemy
        k.area({ // hitbox
            shape: new k.Rect(k.vec2(4, 6), 8, 10),
            collisionIgnore: ["enemy"], // make enemies not collide with each other
        }),
        k.body(), // makes this game object "solid" to interact with gravity, platforms etc
        k.state("idle", ["idle", "jump"]), // available states for this enemy (default state, [possible states])
        { isInhalable: false }, // flips to true when inside hitbox of player's inhaleZone
        "enemy", // tag
    ]);

    makeInhalable(k, flame); // manages movement in-and-out of the the player's inhaleZone hitbox 

    // states for flame enemy, simple AI that repeatedly makes the enemy jump after being idle for 1 second on the ground 
    flame.onStateEnter("idle", async () => {
        await k.wait(1); // wait for 1 second
        flame.enterState("jump"); // switch to the jump-state
    });

    flame.onStateEnter("jump", async () => {
        flame.jump(1000);
    });

    flame.onStateUpdate("jump", async () => { // runs every frame WHILE in the jump-state
        if (flame.isGrounded()) { 
            flame.enterState("idle"); // switch to the idle-state
        }
    });

    return flame;
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
    const guy = k.add([
        k.sprite("assets", { anim: "guyWalk" }), // sprite selection
        k.scale(scale), // scale the sprite
        k.pos(posX * scale, posY * scale), // position of enemy
        k.area({ // hitbox
            shape: new k.Rect(k.vec2(2, 3.9), 12, 12),
            collisionIgnore: ["enemy"], // make enemies not collide with each other
        }),
        k.body(), // makes this game object "solid" to interact with gravity, platforms etc
        k.state("idle", ["idle", "left", "right"]), // available states for this enemy (default state, [possible states])
        { isInhalable: false, speed: 100 }, // flips to true when inside hitbox of player's inhaleZone
        "enemy", // tag
    ]);

    makeInhalable(k, guy); // manages movement in-and-out of the the player's inhaleZone hitbox 

    // states for guy enemy, simple AI that repeatedly makes the enemy walk left and right 
    guy.onStateEnter("idle", async () => {
        await k.wait(1); // wait for 1 second
        guy.enterState("left"); // switch to the left-state
    });

    guy.onStateEnter("left", async () => {
        guy.flipX = false; // flip the sprite
        await k.wait(2); // wait for 2 seconds
        guy.enterState("right"); // switch to the right-state
    });

    guy.onStateUpdate("left", () => { // moves enemy WHILE in the left-state
        guy.move(-guy.speed, 0);
    });

    guy.onStateEnter("right", async () => {
        guy.flipX = true; // flip the sprite
        await k.wait(2); // wait for 2 seconds
        guy.enterState("left"); // switch to the left-state
    });

    guy.onStateUpdate("right", () => { // moves enemy WHILE in the right-state
        guy.move(guy.speed, 0);
    });

    return guy;
}

export function makeBirdEnemy(
    k: KaboomCtx,
    posX: number, 
    posY: number,
    speed: number
) {
    const bird = k.add([
        k.sprite("assets", { anim: "bird" }), // sprite selection
        k.scale(scale), // scale the sprite
        k.pos(posX * scale, posY * scale), // position of enemy
        k.area({ // hitbox
            shape: new k.Rect(k.vec2(4, 6), 8, 10),
            collisionIgnore: ["enemy"], // make enemies not collide with each other
        }),
        k.body({ isStatic: true }), // make bird not affected by gravity 
        k.move(k.LEFT, speed), // bird keeps flying to the left
        k.offscreen({ destroy: true, distance: 400 }), // destroys object when offscreen
        "enemy" // tag
    ]);

    makeInhalable(k, bird);

    return bird;
}