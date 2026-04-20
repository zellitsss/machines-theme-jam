import {GameObj, KAPLAYCtx, PosComp, RotateComp} from "kaplay";
import {calculateWireVisualSize, canDrag, fromCellToWireData, getPosKey, getRotationFromStep} from "../utils";
import {audio} from "../core/audio";
import {panel} from "../components/panel";
import {LAYER_BACKGROUND, LAYER_GAME, LAYER_UI, LevelData} from "../types";
import {createGhostWire, createPlaceholderWire, createWire} from "../entities/wire";
import {
    activeTweenByCell,
    animateWireRotation,
    handleRotatingWire, isInPanels,
    isWiresConnected,
    needWireBg
} from "../core/gameplay";
import {WireState} from "../components/wireState";
import {calculateCellPos, canPlaceAt, gridConstraints, isValidCell, worldToGrid} from "../core/grid";
import {
    CELL_SIZE, CENTER_PANEL_RATIO,
    EVENT_WireClicked, EVENT_WireDraggingUpdate,
    EVENT_WireEndDragging,
    EVENT_WireStartDragging, INVENTORY_CELL_SIZE,
    k, LEFT_PANEL_RATIO, MAIN_PANEL_PADDING, RIGHT_PANEL_RATIO,
    TOP_PANEL_HEIGHT
} from "../constants";
import {createInventorySlot, inventory, inventorySlots, updateItem} from "../core/inventory";

async function loadAssets() {
    await Promise.all([
        k.loadSprite("atlas", "sprites/atlas.png", {
            sliceX: 6,
            sliceY: 3,
            filter: "linear"
        }),
        k.loadSprite("background", "sprites/Background.png", {
            slice9: {
                top: 232,
                bottom: 232,
                left: 217,
                right: 380,
                tileMode: "none"
            }
        }),
    ]);
}

function resetContainers() {
    gridConstraints.clear();
    activeTweenByCell.clear();
    inventory.clear();
    inventorySlots.length = 0;
}

function setupLayers(): void {
    k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI], LAYER_GAME);
}

