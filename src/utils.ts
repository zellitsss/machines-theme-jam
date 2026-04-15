import {CellConnections, ConnectionType, TRAVEL_OFFSET} from "./types";
import Grid from "./grid";
import {Cell} from "./cell";

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

export function getRotatedConnections(base: CellConnections, rotationStep: number) {
    let connections = [...base];
    for (let i = 0; i < rotationStep; i++) {
        const last = connections.pop();
        if (last == undefined) continue
        connections.unshift(last);
    }
    return connections as CellConnections;
}