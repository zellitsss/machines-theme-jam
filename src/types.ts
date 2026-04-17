export const TRAVEL_OFFSET = [
    {x: 0, y: -1},     // up
    {x: 1, y: 0},      // right
    {x: 0, y: 1},      // down
    {x: -1, y: 0}      // left
]

export enum ConnectionType {
    None,
    Inlet,
    Outlet,
    Both
}

export type CellConnections = [ConnectionType, ConnectionType, ConnectionType, ConnectionType];

export interface CellConstraint {
    canPlace: boolean;
    canRotate: boolean;
    rot?: number;
    type?: string;
    modifier?: number;
}

export type GridConstraints = Record<string, CellConstraint>;

export interface CellData extends CellConstraint {
    x: number;
    y: number;
}

export interface LevelData {
    cols: number;
    rows: number;
    cells: CellData[];
    inventory: Record<string, number>;
}