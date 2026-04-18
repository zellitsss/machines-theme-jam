import {KAPLAYCtx} from "kaplay";
import {wireDictionary} from "../wire-dictionary";
import {CellData, WireData} from "../types";
import {getRotationFromStep} from "../utils";
import {wireState} from "../components/wireState";
import {wireInteraction} from "../components/wireInteraction";

export const createWire = (k: KAPLAYCtx, posX: number, posY: number, size: number, wireData: WireData, tags: string[] = []) => [
    k.pos(posX, posY),
    k.rotate(0),
    k.anchor("center"),
    k.sprite(wireDictionary.get(wireData.type)?.sprite ?? "", {
        width: size,
        height: size,
    }),
    k.color(176, 187, 180),
    k.rotate(getRotationFromStep(wireData.rot)),
    k.area(),
    wireInteraction(),
    wireState(wireData),
    k.scale(1),
    k.timer(),
    "wire",
    ...tags,
];