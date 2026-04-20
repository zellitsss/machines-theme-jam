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

export interface WireDefinition {
    sprite: string;
    frame?: number;
    // [Top, Right, Bottom, Left]
    flow: CellConnections;
    modifier?: number;
    placeholderFrame?: number;
}

export type CellConnections = [ConnectionType, ConnectionType, ConnectionType, ConnectionType];

export interface WireData {
    type: string;
    modifier?: number;
    rot?: number;
    x?: number;
    y?: number;
}

export interface ItemData extends WireData {
    count: number;
}

export interface CellConstraint {
    canPlace?: boolean;
    canRotate?: boolean;
    rot?: number;
    type?: string;
    modifier?: number;
    placeholder?: boolean;
}

export type GridConstraints = Map<string, CellConstraint>;

export interface CellData extends CellConstraint {
    x: number;
    y: number;
}

export interface LevelData {
    cols: number;
    rows: number;
    cells: CellData[];
    inventory: ItemData[];
    targetModifier: number;
}

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";

const SLOT_PADDING = 10;
const COUNT_TEXT_SIZE = 22;
const CONTAINER_PADDING = 14;