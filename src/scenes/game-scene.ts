import {GameObj, PosComp, RotateComp} from "kaplay";
import {calculateWireVisualSize, canDrag, fromCellToWireData, getPosKey, getRotationFromStep} from "../utils";
import {audio} from "../core/audio";
import {panel} from "../components/panel";
import {LevelData} from "../types";
import {createGhostWire, createPlaceholderWire, createWire} from "../entities/wire";
import {
    activeTweenByCell,
    animateWireRotation,
    handleRotatingWire,
    checkWireLineValid,
    needWireBg
} from "../core/gameplay";
import {WireState} from "../components/wireState";
import {calculateCellPos, canPlaceAt, gridConstraints, isValidCell, worldToGrid} from "../core/grid";
import {
    CELL_SIZE, CENTER_PANEL_RATIO, EVENT_WireClicked, EVENT_WireDraggingUpdate,
    EVENT_WireEndDragging,
    EVENT_WireStartDragging, FOOTER_HEIGHT, INVENTORY_BORDER_HEIGHT, INVENTORY_CELL_SIZE, INVENTORY_TITLE_TEXT,
    k, LAYER_BACKGROUND,
    LAYER_UI, LEFT_PANEL_RATIO, MAIN_PANEL_PADDING, RIGHT_PANEL_RATIO, TAG_CURRENT_MODIFIER_TEXT, Tag_InventoryItem,
    Tag_InventoryPanel, Tag_Placeholder, TAG_TARGET_MODIFIER_TEXT, Tag_Wire, Tag_Wire_InGrid,
    TOP_PANEL_HEIGHT
} from "../constants";
import {createInventorySlot, inventory, inventorySlots, updateItem} from "../core/inventory";
import {createBorder} from "../entities/border";
import {createGameText} from "../entities/gameText";
import {playEnterTransition} from "../core/transition";

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

