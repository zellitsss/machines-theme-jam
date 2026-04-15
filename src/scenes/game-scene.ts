import {KAPLAYCtx, MouseButton, TweenController} from 'kaplay';
import Grid from '../grid';
import {PipeDictionary} from '../pipe-dictionary';
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {CellConnections, ConnectionType, Side, TRAVEL_OFFSET} from "../types";
import {canOut} from "../utils";

const CELL_SIZE = 128;
const ROTATE_TWEEN_SEC = 0.25;
const ROTATE_SCALE_PEAK = 0.9;
const activeTweenByCell = new WeakMap<Cell, TweenController>();

function initializePipeDictionary() {
    PipeDictionary.add('pipe-i', {
        sprite: 'pipe-i',
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
    console.log("get next connected cell: ", x, y);
    let rotatedConnections = getRotatedConnections(PipeDictionary.get(currentCell.type)?.flow ?? [0, 0, 0, 0], currentCell.rot);
    for (let i = 0; i < 4; i++) {
        if (rotatedConnections[i] == 0) {
        }
    }
    let outSide = rotatedConnections.findIndex(c => canOut(c));
    console.log("direction: ", outSide);
    if (outSide >= 0) {
        const nextX = x + TRAVEL_OFFSET[outSide].x;
        const nextY = y + TRAVEL_OFFSET[outSide].y;
        if (nextX >= 0 && nextX < grid.getCols() && nextY >= 0 && nextY < grid.getRows()) {
            console.log("next: ", nextX, nextY);
            return grid.at(nextX, nextY);
        }
    }
    console.log("no next");
    return null;
}

function checkWinCondition(grid: Grid): boolean {
    const startCell = grid.getStartCell();
    if (!startCell.obj) {
        return false;
    }

    let current = startCell;
    let visited = new Set<string>();
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
        const level = levelData as LevelData;

        // Load inventory data
        const inventory: Map<string, number> = new Map(
            Object.entries(level.inventory ?? {})
        );

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
                k.scale(1),
                k.anchor("center"),
                k.timer()
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

        function tryRotatePipe(cell: Cell, button: MouseButton): boolean {
            if (!cell.obj || !cell.type || !cell.canRotate) {
                return false;
            }
            if (!PipeDictionary.has(cell.type)) {
                return false;
            }
            if (activeTweenByCell.get(cell)) {
                return false;
            }

            const delta = button === "left" ? -90 : 90;
            if (button === "left") {
                cell.rot = (cell.rot - 1 + 4) % 4;
            } else {
                cell.rot = (cell.rot + 1) % 4;
            }

            animatePipeRotation(cell, delta);

            return true;
        }

        function animatePipeRotation(cell: Cell, delta: number) {
            const obj = cell.obj!;
            const from = obj.angle;
            const to = from + delta;
            // Rotate tween
            const tween = obj.tween(from, to, ROTATE_TWEEN_SEC, (a) => {
                obj.angle = a;
            }, k.easings.easeInOutQuad);

            const half = ROTATE_TWEEN_SEC / 2;
            const scaleNormal = k.vec2(1, 1);
            const scaleSmall = k.vec2(ROTATE_SCALE_PEAK, ROTATE_SCALE_PEAK);
            // Scale tween
            obj
                .tween(scaleNormal, scaleSmall, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
                .then(() =>
                    obj.tween(scaleSmall, scaleNormal, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
                );

            activeTweenByCell.set(cell, tween);
            tween.onEnd(() => {
                activeTweenByCell.delete(cell);
                obj.angle = cell.rot * 90;
                obj.scaleTo(1);
            });
        }

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