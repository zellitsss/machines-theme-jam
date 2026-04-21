import {GameObj, Vec2} from "kaplay";
import {getPosKey} from "../utils";
import {CellConstraint, GridConstraints, TRAVEL_OFFSET} from "../types";
import {WireState} from "../components/wireState";
import {k, Tag_Wire} from "../constants";

export const gridConstraints: GridConstraints = new Map<string, CellConstraint>();

export const canRotateAt = (gridPos: Vec2): boolean => {
return gridConstraints.get(getPosKey(gridPos))?.canRotate ?? false;
}

export const isValidCell = (gridPos: Vec2): boolean => {
    return gridConstraints.has(getPosKey(gridPos));
}

export const canPlaceAt = (gridPos: Vec2, modifier: number): boolean => {
    const existed = k.query({
        include: [Tag_Wire, getPosKey(gridPos)],
        includeOp: "and"
    });
    const constraint = gridConstraints.get(getPosKey(gridPos));
    const constraintMatched = (constraint?.modifier ?? 0) === modifier && (constraint?.canPlace ?? false);
    return constraintMatched && existed.length == 0 && isValidCell(gridPos);
}

export const getNextConnectedCell = (wires: GameObj<WireState>[], currentWire: GameObj<WireState>, side: number): GameObj<WireState> => {
    const offset = TRAVEL_OFFSET[side];
    const nextX = currentWire.wireData.x + offset.x;
    const nextY = currentWire.wireData.y + offset.y;
    return wires.find((w) => w.wireData.x == nextX && w.wireData.y == nextY);
}

export const worldToGrid = (worldX: number, worldY: number, size: number, offsetX = 0, offsetY = 0): Vec2 => {
    return k.vec2(
        Math.floor((worldX - offsetX) / size),
        Math.floor((worldY - offsetY) / size)
    );
}

export const calculateCellPos = (gridPos: Vec2, size: number, offsetX = 0, offsetY = 0): Vec2 => {
    return k.vec2(
        offsetX + (gridPos.x + 0.5) * size,
        offsetY + (gridPos.y + 0.5) * size
    );
}