import {KAPLAYCtx} from "kaplay";
import {wireDictionary} from "../wire-dictionary";
import {WireData} from "../types";
import {getRotationFromStep} from "../utils";
import {wireState} from "../components/wireState";
import {wireInteraction} from "../components/wireInteraction";

export const createWire = (k: KAPLAYCtx, posX: number, posY: number, size: number, wireData: WireData, tags: string[] = []) => {
    const wireDef = wireDictionary.get(wireData.type);
    return [
    k.pos(posX, posY),
    k.rotate(0),
    k.anchor("center"),
    k.sprite(wireDef?.sprite ?? "", {
        width: size,
        height: size,
        frame: wireDef?.frame,
    }),
    k.color(176, 187, 212),
    k.rotate(getRotationFromStep(wireData.rot)),
    k.area(),
    wireInteraction({
        k
    }),
    wireState(wireData),
    k.scale(1),
    k.timer(),
    k.opacity(1),
    "wire",
    ...tags,
]};