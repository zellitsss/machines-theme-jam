import Grid from "./grid";
import {Cell} from "./cell";

export enum Side {
    Top,
    Right,
    Bottom,
    Left,
    None
}

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