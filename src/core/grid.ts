import {GameObj} from "kaplay";
import {getPosKey} from "../utils";
import {CellConstraint, GridConstraints, TRAVEL_OFFSET} from "../types";
import {WireState} from "../components/wireState";
import {k} from "../constants";

export const gridConstraints: GridConstraints = new Map<string, CellConstraint>();

export const canRotateAt = (x: number, y: number): boolean => {
return gridConstraints.get(getPosKey(x, y))?.canRotate ?? false;
}

export const isValidCell = (x: number, y: number): boolean => {
    return gridConstraints.has(getPosKey(x, y));
}

export const canPlaceAt = (x: number, y: number): boolean => {
    const existed = k.query({
        include: ["wire", getPosKey(x, y)],
        includeOp: "and"
    });
    return (gridConstraints.get(getPosKey(x, y))?.canPlace ?? false) && existed.length == 0 && isValidCell(x, y);
}

export const getNextConnectedCell = (wires: GameObj<WireState>[], currentWire: GameObj<WireState>, side: number): GameObj<WireState> => {
    const offset = TRAVEL_OFFSET[side];
    const nextX = currentWire.wireData.x + offset.x;
    const nextY = currentWire.wireData.y + offset.y;
    return wires.find((w) => w.wireData.x == nextX && w.wireData.y == nextY);
}

export const worldToGrid = (worldX: number, worldY: number, size: number, offsetX = 0, offsetY = 0): [number, number] => {
    return [
        Math.floor((worldX - offsetX) / size),
        Math.floor((worldY - offsetY) / size)
    ];
}

export const calculateCellPos = (x: number, y: number, size: number, offsetX = 0, offsetY = 0): [number, number] => {
    return [
        offsetX + (x + 0.5) * size,
        offsetY + (y + 0.5) * size
    ];
}