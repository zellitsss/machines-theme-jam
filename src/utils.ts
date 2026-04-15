import {ConnectionType} from "./types";

export function canConnect(type: ConnectionType): boolean {
    return type > ConnectionType.None;
}

export function canOut(type: ConnectionType): boolean {
    return type == ConnectionType.Outlet || type == ConnectionType.Both;
}

export function canIn(type: ConnectionType): boolean {
    return type == ConnectionType.Inlet || type == ConnectionType.Both;
}

export function getOppositeSide(side: number): number {
    return side == null ? null : (side + 2) % 4;
}