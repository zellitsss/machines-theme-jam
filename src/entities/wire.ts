import {KAPLAYCtx} from "kaplay";

export const createWire = (k: KAPLAYCtx, x: number, y: number) => [
    k.pos(x, y),
    k.rotate(0),
    k.anchor("center"),
    k.sprite("wire-i", {}),
    "wire"
];