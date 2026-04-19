import {GameObj, PosComp, RotateComp} from "kaplay";
import {calculateWireVisualSize, fromCellToWireData, fromItemToWireData, getPosKey} from "../utils";
import * as Constants from "../constants";
import {LAYER_BACKGROUND, LAYER_UI, setupLayers} from "../ui/game-scene-ui";
import {panel} from "../components/panel";
import {LevelData} from "../types";
import {createGhostWire, createWire} from "../entities/wire";
import {
    activeTweenByCell,
    animateWireRotation,
    handleRotatingWire, isInPanels,
    isWiresConnected,
    needWireBg
} from "../core/gameplay";
import {WireState} from "../components/wireState";
import {calculateCellPos, canPlaceAt, gridConstraints, isValidCell, worldToGrid} from "../core/grid";
import {inventory} from "../ui/inventory";
import {CELL_SIZE, k, TOP_PANEL_HEIGHT} from "../constants";

async function loadAssets() {
    await Promise.all([
        k.loadSprite("atlas", "sprites/atlas.png", {
            sliceX: 6,
            sliceY: 3,
            filter: "linear"
        }),
        k.loadSprite("background", "sprites/Background.png"),
    ]);
}

function resetContainers() {
    gridConstraints.clear();
    activeTweenByCell.clear();
    inventory.clear();
}

export default function createGameScene() {
    let gridOffsetX = 0;
    let gridOffsetY = 0;
    let wireVisualSize = CELL_SIZE;
    return async () => {
        resetContainers();
        setupLayers();

        await loadAssets();
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-01.json");
        const level = levelData as LevelData;

        /********** EVENTS **********/
        k.on("rotationStepUpdated", "wire", (wire: GameObj<WireState | RotateComp>) => {
            animateWireRotation(wire, () => {
                checkWinCondition()
            });
        });

        k.on(Constants.EVENT_WireClicked, "wire", (wire: GameObj<WireState>) => {
            handleRotatingWire(wire);
        });

        let ghostWire: GameObj | null = null;
        k.on(Constants.EVENT_WireStartDragging, "wire", (wire: GameObj<WireState>) => {
            wire.hidden = true;
            ghostWire = createGhostWire(wire);
        });

        k.on(Constants.EVENT_WireEndDragging, "wire", (wire: GameObj<WireState | PosComp>) => {
            ghostWire?.destroy();

            const dropPos = k.mousePos();
            const gridPos = worldToGrid(dropPos.x, dropPos.y, wireVisualSize, gridOffsetX, gridOffsetY);
            if (canPlaceAt(...gridPos)) {
                // Place in the empty cell
                // TODO: be aware of inventory
                wire.hidden = false;
                wire.pos = k.vec2(...calculateCellPos(gridPos[0], gridPos[1], wireVisualSize, gridOffsetX, gridOffsetY));
                wire.untag(getPosKey(wire.wireData.x, wire.wireData.y));
                wire.wireData.x = gridPos[0];
                wire.wireData.y = gridPos[1];
                wire.tag(getPosKey(wire.wireData.x, wire.wireData.y));
                // TODO: Handle the placeholder dot
            } else {
                if (isValidCell(wire.wireData.x, wire.wireData.y)) {
                    if (isInPanels(k.get("inventory_panel"), dropPos)) {
                        wire.destroy();
                        // move to inventory
                        console.log("move to inventory");
                    } else {
                        // return to the original cell
                        wire.hidden = false;
                        wire.pos = k.vec2(...calculateCellPos(wire.wireData.x, wire.wireData.y, wireVisualSize, gridOffsetX, gridOffsetY));
                    }
                } else {
                    // Dragged from inventory
                }
            }
            checkWinCondition();
        });

        k.on(Constants.EVENT_WireDraggingUpdate, "wire", (wire: GameObj<WireState | PosComp>) => {
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
                width: 1280,
                height: 720
            })
        ])

        // Layout
        const leftPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(),
            k.anchor("topleft"),
            panel(k.width() * Constants.LEFT_PANEL_RATIO, k.height()),
            "inventory_panel"
        ]);
        const topPanel = k.add([
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
            panel(k.width() * Constants.RIGHT_PANEL_RATIO, k.height()),
            "inventory_panel"
        ]);

        wireVisualSize = calculateWireVisualSize(
            centerPanel.width - Constants.MAIN_PANEL_PADDING * 2,
            centerPanel.height - Constants.MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);

        //Create grid
        gridOffsetX = centerPanel.pos.x + ((centerPanel.width - Constants.MAIN_PANEL_PADDING * 2) - level.cols * wireVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;
        gridOffsetY = centerPanel.pos.y + ((centerPanel.height - Constants.MAIN_PANEL_PADDING * 2) - level.rows * wireVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;

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
                    "placeholder_" + getPosKey(c, r),
                ])
            }
        }

        let startWire: GameObj<WireState>;
        let endWire: GameObj<WireState>;
        let wires: GameObj<WireState>[] = [];

        level.cells.forEach((cellData) => {
            let config = gridConstraints.get(getPosKey(cellData.x, cellData.y));
            if (config) {
                config.canRotate = cellData.canRotate ?? true;
                config.canPlace = cellData.canPlace ?? true;
                config.rot = cellData.rot ?? 0;
                config.type = cellData.type ?? "";
                config.modifier = cellData.modifier ?? 0;
            }

            const cellPos = calculateCellPos(cellData.x, cellData.y, wireVisualSize, gridOffsetX, gridOffsetY);

            const wire = createWire(
                cellPos[0],
                cellPos[1],
                wireVisualSize,
                fromCellToWireData(cellData),
                needWireBg(cellData),
                [getPosKey(cellData.x, cellData.y)]
            );

            // Remove placeholder
            k.get(`placeholder_${getPosKey(cellData.x, cellData.y)}`).forEach((obj) => {
                obj.destroy();
            })

            wires.push(wire as GameObj<WireState>);
            if (cellData.type === "wire-gate-start") {
                startWire = wire as GameObj<WireState>;
            } else if (cellData.type === "wire-gate-end") {
                endWire = wire as GameObj<WireState>;
            }
        });

        Array.from(inventory.values()).forEach((item, index) => {
            const wire = createWire(
                leftPanel.pos.x + leftPanel.width / 2,
                leftPanel.pos.y + TOP_PANEL_HEIGHT + index * wireVisualSize + index * 8,
                wireVisualSize,
                fromItemToWireData(item),
                true,
                [],
                leftPanel
            );
        });

        function checkWinCondition() {
            k.debug.log(isWiresConnected(wires, startWire, endWire) ? "Win" : "Lose");
        }
    };
}
