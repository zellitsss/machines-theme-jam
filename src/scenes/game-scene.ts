import {GameObj, KAPLAYCtx, MouseButton, TweenController, Vec2} from "kaplay";
import Grid from "../grid";
import {PipeDictionary} from "../pipe-dictionary";
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {ConnectionType} from "../types";
import {canIn, getOppositeSide, getRotatedConnections} from "../utils";
import {
    CELL_SIZE, CENTER_PANEL_RATIO,
    LEFT_PANEL_RATIO, MAIN_PANEL_PADDING,
    RIGHT_PANEL_RATIO,
    ROTATE_SCALE_PEAK,
    ROTATE_TWEEN_SEC,
    ROTATION_ANGLE_PER_STEP, TOP_PANEL_HEIGHT
} from "../constants";
import {createInventorySlots, Inventory, LAYER_UI, setupLayers} from "../ui/game-scene-ui";
import {panel} from "../components/panel";
import {drag} from "../components/drag";

const activeTweenByCell = new WeakMap<Cell, TweenController>();

function initializePipeDictionary() {
    PipeDictionary.add("pipe-i", {
        sprite: "pipe-i",
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
    PipeDictionary.add("pipe-l", {
        sprite: "pipe-l",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    });
    PipeDictionary.add("pipe-gate-start", {
        sprite: "pipe-gate",
        flow: [
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    PipeDictionary.add("pipe-gate-end", {
        sprite: "pipe-gate",
        flow: [
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    PipeDictionary.add("pipe-blocked", {
        sprite: "pipe-blocked",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    PipeDictionary.add("pipe-i-1w", {
        sprite: "pipe-i-1w",
        flow: [
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.None
        ]
    });
    PipeDictionary.add("pipe-l-1w1", {
        sprite: "pipe-l-1w1",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.Outlet
        ]
    });
    PipeDictionary.add("pipe-l-1w2", {
        sprite: "pipe-l-1w2",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.Inlet
        ]
    });
    PipeDictionary.add("pipe-modifier", {
        sprite: "pipe-modifier",
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
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
    await Promise.all([
        k.loadSprite("pipe-i", "sprites/pipe-straight.png"),
        k.loadSprite("pipe-l", "sprites/pipe-l.png"),
        k.loadSprite("pipe-gate", "sprites/pipe-gate.png"),
        k.loadSprite("pipe-blocked", "sprites/pipe-blocked.png"),
        k.loadSprite("pipe-i-1w", "sprites/pipe-i-1w.png"),
        k.loadSprite("pipe-l-1w1", "sprites/pipe-l-1w1.png"),
        k.loadSprite("pipe-l-1w2", "sprites/pipe-l-1w2.png"),
        k.loadSprite("pipe-modifier", "sprites/pipe-modifier.png")
    ]);
}

function tryRotatePipe(k: KAPLAYCtx, cell: Cell, isClockwise: boolean): boolean {
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
    animatePipeRotation(k, cell, isClockwise);
    return true;
}

function animatePipeRotation(k: KAPLAYCtx, cell: Cell, isClockwise: boolean) {
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

function calculateCellVisualSize(width: number, height: number, cols: number, rows: number): number {
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    return Math.min(cellWidth, cellHeight);
}

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        setupLayers(k);

        await loadAssets(k);
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-02.json");
        const level = levelData as LevelData;

        initializePipeDictionary();

        const inventoryData: Map<string, number> = new Map(
            Object.entries(level.inventory ?? {}).filter(([id, count]) => count > 0 && PipeDictionary.has(id))
        );

        // Layout
        const leftPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(),
            k.anchor("topleft"),
            panel(k.width() * LEFT_PANEL_RATIO, k.height())
        ]);
        const topPanel = -k.add([
            k.anchor("top"),
            k.pos(leftPanel.pos.x + (k.width() * CENTER_PANEL_RATIO / 2), 0),
            panel(k.width() * CENTER_PANEL_RATIO, TOP_PANEL_HEIGHT)
        ]);
        const centerPanel = k.add([
            k.pos(leftPanel.pos.x + leftPanel.width, TOP_PANEL_HEIGHT),
            k.anchor("top"),
            panel(k.width() * CENTER_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT)
        ]);
        const rightPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(centerPanel.pos.x + centerPanel.width, 0),
            k.anchor("topleft"),
            panel(k.width() * RIGHT_PANEL_RATIO, k.height())
        ]);
        
        const cellVisualSize = calculateCellVisualSize(
            centerPanel.width - MAIN_PANEL_PADDING * 2,
            centerPanel.height - MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);
        
        //Create grid
        const grid = new Grid(centerPanel, level.cols, level.rows, cellVisualSize);
        const gridOffsetX = ((centerPanel.width - MAIN_PANEL_PADDING * 2) - level.cols * cellVisualSize) / 2 + MAIN_PANEL_PADDING;
        const girdOffsetY = ((centerPanel.height - MAIN_PANEL_PADDING * 2) - level.rows * cellVisualSize) / 2 + MAIN_PANEL_PADDING;

        function logWinState() {
            k.debug.log(checkWinCondition(grid) ? "Win" : "Lose");
        }

        let inventory: Inventory;

        function clearCell(cell: Cell) {
            if (cell.obj) {
                cell.obj.destroy();
            }
            cell.obj = null;
            cell.type = "";
            cell.rot = 0;
            cell.placedFromInventory = false;
        }

        function tryPlaceFromInventory(pipeType: string, worldPos: Vec2): boolean {
            const cell = grid.cellAtWorld(worldPos.x, worldPos.y);
            if (!cell || cell.obj || !cell.canPlace) {
                return false;
            }
            if (!PipeDictionary.has(pipeType)) {
                return false;
            }
            placePipe(cell, pipeType, 0, true);
            logWinState();
            return true;
        }

        inventory = createInventorySlots(k, leftPanel, inventoryData, tryPlaceFromInventory);

        function placePipe(cell: Cell, pipeType: string, rot: number, fromInventory: boolean) {
            const sprite = PipeDictionary.get(pipeType)?.sprite;
            cell.placedFromInventory = fromInventory;
            cell.type = pipeType;
            cell.rot = rot % 4;

            const comps: unknown[] = [
                k.pos(
                    gridOffsetX + (cell.x + 0.5) * cellVisualSize,
                    girdOffsetY + (cell.y + 0.5) * cellVisualSize
                ),
                k.sprite(sprite ? sprite : "", {
                    width: cellVisualSize,
                    height: cellVisualSize,
                }),
                k.rotate(cell.rot * 90),
                k.scale(1),
                k.anchor("center"),
                k.timer(),
                k.area(),
            ];

            if (fromInventory) {
                comps.push(
                    drag({
                        k,
                        layer: LAYER_UI,
                        getPayload: () => {
                            if (!cell.placedFromInventory || !cell.type) {
                                return null;
                            }
                            return {
                                pipeType: cell.type,
                                source: "grid" as const,
                                fromCell: cell,
                            };
                        },
                        onDrop(worldPos, payload) {
                            if (payload.source !== "grid" || !payload.fromCell || payload.fromCell !== cell) {
                                return;
                            }
                            const fromCell = cell;
                            const pipeTypeMoved = fromCell.type;
                            const rotMoved = fromCell.rot;
                            const targetCell = grid.cellAtWorld(worldPos.x, worldPos.y);

                            if (targetCell === fromCell) {
                                return;
                            }

                            if (targetCell && !targetCell.obj && targetCell.canPlace) {
                                clearCell(fromCell);
                                placePipe(targetCell, pipeTypeMoved, rotMoved, true);
                                logWinState();
                                return;
                            }

                            clearCell(fromCell);
                            inventory.add(pipeTypeMoved, 1);
                            logWinState();
                        },
                        onTap: () => {
                            if (tryRotatePipe(k, cell, true)) {
                                logWinState();
                            }
                        },
                    })
                );
            }

            cell.obj = centerPanel.add(comps as GameObj[]);

            if (fromInventory) {
                cell.obj.onClick((button: MouseButton) => {
                    if (button !== "left") return;
                    if (cell.obj?.isDragging()) return;
                    cell.obj!.pick();
                });
            } else {
                cell.obj.onClick((button: MouseButton) => {
                    if (button !== "left") return;
                    if (tryRotatePipe(k, cell, true)) {
                        logWinState();
                    }
                });
            }
        }

        level.cells.forEach((cellDef) => {
            const x = cellDef.x;
            const y = cellDef.y;
            const cell = grid.at(x, y);
            const rot = (cellDef.rot ?? 0) % 4;

            cell.canRotate = cellDef.canRotate ?? true;
            cell.canClear = cellDef.canClear ?? true;
            cell.canPlace = cellDef.canPlace ?? true;
            cell.x = x;
            cell.y = y;

            placePipe(cell, cellDef.type, rot, false);

            if (cellDef.type == 'pipe-gate-start') {
                grid.setStartCell(cell);
            }
            if (cellDef.type == 'pipe-gate-end') {
                grid.setEndCell(cell);
            }
        });
    };
}
