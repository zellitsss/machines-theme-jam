import {KAPLAYCtx} from 'kaplay';
import Grid from '../grid';
import {PipeDictionary} from '../pipe-dictionary';
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {CellConnections, ConnectionType, TRAVEL_OFFSET} from "../types";
import {canOut} from "../utils";

const GRID_COLS = 3;
const GRID_ROWS = 5
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
        connections.unshift(last);
    }
    return connections as CellConnections;
}

function getNextConnectedCell(grid: Grid, currentCell: Cell): Cell {
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
        if (nextX >= 0 && nextX < GRID_COLS && nextY >= 0 && nextY < GRID_ROWS) {
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

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-01.json");

        initializePipeDictionary();

        // Create grid
        let grid = new Grid(GRID_COLS, GRID_ROWS);

        (levelData as LevelData).cells.forEach((cellDef) => {
            let x = cellDef.x;
            let y = cellDef.y;

            let sprite = PipeDictionary.get(cellDef.type)?.sprite;
            let cell = grid.at(x, y);
            cell.obj = k.add([
                k.pos((x + .5) * CELL_SIZE, (y + .5) * CELL_SIZE),
                k.sprite(sprite ? sprite : "", {
                    width: CELL_SIZE,
                    height: CELL_SIZE
                }),
                k.rotate(cellDef.rot ? cellDef.rot * 90 : 0),
                k.anchor("center")
            ]);
            cell.type = cellDef.type;
            cell.x = x;
            cell.y = y;
            cell.rot = cellDef.rot;

            if (cellDef.type == 'pipe-gate-start') {
                grid.setStartCell(cell);
            }
            if (cellDef.type == 'pipe-gate-end') {
                grid.setEndCell(cell);
            }
        });

        k.onMousePress(() => {
            let isWin = checkWinCondition(grid);
            console.log(isWin);
        })
    }
}