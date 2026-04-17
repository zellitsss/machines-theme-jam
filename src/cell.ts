import {GameObj} from "kaplay";
import {PipeDictionary} from "./pipe-dictionary";
import {canOut, getRotatedConnections} from "./utils";

export interface CellData {
    x: number;
    y: number;
    type: string;
    rot: number;
    canPlace: boolean;
    canClear: boolean;
    canRotate: boolean;
    placedFromInventory?: boolean;
    modifier: number;
}

export class Cell implements CellData {
    x: number;
    y: number;
    type: string;
    rot: number = 0;
    modifier: number = 0;
    canPlace: boolean;
    canClear: boolean;
    canRotate: boolean;
    placedFromInventory: boolean = false;
    obj: GameObj | null;
    
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
        this.type = "";
        this.obj = null;
        this.canPlace = true;
        this.canClear = true;
        this.canRotate = true;
    }

    getExitSide(enteredSide: number): number | null
    {
        const rotatedConnections = getRotatedConnections(PipeDictionary.get(this.type)?.flow ?? [0, 0, 0, 0], this.rot);
        for (let side = 0; side < 4; side++) {
            if (side === enteredSide)
            {
                continue;
            }
            if (canOut(rotatedConnections[side]))
            {
                return side;
            }
        }
        return null;
    }
}

export const CellFactory = {
    Freedom: (x: number, y: number): Cell => new Cell(x, y),
//
//     Blocked: (): Cell => ({
//         canPlace: false,
//         canClear: false,
//         canRotate: false,
//         rot: 0,
//         type: '',
//         obj: null
//     }),
//
//     LockedFixed: (type: string, rot: number): Cell => ({
//         canPlace: false,
//         canClear: false,
//         canRotate: false,
//         type,
//         rot,
//         obj: null
//     }),
//
//     LockedRotate: (type: string, rotation: number): Cell => ({
//         canPlace: false,
//         canClear: false,
//         canRotate: true,
//         type,
//         rotation,
//         obj: null
//     })
}