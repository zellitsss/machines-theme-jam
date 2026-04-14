import {GameObj} from "kaplay";

export interface Cell {
    canPlace: boolean;
    canClear: boolean;
    canRotate: boolean;

    rotation: number; // 0|1|2|3 multiplicand of 90 degree
    type: string;
    obj: GameObj | null;
}

export const CellFactory = {
    Blocked: (): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: false,
        rotation: 0,
        type: '',
        obj: null
    }),

    LockedFixed: (type: string, rotation: number): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: false,
        type,
        rotation,
        obj: null
    }),

    Freedom: (): Cell => ({
        canPlace: true,
        canClear: true,
        canRotate: true,
        type: '',
        rotation: 0,
        obj: null
    }),

    LockedRotate: (type: string, rotation: number): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: true,
        type,
        rotation,
        obj: null
    })
}