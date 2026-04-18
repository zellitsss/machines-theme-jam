import {GameObj} from "kaplay";
import {getPosKey} from "../utils";
import {CellConstraint, GridConstraints, TRAVEL_OFFSET} from "../types";
import {WireState} from "../components/wireState";

export const gridConstraints: GridConstraints = new Map<string, CellConstraint>();

export const canRotateAt = (x: number, y: number): boolean => {
    return gridConstraints.get(getPosKey(x, y))?.canRotate ?? false;
}

export const canPlaceAt = (x: number, y: number): boolean => {
    return gridConstraints.get(getPosKey(x, y))?.canPlace ?? true;
}

export const getNextConnectedCell = (wires: GameObj<WireState>[], currentWire: GameObj<WireState>, side: number): GameObj<WireState> => {
    const offset = TRAVEL_OFFSET[side];
    const nextX = currentWire.x + offset.x;
    const nextY = currentWire.y + offset.y;
    return wires.find((w) => w.x == nextX && w.y == nextY);
}