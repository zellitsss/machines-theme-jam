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