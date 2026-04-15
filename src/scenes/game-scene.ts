import {KAPLAYCtx, MouseButton, TweenController} from 'kaplay';
import Grid from '../grid';
import {PipeDictionary} from '../pipe-dictionary';
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {CellConnections, ConnectionType, TRAVEL_OFFSET} from "../types";
import {canIn, canOut, getOppositeSide, getRotatedConnections} from "../utils";
import {CELL_SIZE, ROTATE_SCALE_PEAK, ROTATE_TWEEN_SEC, ROTATION_ANGLE_PER_STEP} from "../constants";

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
    });
    PipeDictionary.add('pipe-blocked', {
        sprite: 'pipe-blocked',
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    })
}

function checkWinCondition(grid: Grid): boolean {
    const startCell = grid.getStartCell();
    if (!startCell.obj) {
        return false;
    }

    let current = startCell;
    let visited = new Set<string>();
    let incomingSide = -1;
    while (current) {
        const posKey = `${current.x},${current.y}`;
        if (visited.has(posKey)) {
            return false;
        }
        visited.add(posKey);
        
        if (current.type === "pipe-gate-end") {
            return true;
        }
        
        const exitSide = current.getExitSide(incomingSide);
        if (exitSide === null) {
            break;
        }
        
        const next = grid.getNextConnectedCell(current, exitSide);
        if (!next) {
            break;
        }
        
        // Check if next cell is connected to the current cell
        const nextEntrySide = getOppositeSide(exitSide);
        const nextRotatedConnections = getRotatedConnections(PipeDictionary.get(next.type)?.flow ?? [0, 0, 0, 0], next.rot);
        if (!canIn(nextRotatedConnections[nextEntrySide])) {
            break;
        }
        
        incomingSide = (exitSide + 2) % 4;
        current = next;
    }

    return false;
}

async function loadAssets(k: KAPLAYCtx) {
    await k.loadSprite("pipe-i", "sprites/pipe-straight.png");
    await k.loadSprite("pipe-l", "sprites/pipe-l.png");
    await k.loadSprite("pipe-gate", "sprites/pipe-gate.png");
    await k.loadSprite("pipe-blocked", "sprites/pipe-blocked.png");
}

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        await loadAssets(k);
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
                k.scale(1),
                k.anchor("center"),
                k.timer()
            ]);
            cell.type = cellDef.type;
            cell.x = x;
            cell.y = y;
            cell.rot = rot;
            cell.canRotate = cellDef.canRotate ?? true;
            cell.canClear = cellDef.canClear ?? true;
            cell.canPlace = cellDef.canPlace ?? true;

            if (cellDef.type == 'pipe-gate-start') {
                grid.setStartCell(cell);
            }
            if (cellDef.type == 'pipe-gate-end') {
                grid.setEndCell(cell);
            }
        });

        function tryRotatePipe(cell: Cell, isClockwise: boolean): boolean {
            if (!cell.obj || !cell.type || !cell.canRotate) {
                return false;
            }
            if (!PipeDictionary.has(cell.type)) {
                return false;
            }
            if (activeTweenByCell.get(cell)) {
                return false;
            }
            cell.rot = ((cell.rot + (isClockwise ? 1 : -1)) % 4 + 4) % 4;
            animatePipeRotation(cell, isClockwise);
            return true;
        }

        function animatePipeRotation(cell: Cell, isClockwise: boolean) {
            const obj = cell.obj!;
            const from = obj.angle;
            let bias = isClockwise ? 1 : -1;
            const to = from + bias * ROTATION_ANGLE_PER_STEP;
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
                tryRotatePipe(cell, button === "left");
                const isWin = checkWinCondition(grid);
                k.debug.log(isWin ? "Win" : "Lose");
            }
        });
    }
}