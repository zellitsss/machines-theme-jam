import {KAPLAYCtx, MouseButton} from 'kaplay';
import Grid from '../grid';
import {PipeDictionary} from '../pipe-dictionary';
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {CellConnections, ConnectionType, TRAVEL_OFFSET} from "../types";
import {canOut} from "../utils";

const CELL_SIZE = 128;

function initializePipeDictionary() {
    PipeDictionary.add('pipe-straight', {
        sprite: 'pipe-straight',
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
    PipeDictionary.add('pipe-l', {
        sprite: 'pipe-l',
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    });
    PipeDictionary.add('pipe-gate-start', {
        sprite: 'pipe-gate',
        flow: [
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    PipeDictionary.add('pipe-gate-end', {
        sprite: 'pipe-gate',
        flow: [
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    })
}

function getRotatedConnections(base: CellConnections, rotationStep: number) {
    let connections = [...base];
    for (let i = 0; i < rotationStep; i++) {
        const last = connections.pop();
        if (last == undefined) continue
        connections.unshift(last);
    }
    return connections as CellConnections;
}

function getNextConnectedCell(grid: Grid, currentCell: Cell): Cell | null {
    const x = currentCell.x;
    const y = currentCell.y;
    let rotatedConnections = getRotatedConnections(PipeDictionary.get(currentCell.type)?.flow ?? [0, 0, 0, 0], currentCell.rot);
    for (let i = 0; i < 4; i++) {
        if (rotatedConnections[i] == 0) {
        }
    }
    let outSide = rotatedConnections.findIndex(c => canOut(c));
    if (outSide >= 0) {
        const nextX = x + TRAVEL_OFFSET[outSide].x;
        const nextY = y + TRAVEL_OFFSET[outSide].y;
        if (nextX >= 0 && nextX < grid.getCols() && nextY >= 0 && nextY < grid.getRows()) {
            console.log("next: ", nextX, nextY);
            return grid.at(nextX, nextY);
        }
    }
    return null;
}

function checkWinCondition(grid: Grid): boolean {
    const startCell = grid.getStartCell();
    if (!startCell.obj) {
        return false;
    }

    let current = startCell;
    let visited = new Set<string>();
    console.log("start: ", current.x, current.y);
    while (current) {
        const posKey = `${current.x},${current.y}`;
        if (visited.has(posKey)) {
            return false;
        }
        visited.add(posKey);

        if (current.type == 'pipe-gate-end') {
            return true;
        }

        const next = getNextConnectedCell(grid, current);
        if (next) {
            current = next;
        }
    }

    return false;
}

function tryRotatePipe(cell: Cell, button: MouseButton): boolean {
    if (!cell.obj || !cell.type || !cell.canRotate) {
        return false;
    }
    if (!PipeDictionary.has(cell.type)) {
        return false;
    }
    if (button === "left") {
        cell.rot = (cell.rot - 1 + 4) % 4;
    } else {
        cell.rot = (cell.rot + 1) % 4;
    }

    cell.obj.angle = cell.rot * 90;
    return true;
}

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-01.json");
        const level = levelData as LevelData;

        initializePipeDictionary();

        //Create grid
        const grid = new Grid(level.cols, level.rows, CELL_SIZE);

        level.cells.forEach((cellDef) => {
            let x = cellDef.x;
            let y = cellDef.y;

            let sprite = PipeDictionary.get(cellDef.type)?.sprite;
            let cell = grid.at(x, y);
            const rot = (cellDef.rot ?? 0) % 4;
            cell.obj = k.add([
                k.pos((x + .5) * CELL_SIZE, (y + .5) * CELL_SIZE),
                k.sprite(sprite ? sprite : "", {
                    width: CELL_SIZE,
                    height: CELL_SIZE
                }),
                k.rotate(rot * 90),
                k.anchor("center")
            ]);
            cell.type = cellDef.type;
            cell.x = x;
            cell.y = y;
            cell.rot = rot;
            if (cellDef.type === "pipe-gate-start" || cellDef.type === "pipe-gate-end") {
                cell.canRotate = false;
            }

            if (cellDef.type == 'pipe-gate-start') {
                grid.setStartCell(cell);
            }
            if (cellDef.type == 'pipe-gate-end') {
                grid.setEndCell(cell);
            }
        });

        k.onMousePress(["left", "right"], (button: MouseButton) => {
            const p = k.toWorld(k.mousePos());
            const cell = grid.cellAtWorld(p.x, p.y);
            if (cell) {
                tryRotatePipe(cell, button);
                var isWin =checkWinCondition(grid);
                k.debug.log(isWin ? "Win" : "Lose");
            }
        });
   
    }
}