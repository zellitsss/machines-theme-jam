import {GameObj} from "kaplay";

export interface CellData {
    x: number;
    y: number;
    type: string;
    rot: number;
    canPlace: boolean;
    canClear: boolean;
    canRotate: boolean;
}

export interface Cell extends CellData {
    obj: GameObj | null;
}

export const CellFactory = {
    Freedom: (x: number, y: number): Cell => ({
        canPlace: true,
        canClear: true,
        canRotate: true,
        type: '',
        rot: 0,
        obj: null,
        x: x,
        y: y,
    }),
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