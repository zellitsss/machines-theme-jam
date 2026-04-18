import {GameObj, KAPLAYCtx, MouseButton, RotateComp, TweenController} from "kaplay";
import {wireDictionary} from "../wire-dictionary";
import {calculateCellVisualSize, fromCellToWireData, fromItemToWireData, getPosKey} from "../utils";
import * as Constants from "../constants";
import {InventoryOld, LAYER_UI, setupLayers} from "../ui/game-scene-ui";
import {panel} from "../components/panel";
import {CellConstraint, LevelData} from "../types";
import {createWire} from "../entities/wire";
import {activeTweenByCell, animateWireRotation, handleRotatingWire, isWiresConnected} from "../core/gameplay";
import {WireState} from "../components/wireState";
import {gridConstraints} from "../core/grid";
import {inventory} from "../ui/inventory";
import {TOP_PANEL_HEIGHT} from "../constants";

async function loadAssets(k: KAPLAYCtx) {
    await Promise.all([
        k.loadSprite("wire-i", "sprites/wire-i.png"),
        k.loadSprite("wire-l", "sprites/wire-l.png"),
        k.loadSprite("wire-gate", "sprites/wire-gate.png"),
        k.loadSprite("wire-blocked", "sprites/wire-blocked.png"),
        k.loadSprite("wire-i-1w", "sprites/wire-i-1w.png"),
        k.loadSprite("wire-l-1w1", "sprites/wire-l-1w1.png"),
        k.loadSprite("wire-l-1w2", "sprites/wire-l-1w2.png"),
        k.loadSprite("wire-modifier", "sprites/wire-modifier.png"),
        k.loadSprite("atlas", "sprites/atlas.png", {
            sliceX: 6,
            sliceY: 3,
            filter: "linear"
        }),
    ]);
}

function resetContainers()
{
    gridConstraints.clear();
    activeTweenByCell.clear();
    inventory.clear();
}

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        resetContainers();
        setupLayers(k);

        await loadAssets(k);
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-01.json");
        const level = levelData as LevelData;

        /********** EVENTS **********/
        k.on("rotationStepUpdated", "wire", (wire: GameObj<WireState | RotateComp>) => {
            animateWireRotation(k, wire, () => {
                checkWinCondition()
            });
        });

        k.on("wireClicked", "wire", (wire: GameObj<WireState>) => {
            handleRotatingWire(wire);
        });

        k.on("wireStartDragging", "wire", (wire: GameObj<WireState>) => {
            // clear cell -> create ghost wire
        });

        k.on("wireEndDragging", "wire", (wire: GameObj<WireState>) => {
            // check drop area
        });

        k.on("wireDraggingUpdate", "wire", (wire: GameObj<WireState>) => {
            // move ghost wire along with mouse cursor 
        });
        /********** EVENTS **********/
        
        level.inventory.forEach((itemData) => {
           inventory.set(itemData.type, itemData); 
        });
            
        // Background
        k.add([
            k.pos(),
            k.anchor("topleft"),
            k.rect(k.width(), k.height(), {fill: true}),
            k.color(239, 235, 228),
        ])

        // Layout
        const leftPanel = k.add([
            k.layer(LAYER_UI),
            k.pos(),
            k.anchor("topleft"),
            panel(k.width() * Constants.LEFT_PANEL_RATIO, k.height())
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
            panel(k.width() * Constants.RIGHT_PANEL_RATIO, k.height())
        ]);
        
        const cellVisualSize = calculateCellVisualSize(
            centerPanel.width - Constants.MAIN_PANEL_PADDING * 2,
            centerPanel.height - Constants.MAIN_PANEL_PADDING * 2,
            level.cols,
            level.rows);
        
        //Create grid
        const gridOffsetX = centerPanel.pos.x + ((centerPanel.width - Constants.MAIN_PANEL_PADDING * 2) - level.cols * cellVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;
        const girdOffsetY = centerPanel.pos.y + ((centerPanel.height - Constants.MAIN_PANEL_PADDING * 2) - level.rows * cellVisualSize) / 2 + Constants.MAIN_PANEL_PADDING;
        
        // Create default grid constraints
        for (let c = 0; c < level.cols; c++) {
            for (let r = 0; r < level.rows; r++) {
                gridConstraints.set(getPosKey(c, r), {
                    canRotate: true,
                    canPlace: true,
                });
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
            const wire = k.add(createWire(
                k,
                gridOffsetX + (cellData.x + 0.5) * cellVisualSize,
                girdOffsetY + (cellData.y + 0.5) * cellVisualSize,
                cellVisualSize,
                fromCellToWireData(cellData)
            ));
            
            wires.push(wire as GameObj<WireState>);
            if (cellData.type === "wire-gate-start") {
                startWire = wire as GameObj<WireState>;
            } else if (cellData.type === "wire-gate-end") {
                endWire = wire as GameObj<WireState>;
            }
        });       
        
        Array.from(inventory.values()).forEach((item, index) => {
            const wire = leftPanel.add(createWire(
                k,
                leftPanel.pos.x + leftPanel.width/2,
                leftPanel.pos.y + TOP_PANEL_HEIGHT + index * cellVisualSize,
                cellVisualSize,
                fromItemToWireData(item)
            ))
        });
        
        function checkWinCondition() {
            k.debug.log(isWiresConnected(wires, startWire, endWire) ? "Win" : "Lose");
        }
    };
}
