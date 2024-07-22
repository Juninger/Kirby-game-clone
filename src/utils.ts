// map-related utility

import { KaboomCtx } from 'kaboom';
import { scale } from './constants';

// name --> name of the map
export async function makeMap(k: KaboomCtx, name: string) {

    // read the mapdata from associated json file
    const mapData = await (await fetch(`./${name}.json`)).json();

    // create a map object without adding it to the map
    const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

    // store locations of spawn points for both player and enemies
    const spawnPoints: { [key: string]: { x: number; y: number; }[] } = {}; // e.g. key can be "player" / "flame" / "bird" / "guy" to find the spawn location of that unit

    // take the mapdata object and iterate on its layers
    for (const layer of mapData.layers) {

        switch (layer.name) { // check what type of layer it is

            case "colliders":
                // iterate collider objects and add them to the map
                for (const collider of layer.objects) {
                    map.add([
                        k.area({
                            // shape of the collider, fetches sizes from collider created with Tiled
                            shape: new k.Rect(k.vec2(0), collider.width, collider.height),
                            // filter which objects should have collisionIgnore enabled
                            collisionIgnore: ["platform", "exit"],
                        }),
                        // if the object is not the exit, set static property of body to true to make it not move on collision
                        collider.name !== "exit" ? k.body({ isStatic: true }) : null,
                        // position of collider
                        k.pos(collider.x, collider.y),
                        // if the object being added tot he map is NOT the exit, we can give it the platform tag
                        collider.name !== "exit" ? "platform" : "exit"
                    ]);
                }
                break;

            case "spawnpoints":
                for (const spawnPoint of layer.objects) {
                    // check if the KEY exists in the spawnpoints array already
                    if (spawnPoints[spawnPoint.name]) {
                        // add spawnpoint to array using the character's name and position for key-value
                        spawnPoints[spawnPoint.name].push({
                            x: spawnPoint.x,
                            y: spawnPoint.y,
                        });
                    } else { // if key did not exist, create new array and insert spawnpoint instead
                        spawnPoints[spawnPoint.name] = [{ x: spawnPoint.x, y: spawnPoint.y }];
                    }
                }
                break;

            default:
                console.warn(`Unknown layer name: ${layer.name}`);
                break;
        }
    }
    // return completed map after processing all layers
    return { map, spawnPoints };
}