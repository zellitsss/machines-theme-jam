import {GameObj, PosComp, RotateComp} from "kaplay";
import {
    calculateWireVisualSize,
    canDrag,
    fromCellToWireData,
    getInventoryItemKey,
    getPosKey
} from "../utils";
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
    CELL_SIZE, CENTER_PANEL_RATIO, COLOR_Active,
    COLOR_Background, COLOR_Neutral, EVENT_WireClicked, EVENT_WireDraggingUpdate,
    EVENT_WireEndDragging,
    EVENT_WireStartDragging, FOOTER_HEIGHT,
    gameState, INVENTORY_BORDER_HEIGHT, INVENTORY_CELL_SIZE, INVENTORY_TITLE_TEXT,
    k, LAYER_BACKGROUND, LAYER_GAME,
    LAYER_UI, LEFT_PANEL_RATIO, MAIN_PANEL_PADDING, NAME_Game,
    NAME_MainMenu, RIGHT_PANEL_RATIO, TAG_CURRENT_MODIFIER_TEXT, Tag_InventoryItem,
    Tag_InventoryPanel, Tag_Placeholder, TAG_TARGET_MODIFIER_TEXT, Tag_Wire, Tag_Wire_InGrid,
    TOP_PANEL_HEIGHT
} from "../constants";
import {createInventorySlot, inventory, inventorySlots, updateItem} from "../core/inventory";
import {createBorder} from "../entities/border";
import {createGameText} from "../entities/gameText";
import {playEnterTransition, transitionTo} from "../core/transition";
import {createButton} from "../entities/button.ts";
import {unlockLevel} from "../core/progress";

