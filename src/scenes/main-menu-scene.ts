import {panel} from "../components/panel";
import {
    CENTER_PANEL_RATIO,
    COLOR_Active,
    COLOR_Background, COLOR_Inactive, COLOR_Negative, COLOR_Positive, gameState, k,
    LAYER_BACKGROUND,
    LAYER_UI,
    LEVEL_SELECTION_CLOSE_SIZE, LEVEL_SELECTION_ITEM_COLS, LEVEL_SELECTION_PADDING,
    NAME_Game
} from "../constants";
import {audio} from "../core/audio";
import {playEnterTransition, transitionTo} from "../core/transition";
import {LevelList} from "../types.ts";
import {createButton} from "../entities/button.ts";
import {GameObj} from "kaplay";

let isShowingLevelSelection = false;

export default function createMainMenuScene() {
    return async () => {
        const levelList = await k.loadJSON("levelList", "data/levelList.json") as LevelList;
        gameState.levels = levelList.levels;
        let _ = playEnterTransition();

        audio.playBgm("bgm-menu");

        k.add([
            k.pos(),
            k.anchor("topleft"),
            k.layer(LAYER_BACKGROUND),
            k.sprite("background", {
                width: k.width(),
                height: k.height(),
            }),
            k.layer(LAYER_BACKGROUND)
        ]);

        const titleOffset = 56;
        const titlePos = k.vec2(k.width() / 2 + titleOffset, 240);
        const title = k.add([
            k.pos(titlePos),
            k.anchor("center"),
            k.scale()
        ]);
        const amperText = title.add([
            k.text("AMPER", {font: "Audiowide", size: 72, align: "right"}),
            k.color(COLOR_Inactive),
            k.anchor("right"),
            k.opacity(1)
        ]);
        const sumText = title.add([
            k.text("SUM", {font: "Audiowide", size: 72, align: "left"}),
            k.color(COLOR_Inactive),
            k.anchor("left"),
            k.opacity(1)
        ]);
        
        const colorPositive = k.Color.fromHex(COLOR_Positive);
        const colorNegative = k.Color.fromHex(COLOR_Negative);
        const colorInactive = k.Color.fromHex(COLOR_Inactive);
        const colorActive = k.Color.fromHex(COLOR_Active);

        const runCycle = () => {
            // 1. NEUTRAL STATE (Wait 1.5s)
            k.wait(1.5, () => {

                // 2. BOOT-UP FLICKER (Rapid flash for 0.5s)
                const flash = k.loop(0.05, () => {
                    const isRed = Math.random() > 0.5;
                    amperText.color = isRed ? colorNegative : colorInactive;
                    sumText.color = isRed ? colorInactive : colorPositive;
                    title.pos = titlePos.add(k.rand(-3, 3), k.rand(-3, 3));
                });

                k.wait(0.5, () => {
                    flash.cancel();
                    amperText.color = colorActive;
                    sumText.color = colorActive;
                    title.pos = titlePos;
                    title.scale = k.vec2(1.1); // Small "pop" when power stabilizes
                    k.tween(title.scale, k.vec2(1), 0.2, (p) => title.scale = p);

                    k.wait(3, () => {
                        const shutDown = k.loop(0.05, () => {
                            amperText.opacity = Math.random() > 0.5 ? 1 : 0.2;
                            sumText.opacity = Math.random() > 0.5 ? 1 : 0.2;
                        });

                        k.wait(0.4, () => {
                            shutDown.cancel();
                            amperText.color = colorInactive;
                            sumText.color = colorInactive;
                            amperText.opacity = 1;
                            sumText.opacity = 1;

                            runCycle();
                        });
                    });
                });
            });
        };

        runCycle();

        const layoutPanel = k.add([
            k.pos(k.center()),
            k.anchor("center"),
            panel(CENTER_PANEL_RATIO * k.width(), k.height())
        ]);

        const startButton = createButton(
            layoutPanel,
            "Start",
            k.vec2(),
            k.vec2(240, 60),
            LAYER_UI,
            () => true,
            () => {
                toggleLevelSelection();
            });

        // const creditButton = createButton(
        //     layoutPanel,
        //     "Credit",
        //     k.vec2(0, 72),
        //     k.vec2(240, 60),
        //     LAYER_UI,
        //     () => !isShowingLevelSelection,
        //     () => {
        //         if (!isShowingLevelSelection) {
        //             console.log("Credit");
        //         }
        //     });

        const itemRows = Math.max(Math.ceil(levelList.levels.length / LEVEL_SELECTION_ITEM_COLS));
        const popupWidth = LEVEL_SELECTION_CLOSE_SIZE * LEVEL_SELECTION_ITEM_COLS + LEVEL_SELECTION_PADDING * (LEVEL_SELECTION_ITEM_COLS + 1);
        const popupHeight = 72 + LEVEL_SELECTION_CLOSE_SIZE * itemRows + LEVEL_SELECTION_PADDING * (itemRows + 1);
        let levelSelectionMenu: GameObj | null = null;

        function createLevelSelectionMenu() {
            if (levelSelectionMenu) {
                levelSelectionMenu.destroy();
            }
            levelSelectionMenu = k.add([
                k.rect(popupWidth, popupHeight, {radius: 4}),
                k.color(255, 255, 255),
                k.outline(4),
                k.anchor("top"),
                k.pos(k.width() / 2, (k.height() - popupHeight) / 2),
                k.color(COLOR_Background),
                k.layer(LAYER_UI)
            ]);
            const levelSelectionTitle = levelSelectionMenu.add([
                k.text("Select level", {font: "Audiowide", size: 28}),
                k.color(COLOR_Active),
                k.anchor("top"),
                k.pos(0, 16),
                k.layer(LAYER_UI),
            ]);

            createButton(
                levelSelectionMenu,
                "X",
                k.vec2(levelSelectionMenu.width / 2 - LEVEL_SELECTION_CLOSE_SIZE / 2 - LEVEL_SELECTION_PADDING, LEVEL_SELECTION_CLOSE_SIZE / 2 + LEVEL_SELECTION_PADDING),
                k.vec2(LEVEL_SELECTION_CLOSE_SIZE, LEVEL_SELECTION_CLOSE_SIZE),
                LAYER_UI,
                () => true,
                () => {
                    toggleLevelSelection();
                }
            );

            let levelSelected = false;
            levelList.levels.map((levelName, index) => {
                const row = Math.floor(index / LEVEL_SELECTION_ITEM_COLS);
                let _ = createButton(
                    levelSelectionMenu,
                    (index + 1).toString(),
                    k.vec2(
                        (index + 0.5) * (LEVEL_SELECTION_CLOSE_SIZE) - popupWidth / 2 + LEVEL_SELECTION_PADDING * (index + 1) - row * (LEVEL_SELECTION_CLOSE_SIZE + LEVEL_SELECTION_PADDING) * LEVEL_SELECTION_ITEM_COLS,
                        72 + LEVEL_SELECTION_CLOSE_SIZE / 2 + LEVEL_SELECTION_PADDING + row * (LEVEL_SELECTION_CLOSE_SIZE + LEVEL_SELECTION_PADDING)),
                    k.vec2(LEVEL_SELECTION_CLOSE_SIZE, LEVEL_SELECTION_CLOSE_SIZE),
                    LAYER_UI,
                    () => !levelSelected,
                    () => {
                        levelSelected = true;
                        gameState.currentLevel = index;
                        gameState.won = false;
                        transitionTo(NAME_Game);
                    });
            });
        }

        function toggleLevelSelection() {
            if (levelSelectionMenu != null) {
                levelSelectionMenu.destroy();
                levelSelectionMenu = null;
            } else {
                createLevelSelectionMenu();
            }
        }


    }
}