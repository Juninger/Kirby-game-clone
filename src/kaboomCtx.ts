// used to initialize the Kaboom.js library and export its context to be used elsewhere

import kaboom from "kaboom";
import { scale } from "./constants";

export const k = kaboom({
    // gameboy resolution adapted for 16:9, see comment in constants.ts for 'scale' usage
    width: 256 * scale,
    height: 144 * scale,
    scale,
    letterbox: true,
    global: false,
});