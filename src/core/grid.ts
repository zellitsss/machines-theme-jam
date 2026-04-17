import {GameObj} from "kaplay";
import {getPosKey} from "../utils";
import {GridConstraints, TRAVEL_OFFSET} from "../types";
import {CellState} from "../components/cellState";

export const canRotateAt = (gridConstraints: GridConstraints, x: number, y: number): boolean => {
    return gridConstraints[getPosKey(x, y)].canRotate ?? true;
}

export const canPlaceAt = (gridConstraints: GridConstraints, x: number, y: number): boolean => {
    return gridConstraints[getPosKey(x, y)]?.canPlace ?? true;
}

export const getNextConnectedCell = (wires: GameObj<CellState>[], currentWire: GameObj, side: number): GameObj<CellState> => {
    const offset = TRAVEL_OFFSET[side];
    const nextX = currentWire.cellData.x + offset.x;
    const nextY = currentWire.cellData.y + offset.y;
    return wires.find((w) => w.cellData.x == nextX && w.cellData.y == nextY);
}