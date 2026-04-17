import "kaplay/global"
import {createWire} from "../entities/wire";
import {KAPLAYCtx} from "kaplay";

export const dropWire = (k: KAPLAYCtx, x: number, y: number) => {
    return add(createWire(k, x, y));
}