import {CellConnections, ConnectionType} from "./types";
import {Vec2} from "kaplay";

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

export function calculateCellVisualSize(width: number, height: number, cols: number, rows: number): number {
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    return Math.min(cellWidth, cellHeight);
}

export function getPosKey(x: number, y: number): string {
    return `${x},${y}`;
}

export function getRotationFromStep(step: number): number {
    return ((step % 4 + 4) % 4) * 90;
}