export default function createGameScene() {
    let gridOffsetX = 0;
    let gridOffsetY = 0;
    let wireVisualSize = CELL_SIZE;
    return async () => {
        audio.playBgm("bgm-gameplay");

        resetContainers();
        setupLayers();

        await loadAssets();
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-02.json");
        const level = levelData as LevelData;

        /********** EVENTS **********/
        k.on("rotationStepUpdated", "wire", (wire: GameObj<WireState | RotateComp>) => {
            animateWireRotation(wire, () => {
                checkWinCondition()
            });
        });

        k.on(EVENT_WireClicked, "wire", (wire: GameObj<WireState>) => {
            handleRotatingWire(wire);
        });

        let ghostWire: GameObj | null = null;
        k.on(EVENT_WireStartDragging, "wire", (wire: GameObj<WireState>) => {
            if (!canDrag(wire))
            {
                return;
            }
            wire.hidden = !wire.is("inventory_item");
            ghostWire = createGhostWire(wire);
            audio.playSfx("sfx-pickup");
        });

        k.on(EVENT_WireEndDragging, "wire", (wire: GameObj<WireState | PosComp>) => {
            ghostWire?.destroy();
            
            if (!canDrag(wire)) {
                return;
            }

            const dropPos = k.mousePos();
            const gridPos = worldToGrid(dropPos.x, dropPos.y, wireVisualSize, gridOffsetX, gridOffsetY);
            if (canPlaceAt(...gridPos, wire.wireData.modifier)) {
                // Place in the empty cell
                const isFromInventory = wire.is("inventory_item");
                if (isFromInventory) {
                    const wireData = wire.wireData;
                    const constraint = gridConstraints.get(getPosKey(gridPos[0], gridPos[1]));
                    if (constraint && (constraint.placeholder ?? false)) {
                        wireData.rot = constraint.rot ?? 0;
                    }
                    const newWire = createWire(
                        ...calculateCellPos(gridPos[0], gridPos[1], wireVisualSize, gridOffsetX, gridOffsetY),
                        wireVisualSize,
                        wireData,
                        true,
                        [
                            getPosKey(gridPos[0], gridPos[1]),
                            "in_grid"
                        ]
                    ) as GameObj<WireState>;
                    newWire.wireData.x = gridPos[0];
                    newWire.wireData.y = gridPos[1];
                    updateItem(wire.wireData.type, -1);
                } else {
                    wire.hidden = false;
                    wire.pos = k.vec2(...calculateCellPos(gridPos[0], gridPos[1], wireVisualSize, gridOffsetX, gridOffsetY));
                    wire.untag(getPosKey(wire.wireData.x, wire.wireData.y));
                    wire.wireData.x = gridPos[0];
                    wire.wireData.y = gridPos[1];
                    wire.tag(getPosKey(wire.wireData.x, wire.wireData.y));
                }
            } else {
                // The cell is occupied
                // Check the wire is from grid or inventory
                if (isValidCell(wire.wireData.x, wire.wireData.y)) {
                    // The wire is from grid
                    if (isInPanels(k.get("inventory_panel"), dropPos)) {
                        // Move to inventory
                        wire.destroy();
                        updateItem(wire.wireData.type, 1);
                    } else {
                        // Return to the original cell
                        wire.hidden = false;
                        wire.pos = k.vec2(...calculateCellPos(wire.wireData.x, wire.wireData.y, wireVisualSize, gridOffsetX, gridOffsetY));
                    }
                }
            }

            audio.playSfx("sfx-place");

            checkWinCondition();
        });

        k.on(EVENT_WireDraggingUpdate, "wire", (wire: GameObj<WireState | PosComp>) => {
            if (ghostWire) {
                ghostWire.pos = k.mousePos();
            }
        });
        /********** EVENTS **********/

        level.inventory.forEach((itemData) => {
            inventory.set(itemData.type, itemData);
        });

        // Background
        k.add([
            k.pos(),
            k.anchor("topleft"),
            k.layer(LAYER_BACKGROUND),
            k.sprite("background", {
                width: k.width(),
                height: k.height(),
            })
        ])

        // Layout
        const topPanel = k.add([
            k.anchor("top"),
            k.pos(),
            panel(k.width(), TOP_PANEL_HEIGHT)
        ]);
        const leftPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(0, topPanel.height),
            k.anchor("topleft"),
            panel(k.width() * LEFT_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT),
            "inventory_panel"
        ]);
        const centerPanel = k.add([
            k.pos(leftPanel.pos.x + leftPanel.width, TOP_PANEL_HEIGHT),
            k.anchor("top"),
            panel(k.width() * CENTER_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT)
        ]);
        const rightPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(centerPanel.pos.x + centerPanel.width, topPanel.height),
            k.anchor("topleft"),
            panel(k.width() * RIGHT_PANEL_RATIO, k.height()),
            "inventory_panel"
        ]);

        wireVisualSize = calculateWireVisualSize(
            centerPanel.width - MAIN_PANEL_PADDING * 2,
            centerPanel.height - MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);

        //Create grid
        gridOffsetX = centerPanel.pos.x + ((centerPanel.width - MAIN_PANEL_PADDING * 2) - level.cols * wireVisualSize) / 2 + MAIN_PANEL_PADDING;
        gridOffsetY = centerPanel.pos.y + ((centerPanel.height - MAIN_PANEL_PADDING * 2) - level.rows * wireVisualSize) / 2 + MAIN_PANEL_PADDING;

        // Create default grid constraints
        for (let c = 0; c < level.cols; c++) {
            for (let r = 0; r < level.rows; r++) {
                gridConstraints.set(getPosKey(c, r), {
                    canRotate: true,
                    canPlace: true,
                });

                k.add([
                    k.pos(gridOffsetX + (c + 0.5) * wireVisualSize, gridOffsetY + (r + 0.5) * wireVisualSize),
                    k.anchor("center"),
                    k.sprite("atlas", {
                        width: wireVisualSize,
                        height: wireVisualSize,
                        frame: 13
                    }),
                    k.color(199, 199, 199),
                    `grid_dot_${getPosKey(c, r)}`,
                ])
            }
        }

        let startWire: GameObj<WireState>;
        let endWire: GameObj<WireState>;

        level.cells.forEach((cellData) => {
            let config = gridConstraints.get(getPosKey(cellData.x, cellData.y));
            if (config) {
                config.canRotate = cellData.canRotate ?? true;
                config.canPlace = cellData.canPlace ?? true;
                config.rot = cellData.rot ?? 0;
                config.type = cellData.type ?? "";
                config.modifier = cellData.modifier ?? 0;
                config.placeholder = cellData.placeholder ?? false;
            }

            const cellPos = calculateCellPos(cellData.x, cellData.y, wireVisualSize, gridOffsetX, gridOffsetY);

            if (config.placeholder) {
                createPlaceholderWire(
                    cellPos[0],
                    cellPos[1],
                    wireVisualSize,
                    fromCellToWireData(cellData),
                    ["placeholder", getPosKey(cellData.x, cellData.y)],
                );
            } else {
                const wire = createWire(
                    cellPos[0],
                    cellPos[1],
                    wireVisualSize,
                    fromCellToWireData(cellData),
                    needWireBg(cellData),
                    [
                        getPosKey(cellData.x, cellData.y),
                        "in_grid"
                    ]
                );
            }
        });

        // Inventory
        Array.from(inventory.values()).forEach((item, index) => {
            const wire = createInventorySlot(
                INVENTORY_CELL_SIZE,
                item,
                [leftPanel, rightPanel]
            );
        });

        function checkWinCondition() {
            k.debug.log(isWiresConnected() ? "Win" : "Lose");
        }
    };
}
