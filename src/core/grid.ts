import {GameObj} from "kaplay";
import {getPosKey} from "../utils";
import {GridConstraints, TRAVEL_OFFSET} from "../types";
import {WireState} from "../components/wireState";

export const canRotateAt = (gridConstraints: GridConstraints, x: number, y: number): boolean => {
    return gridConstraints[getPosKey(x, y)].canRotate ?? true;
}

export const canPlaceAt = (gridConstraints: GridConstraints, x: number, y: number): boolean => {
    return gridConstraints[getPosKey(x, y)]?.canPlace ?? true;
}

export const getNextConnectedCell = (wires: GameObj<WireState>[], currentWire: GameObj<WireState>, side: number): GameObj<WireState> => {
    const offset = TRAVEL_OFFSET[side];
    const nextX = currentWire.x + offset.x;
    const nextY = currentWire.y + offset.y;
    return wires.find((w) => w.x == nextX && w.y == nextY);
}