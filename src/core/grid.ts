import {Vec2} from "kaplay";
import {getPosKey} from "../utils";
import {GridConstraints} from "../types";

export const canRotateAt = (gridConstraints: GridConstraints, gridPos: Vec2): boolean => {
    return gridConstraints[getPosKey(gridPos)].canRotate ?? true;
}

export const canPlaceAt = (gridConstraints: GridConstraints, gridPos: Vec2): boolean => {
    return gridConstraints[getPosKey(gridPos)]?.canPlace ?? true;
}
