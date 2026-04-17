import {GameObj, KAPLAYCtx, MouseButton, TweenController, Vec2} from "kaplay";
import Grid from "../grid";
import {wireDictionary} from "../wire-dictionary";
import {LevelData} from "../LevelData";
import {Cell} from "../cell";
import {calculateCellVisualSize} from "../utils";
import * as Constants from "../constants";
import {createInventorySlots, InventoryOld, LAYER_UI, setupLayers} from "../ui/game-scene-ui";
import {panel} from "../components/panel";
import {drag} from "../components/drag";

const activeTweenByCell = new WeakMap<Cell, TweenController>();

async function loadAssets(k: KAPLAYCtx) {
    await Promise.all([
        k.loadSprite("wire-i", "sprites/wire-i.png"),
        k.loadSprite("wire-l", "sprites/wire-l.png"),
        k.loadSprite("wire-gate", "sprites/wire-gate.png"),
        k.loadSprite("wire-blocked", "sprites/wire-blocked.png"),
        k.loadSprite("wire-i-1w", "sprites/wire-i-1w.png"),
        k.loadSprite("wire-l-1w1", "sprites/wire-l-1w1.png"),
        k.loadSprite("wire-l-1w2", "sprites/wire-l-1w2.png"),
        k.loadSprite("wire-modifier", "sprites/wire-modifier.png")
    ]);
}

function tryRotateWire(k: KAPLAYCtx, cell: Cell, isClockwise: boolean): boolean {
    if (!cell.obj || !cell.type || !cell.canRotate) {
        return false;
    }
    if (!wireDictionary.has(cell.type)) {
        return false;
    }
    if (activeTweenByCell.get(cell)) {
        return false;
    }
    cell.rot = ((cell.rot + (isClockwise ? 1 : -1)) % 4 + 4) % 4;
    animateWireRotation(k, cell, isClockwise);
    return true;
}

function animateWireRotation(k: KAPLAYCtx, cell: Cell, isClockwise: boolean) {
    const obj = cell.obj!;
    const from = obj.angle;
    let bias = isClockwise ? 1 : -1;
    const to = from + bias * Constants.ROTATION_ANGLE_PER_STEP;
    // Rotate tween
    const tween = obj.tween(from, to, Constants.ROTATE_TWEEN_SEC, (a) => {
        obj.angle = a;
    }, k.easings.easeInOutQuad);

    const half = Constants.ROTATE_TWEEN_SEC / 2;
    const scaleNormal = k.vec2(1, 1);
    const scaleSmall = k.vec2(Constants.ROTATE_SCALE_PEAK, Constants.ROTATE_SCALE_PEAK);
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

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        setupLayers(k);

        await loadAssets(k);
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-02.json");
        const level = levelData as LevelData;

        const inventoryData: Map<string, number> = new Map(
            Object.entries(level.inventory ?? {}).filter(([id, count]) => count > 0 && wireDictionary.has(id))
        );

        // Layout
        const leftPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(),
            k.anchor("topleft"),
            panel(k.width() * Constants.LEFT_PANEL_RATIO, k.height())
        ]);
        const topPanel = -k.add([
            k.anchor("top"),
            k.pos(leftPanel.pos.x + (k.width() * Constants.CENTER_PANEL_RATIO / 2), 0),
            panel(k.width() * Constants.CENTER_PANEL_RATIO, Constants.TOP_PANEL_HEIGHT)
        ]);
        const centerPanel = k.add([
            k.pos(leftPanel.pos.x + leftPanel.width, Constants.TOP_PANEL_HEIGHT),
            k.anchor("top"),
            panel(k.width() * Constants.CENTER_PANEL_RATIO, k.height() - Constants.TOP_PANEL_HEIGHT)
        ]);
        const rightPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(centerPanel.pos.x + centerPanel.width, 0),
            k.anchor("topleft"),
            panel(k.width() * Constants.RIGHT_PANEL_RATIO, k.height())
        ]);
        
        const cellVisualSize = calculateCellVisualSize(
            centerPanel.width - Constants.MAIN_PANEL_PADDING * 2,
            centerPanel.height - Constants.MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);
        
        //Create grid
        const grid = new Grid(centerPanel, level.cols, level.rows, cellVisualSize);
        const gridOffsetX = ((centerPanel.width - Constants.MAIN_PANEL_PADDING * 2) - level.cols * cellVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;
        const girdOffsetY = ((centerPanel.height - Constants.MAIN_PANEL_PADDING * 2) - level.rows * cellVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;

        function logWinState() {
            k.debug.log(grid.checkWinCondition() ? "Win" : "Lose");
        }

        let inventory: InventoryOld;

        function clearCell(cell: Cell) {
            if (cell.obj) {
                cell.obj.destroy();
            }
            cell.obj = null;
            cell.type = "";
            cell.rot = 0;
            cell.placedFromInventory = false;
        }

        function tryPlaceFromInventory(wireType: string, worldPos: Vec2): boolean {
            const cell = grid.cellAtWorld(worldPos.x, worldPos.y);
            if (!cell || cell.obj || !cell.canPlace) {
                return false;
            }
            if (!wireDictionary.has(wireType)) {
                return false;
            }
            placeWire(cell, wireType, 0, true);
            logWinState();
            return true;
        }

        inventory = createInventorySlots(k, leftPanel, inventoryData, tryPlaceFromInventory);

        function placeWire(cell: Cell, wireType: string, rot: number, fromInventory: boolean) {
            const sprite = wireDictionary.get(wireType)?.sprite;
            cell.placedFromInventory = fromInventory;
            cell.type = wireType;
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
                                wireType: cell.type,
                                source: "grid" as const,
                                fromCell: cell,
                            };
                        },
                        onDrop(worldPos, payload) {
                            if (payload.source !== "grid" || !payload.fromCell || payload.fromCell !== cell) {
                                return;
                            }
                            const fromCell = cell;
                            const wireTypeMoved = fromCell.type;
                            const rotMoved = fromCell.rot;
                            const targetCell = grid.cellAtWorld(worldPos.x, worldPos.y);

                            if (targetCell === fromCell) {
                                return;
                            }

                            if (targetCell && !targetCell.obj && targetCell.canPlace) {
                                clearCell(fromCell);
                                placeWire(targetCell, wireTypeMoved, rotMoved, true);
                                logWinState();
                                return;
                            }

                            clearCell(fromCell);
                            inventory.add(wireTypeMoved, 1);
                            logWinState();
                        },
                        onTap: () => {
                            if (tryRotateWire(k, cell, true)) {
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
                    if (tryRotateWire(k, cell, true)) {
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

            placeWire(cell, cellDef.type, rot, false);

            if (cellDef.type == 'wire-gate-start') {
                grid.setStartCell(cell);
            }
            if (cellDef.type == 'wire-gate-end') {
                grid.setEndCell(cell);
            }
        });
    };
}