async function loadAssets() {
    await Promise.all([
        k.loadSprite("atlas", "sprites/atlas.png", {
            sliceX: 6,
            sliceY: 3,
            filter: "linear"
        })
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
        let _ = playEnterTransition();
        audio.playBgm("bgm-gameplay");
        gameState.won = false;

        resetContainers();

        await loadAssets();

        // Load Level data
        const levelName = gameState.levels.at(gameState.currentLevel) ?? "level-01";
        const levelData = await k.loadJSON("levelData", `data/${levelName}.json`) as LevelData;

        levelData.inventory.forEach((itemData) => {
            inventory.set(getInventoryItemKey(itemData.type, itemData.modifier), itemData);
        });

        const electricBgRgb = k.Color.fromHex(COLOR_Background);
        const electricLineRgb = k.Color.fromHex(COLOR_Neutral);

        // Background
        k.add([
            k.pos(),
            k.anchor("topleft"),
            k.layer(LAYER_BACKGROUND),
            k.uvquad(k.width(), k.height()),
            k.shader("electricBg", () => ({
                u_time: k.time(),
                u_background_rgb: electricBgRgb,
                u_line_rgb: electricLineRgb,
            })),
        ])

        // Layout
        const topPanel = k.add([
            k.anchor("top"),
            k.pos(),
            panel(k.width(), TOP_PANEL_HEIGHT)
        ]);
        const leftPanel = k.add([
            k.layer(LAYER_GAME),
            k.pos(0, topPanel.panelHeight),
            k.anchor("topleft"),
            panel(k.width() * LEFT_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT),
            Tag_InventoryPanel
        ]);
        const borderWidth = leftPanel.panelWidth * 0.75;
        const leftBorder = createBorder(
            INVENTORY_TITLE_TEXT,
            k.vec2(leftPanel.panelWidth / 2, MAIN_PANEL_PADDING),
            borderWidth,
            INVENTORY_BORDER_HEIGHT,
            [],
            leftPanel
        );
        const centerPanel = k.add([
            k.pos(leftPanel.pos.x + leftPanel.panelWidth, TOP_PANEL_HEIGHT),
            k.rect(k.width() * CENTER_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT - FOOTER_HEIGHT, {radius: 0}),
            k.color(COLOR_Background),
            k.outline(4, k.Color.fromHex(COLOR_Active)),
            k.anchor("topleft"),
            panel(k.width() * CENTER_PANEL_RATIO, k.height() - TOP_PANEL_HEIGHT - FOOTER_HEIGHT)
        ]);
        const rightPanel = k.add([
            k.layer(LAYER_GAME),
            k.pos(centerPanel.pos.x + centerPanel.panelWidth, topPanel.panelHeight),
            k.anchor("topleft"),
            panel(k.width() * RIGHT_PANEL_RATIO, k.height()),
            Tag_InventoryPanel
        ]);
        const rightBorder = createBorder(
            INVENTORY_TITLE_TEXT,
            k.vec2(rightPanel.panelWidth / 2, MAIN_PANEL_PADDING),
            borderWidth,
            INVENTORY_BORDER_HEIGHT,
            [],
            rightPanel
        );

        const levelLabel = createGameText(
            k.vec2(MAIN_PANEL_PADDING, 36),
            levelData.name,
            32,
            "topleft",
            "left",
            [],
            topPanel);
        const BackButtonWidth = 100;
        const BackButtonHeight = 36;
        createButton(
            topPanel,
            "Back",
            k.vec2(k.width() - MAIN_PANEL_PADDING - BackButtonWidth / 2, MAIN_PANEL_PADDING + BackButtonHeight / 2),
            k.vec2(BackButtonWidth, BackButtonHeight),
            LAYER_UI,
            () => true,
            () => {
                transitionTo(NAME_MainMenu);
            }
        )
        
        createButton(
            topPanel,
            "Reset",
            k.vec2(k.width() - MAIN_PANEL_PADDING - BackButtonWidth * 1.5 - 16, MAIN_PANEL_PADDING + BackButtonHeight / 2),
            k.vec2(BackButtonWidth, BackButtonHeight),
            LAYER_UI,
            () => true,
            () => {
                k.go(NAME_Game);
            }
        )
        
        const currentModifierLabel = createGameText(
            k.vec2(leftPanel.panelWidth + MAIN_PANEL_PADDING, 36),
            "Current",
            24,
            "topleft",
            "left",
            [],
            topPanel);
        const currentModifierValue = createGameText(
            k.vec2(leftPanel.panelWidth + MAIN_PANEL_PADDING, 36 * 2),
            "0",
            24,
            "topleft",
            "left",
            [TAG_CURRENT_MODIFIER_TEXT],
            topPanel);

        const targetModifierLabel = createGameText(
            k.vec2(k.width() - rightPanel.panelWidth - MAIN_PANEL_PADDING, 36),
            "Target",
            24,
            "topright",
            "right",
            [],
            topPanel);
        const targetModifierValue = createGameText(
            k.vec2(k.width() - rightPanel.panelWidth - MAIN_PANEL_PADDING, 36 * 2),
            levelData.targetModifier != null ? levelData.targetModifier.toString() : "0",
            24,
            "topright",
            "right",
            [TAG_TARGET_MODIFIER_TEXT],
            topPanel);
        
        wireVisualSize = calculateWireVisualSize(
            centerPanel.panelWidth - MAIN_PANEL_PADDING * 2,
            centerPanel.panelHeight - MAIN_PANEL_PADDING * 2,
            levelData.cols,
            levelData.rows);

        //Create grid
        gridOffsetX = centerPanel.pos.x + ((centerPanel.panelWidth - MAIN_PANEL_PADDING * 2) - levelData.cols * wireVisualSize) / 2 + MAIN_PANEL_PADDING;
        gridOffsetY = centerPanel.pos.y + ((centerPanel.panelHeight - MAIN_PANEL_PADDING * 2) - levelData.rows * wireVisualSize) / 2 + MAIN_PANEL_PADDING;

        // Create default grid constraints
        for (let c = 0; c < levelData.cols; c++) {
            for (let r = 0; r < levelData.rows; r++) {
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
                        frame: 16
                    }),
                    k.color(199, 199, 199),
                    `grid_dot_${getPosKey(k.vec2(c, r))}`,
                ])
            }
        }

        let startWire: GameObj<WireState>;
        let endWire: GameObj<WireState>;

        levelData.cells.forEach((cellData) => {
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
        checkWireLineValid();

        // Inventory
        Array.from(inventory.values()).forEach((item, index) => {
            const wire = createInventorySlot(
                INVENTORY_CELL_SIZE,
                item,
                [leftPanel, rightPanel]
            );
        });

        async function checkWinCondition() {
            const {result, count} = checkWireLineValid();
            currentModifierValue.text = Math.max(0, count).toString();
            if (count == (levelData.targetModifier ?? 0) && result) {
                gameState.won = true;
                unlockLevel(gameState.currentLevel + 1);
                audio.playSfx("sfx-win");
                await new Promise((resolve) => setTimeout(resolve, 1000));
                showWinPopup();
            }
        }

        await playEnterTransition();

        /********** EVENTS **********/
        k.on("rotationStepUpdated", Tag_Wire, (wire: GameObj<WireState | RotateComp>) => {
            animateWireRotation(wire, () => {
                checkWinCondition();
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
            if (canPlaceAt(gridPos, wire.wireData.type, wire.wireData.modifier)) {
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
                    updateItem(wire.wireData.type, wire.wireData.modifier, -1);
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
                        updateItem(wire.wireData.type, wire.wireData.modifier, 1);
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

        /********** Popup **********/
        // Quick fix the rapid click
        let nextLevelClicked = false;
        function showWinPopup() {
            const popup = k.add([
                k.rect(360, 360, {radius: 4}),
                k.outline(4, k.Color.fromHex(COLOR_Active)),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.color(COLOR_Background),
                k.layer(LAYER_UI),
            ]);
            popup.add([
                k.text("Level cleared!", {font: "ZenDots", size: 24}),
                k.pos(k.vec2(0, -150)),
                k.anchor("top"),
                k.color(COLOR_Active)
            ]);
            createButton(
                popup,
                "Next Level",
                k.vec2(0, 0),
                k.vec2(200, 40),
                LAYER_UI,
                () => !nextLevelClicked,
                () => {
                    nextLevelClicked = true;
                    gameState.currentLevel++;
                    transitionTo(NAME_Game)
                }
            );
            createButton(
                popup,
                "Back to Menu",
                k.vec2(0, 60),
                k.vec2(200, 40),
                LAYER_UI,
                () => true,
                () => {
                    transitionTo(NAME_MainMenu)
                }
            )
        }

        /********** Popup **********/
    };
}
