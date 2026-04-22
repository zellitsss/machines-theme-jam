import {CellConnections, CellData, ConnectionType, ItemData, WireData} from "./types";
import {GameObj, Vec2} from "kaplay";
import {WireState} from "./components/wireState";
import {gridConstraints} from "./core/grid";
import {inventory} from "./core/inventory";
import {gameState, k, Tag_InventoryItem} from "./constants";

export function canConnect(type: ConnectionType): boolean {
    return type > ConnectionType.None;
}

export function canOut(type: ConnectionType): boolean {
    return type == ConnectionType.Outlet || type == ConnectionType.Both;
}

export function canIn(type: ConnectionType): boolean {
    return type == ConnectionType.Inlet || type == ConnectionType.Both;
}

export const canDrag = (wire: GameObj<WireState>): boolean => {
    if (gameState.won) {
        return false;
    }
    const constraint = gridConstraints.get(getPosKey(k.vec2(wire.wireData.x, wire.wireData.y)));
    const isDraggableGridCell = constraint && constraint.canPlace;
    const isDraggableInventoryItem = wire.is(Tag_InventoryItem) && inventory.get(getInventoryItemKey(wire.wireData.type, wire.wireData.modifier))?.count > 0;
    return isDraggableGridCell || isDraggableInventoryItem;
};

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

export function calculateWireVisualSize(width: number, height: number, cols: number, rows: number): number {
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    return Math.min(cellWidth, cellHeight);
}

export function getPosKey(gridPos: Vec2): string {
    return `${gridPos.x},${gridPos.y}`;
}

export function getRotationFromStep(step: number): number {
    return ((step % 4 + 4) % 4) * 90;
}

export const fromCellToWireData = (cellData: CellData): WireData => {
    return {
        type: cellData.type,
        modifier: cellData.modifier,
        rot: cellData.rot,
        x: cellData.x,
        y: cellData.y
    };
}

export const fromItemToWireData = (itemData: ItemData): WireData => {
    return {
        type: itemData.type,
        modifier: itemData.modifier,
        rot: itemData.rot,
        x: itemData.x,
        y: itemData.y
    };
}

export const isFromGrid = (wire: GameObj<WireState>): boolean => {
    return gridConstraints.has(getPosKey(k.vec2(wire.wireData.x, wire.wireData.y)));
}

export const getInventoryItemKey = (type: string, modifier: number) => {
    return `${type}-${modifier ?? 0}`;
}