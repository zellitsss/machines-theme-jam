import { Pipe } from './pipe';

export interface Cell {
    canPlace: boolean;
    canClear: boolean;
    canRotate: boolean;

    rotation: number; // 0|1|2|3 multiplican of 90 degree
    pipe: Pipe | null;
}

export const CellFactory = {
    Blocked: (): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: false,
        rotation: 0,
        pipe: null
    }),

    LockedFixed: (pipe: Pipe, rotation: number): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: false,
        pipe,
        rotation
    }),

    Freedom: (): Cell => ({
        canPlace: true,
        canClear: true,
        canRotate: true,
        pipe: null,
        rotation: 0
    }),

    LockedRotate: (pipe: Pipe, rotation: number): Cell => ({
        canPlace: false,
        canClear: false,
        canRotate: true,
        pipe,
        rotation
    })
}