export default function createGameScene() {
    let gridOffsetX = 0;
    let gridOffsetY = 0;
    let wireVisualSize = CELL_SIZE;
    return async () => {
        playEnterTransition();
        audio.playBgm("bgm-gameplay");

        resetContainers();

        await loadAssets();
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-02.json");
        const level = levelData as LevelData;

        /********** EVENTS **********/
        k.on("rotationStepUpdated", Tag_Wire, (wire: GameObj<WireState | RotateComp>) => {
            animateWireRotation(wire, () => {
                checkWinCondition()
            });
        });

        k.on(EVENT_WireClicked, Tag_Wire, (wire: GameObj<WireState>) => {
            handleRotatingWire(wire);
        });

        let ghostWire: GameObj | null = null;
        k.on(EVENT_WireStartDragging, Tag_Wire, (wire: GameObj<WireState>) => {
            if (!canDrag(wire)) {
                return;
            }
            wire.hidden = !wire.is(Tag_InventoryItem);
            ghostWire = createGhostWire(wire);
            audio.playSfx("sfx-pickup");
        });

        k.on(EVENT_WireEndDragging, Tag_Wire, (wire: GameObj<WireState | PosComp>) => {
            ghostWire?.destroy();

            if (!canDrag(wire)) {
                return;
            }

            const dropPos = k.mousePos();
            const gridPos = worldToGrid(dropPos.x, dropPos.y, wireVisualSize, gridOffsetX, gridOffsetY);
            if (canPlaceAt(gridPos, wire.wireData.modifier)) {
                // Place in the empty cell
                const isFromInventory = wire.is(Tag_InventoryItem);
                if (isFromInventory) {
                    const wireData = wire.wireData;
                    const constraint = gridConstraints.get(getPosKey(gridPos));
                    if (constraint && (constraint.placeholder ?? false)) {
                        wireData.rot = constraint.rot ?? 0;
                    }
                    const newWire = createWire(
                        calculateCellPos(gridPos, wireVisualSize, gridOffsetX, gridOffsetY),
                        wireVisualSize,
                        wireData,
                        true,
                        [
                            getPosKey(gridPos),
                            Tag_Wire_InGrid
                        ]
                    ) as GameObj<WireState>;
                    newWire.wireData.x = gridPos.x;
                    newWire.wireData.y = gridPos.y;
                    updateItem(wire.wireData.type, -1);
                } else {
                    wire.hidden = false;
                    wire.pos = calculateCellPos(gridPos, wireVisualSize, gridOffsetX, gridOffsetY);
                    wire.untag(getPosKey(k.vec2(wire.wireData.x, wire.wireData.y)));
                    wire.wireData.x = gridPos.x;
                    wire.wireData.y = gridPos.y;
                    wire.tag(getPosKey(gridPos));
                }
            } else {
                // The cell is occupied
                // Check the wire is from grid or inventory
                if (isValidCell(k.vec2(wire.wireData.x, wire.wireData.y))) {
                    // The wire is from grid
                    if (!isValidCell(worldToGrid(dropPos.x, dropPos.y, wireVisualSize, gridOffsetX, gridOffsetY))) {
                        // Move to inventory
                        wire.destroy();
                        updateItem(wire.wireData.type, 1);
                    } else {
                        // Return to the original cell
                        wire.hidden = false;
                        wire.pos = calculateCellPos(k.vec2(wire.wireData.x, wire.wireData.y), wireVisualSize, gridOffsetX, gridOffsetY);
                    }
                }
            }

            audio.playSfx("sfx-place");

            checkWinCondition();
        });

        k.on(EVENT_WireDraggingUpdate, Tag_Wire, (wire: GameObj<WireState | PosComp>) => {
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
            k.pos(0, topPanel.panelHeight),
            k.anchor("topleft"),
            panel(k.width() * LEFT_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT),
        ]);
        const borderWidth = leftPanel.panelWidth * 0.75;
        const leftBorder = createBorder(
            INVENTORY_TITLE_TEXT,
            k.vec2(leftPanel.panelWidth / 2, MAIN_PANEL_PADDING),
            borderWidth,
            INVENTORY_BORDER_HEIGHT,
            [Tag_InventoryPanel],
            leftPanel
        );
        const centerPanel = k.add([
            k.pos(leftPanel.pos.x + leftPanel.panelWidth, TOP_PANEL_HEIGHT),
            k.anchor("top"),
            panel(k.width() * CENTER_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT - FOOTER_HEIGHT)
        ]);
        const rightPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(centerPanel.pos.x + centerPanel.panelWidth, topPanel.panelHeight),
            k.anchor("topleft"),
            panel(k.width() * RIGHT_PANEL_RATIO, k.height()),
        ]);
        const rightBorder = createBorder(
            INVENTORY_TITLE_TEXT,
            k.vec2(rightPanel.panelWidth / 2, MAIN_PANEL_PADDING),
            borderWidth,
            INVENTORY_BORDER_HEIGHT,
            [Tag_InventoryPanel],
            rightPanel
        );

        const levelLabel = createGameText(
            k.vec2(MAIN_PANEL_PADDING, 36),
            level.name,
            48,
            "topleft",
            "left",
            [],
            topPanel);
        const currentModifierLabel = createGameText(
            k.vec2(leftPanel.panelWidth + MAIN_PANEL_PADDING, 36),
            "Current",
            36,
            "topleft",
            "left",
            [],
            topPanel);
        const currentModifierValue = createGameText(
            k.vec2(leftPanel.panelWidth + MAIN_PANEL_PADDING, 36 * 2),
            "0",
            36,
            "topleft",
            "left",
            [TAG_CURRENT_MODIFIER_TEXT],
            topPanel);
        
        console.log(currentModifierValue);
        const targetModifierLabel = createGameText(
            k.vec2(k.width() - rightPanel.panelWidth - MAIN_PANEL_PADDING, 36),
            "Target",
            36,
            "topright",
            "right",
            [],
            topPanel);
        const targetModifierValue = createGameText(
            k.vec2(k.width() - rightPanel.panelWidth - MAIN_PANEL_PADDING, 36 * 2), 
            level.targetModifier != null ? level.targetModifier.toString() : "0",
            36, 
            "topright", 
            "right", 
            [TAG_TARGET_MODIFIER_TEXT], 
            topPanel);

        wireVisualSize = calculateWireVisualSize(
            centerPanel.panelWidth - MAIN_PANEL_PADDING * 2,
            centerPanel.panelHeight - MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);

        //Create grid
        gridOffsetX = centerPanel.pos.x + ((centerPanel.panelWidth - MAIN_PANEL_PADDING * 2) - level.cols * wireVisualSize) / 2 + MAIN_PANEL_PADDING;
        gridOffsetY = centerPanel.pos.y + ((centerPanel.panelHeight - MAIN_PANEL_PADDING * 2) - level.rows * wireVisualSize) / 2 + MAIN_PANEL_PADDING;

        // Create default grid constraints
        for (let c = 0; c < level.cols; c++) {
            for (let r = 0; r < level.rows; r++) {
                gridConstraints.set(getPosKey(k.vec2(c, r)), {
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
                    `grid_dot_${getPosKey(k.vec2(c, r))}`,
                ])
            }
        }

        let startWire: GameObj<WireState>;
        let endWire: GameObj<WireState>;

        level.cells.forEach((cellData) => {
            let config = gridConstraints.get(getPosKey(k.vec2(cellData.x, cellData.y)));
            if (config) {
                config.canRotate = cellData.canRotate ?? true;
                config.canPlace = cellData.canPlace ?? true;
                config.rot = cellData.rot ?? 0;
                config.type = cellData.type ?? "";
                config.modifier = cellData.modifier ?? 0;
                config.placeholder = cellData.placeholder ?? false;
            }

            const cellPos = calculateCellPos(k.vec2(cellData.x, cellData.y), wireVisualSize, gridOffsetX, gridOffsetY);

            if (config.placeholder) {
                createPlaceholderWire(
                    cellPos,
                    wireVisualSize,
                    fromCellToWireData(cellData),
                    [Tag_Placeholder, getPosKey(k.vec2(cellData.x, cellData.y))],
                );
            } else {
                const wire = createWire(
                    cellPos,
                    wireVisualSize,
                    fromCellToWireData(cellData),
                    needWireBg(cellData),
                    [
                        getPosKey(k.vec2(cellData.x, cellData.y)),
                        Tag_Wire_InGrid
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
            const modifier = checkWireLineValid();
            currentModifierValue.text = Math.max(0, modifier).toString();
            console.log(modifier, modifier == (level.targetModifier ?? 0) ? "Win" : "Unfinished");
        }
    };
}
