import {KAPLAYCtx} from "kaplay";
import {wireDictionary} from "../wire-dictionary";
import {CellData} from "../types";
import {getRotationFromStep} from "../utils";
import {cellState} from "../components/cellState";

export const createWire = (k: KAPLAYCtx, x: number, y: number, size: number, cellData: CellData) => [
    k.pos(x, y),
    k.rotate(0),
    k.anchor("center"),
    k.sprite(wireDictionary.get(cellData.type)?.sprite ?? "", {
        width: size,
        height: size,
    }),
    k.rotate(getRotationFromStep(cellData.rot)),
    k.area(),
    cellState(cellData),
    "wire"
];