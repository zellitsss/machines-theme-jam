import {GameObj, Vec2} from 'kaplay';
import {panel} from "../components/panel";
import {
    CENTER_PANEL_RATIO,
    COLOR_Active,
    COLOR_Background, COLOR_Neutral,
    k,
    LAYER_BACKGROUND,
    LAYER_UI,
    LEVEL_SELECTION_CLOSE_SIZE, LEVEL_SELECTION_ITEM_COLS, LEVEL_SELECTION_PADDING,
    NAME_Game
} from "../constants";
import {audio} from "../core/audio";
import {playEnterTransition, transitionTo} from "../core/transition";
import {LevelList} from "../types.ts";

function createButton(parent: GameObj, text: string, pos: Vec2, size: Vec2, layer: string, shouldActive: () => boolean, onClick: () => void) {
    const btn = parent.add([
        k.rect(size.x, size.y, {fill: false}),
        k.pos(pos),
        k.outline(4, k.Color.fromHex(COLOR_Active)),
        k.area(),
        k.anchor("center"),
        k.scale(1),
        k.layer(layer),
        "button"
    ]);

    // Add the label
    const label = btn.add([
        k.text(text, {size: 24, font: "Audiowide"}),
        k.anchor("center"),
        k.color(k.Color.fromHex(COLOR_Active)),
    ]);

    // --- HOVER LOGIC ---
    btn.onHoverUpdate(() => {
        if (!shouldActive()) return;
        btn.scale = k.vec2(1.05);
        k.setCursor("pointer");
    });

    btn.onHoverEnd(() => {
        btn.scale = k.vec2(1);
        k.setCursor("default");
    });

    // --- CLICK LOGIC ---
    btn.onClick(() => {
        if (!shouldActive()) return;
        if (k.time() - lastClickedTime < clickDelay && lastClickedTime > 0) return;
        lastClickedTime = k.time();
        onClick();
        audio.playSfx("sfx-button-click");
    });

    return btn;
}

let isShowingLevelSelection = false;
// The `topMostOnlyActivated` is not working
const clickDelay = .2;
let lastClickedTime = 0;
export default function createMainMenuScene() {
    return async () => {
        const levelList = await k.loadJSON("levelList", "data/levelList.json") as LevelList;
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
            () => !isShowingLevelSelection,
            () => {
                if (!isShowingLevelSelection) {
                    toggleLevelSelection();
                }
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
        const levelSelectionMenu = k.add([
            k.rect(popupWidth, popupHeight, {radius: 4}),
            k.color(255, 255, 255),
            k.outline(4),
            k.anchor("top"),
            k.pos(k.width() / 2, (k.height() - popupHeight) / 2),
            k.color(COLOR_Background),
            k.layer(LAYER_UI)
        ]);
        levelSelectionMenu.hidden = true;
        levelSelectionMenu.paused = true;

        function toggleLevelSelection() {
            isShowingLevelSelection = !isShowingLevelSelection;
            levelSelectionMenu.hidden = !isShowingLevelSelection;
            levelSelectionMenu.paused = !isShowingLevelSelection;
        }

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
            () => isShowingLevelSelection,
            () => {
                toggleLevelSelection();
            }
        );

        levelList.levels.map((level, index) => {
            const row = Math.floor(index / LEVEL_SELECTION_ITEM_COLS);
            let _ = createButton(
                levelSelectionMenu,
                (index + 1).toString(),
                k.vec2(
                    (index + 0.5) * (LEVEL_SELECTION_CLOSE_SIZE) - popupWidth / 2 + LEVEL_SELECTION_PADDING * (index + 1) - row * (LEVEL_SELECTION_CLOSE_SIZE + LEVEL_SELECTION_PADDING) * LEVEL_SELECTION_ITEM_COLS,
                    72 + LEVEL_SELECTION_CLOSE_SIZE / 2 + LEVEL_SELECTION_PADDING + row * (LEVEL_SELECTION_CLOSE_SIZE + LEVEL_SELECTION_PADDING)),
                k.vec2(LEVEL_SELECTION_CLOSE_SIZE, LEVEL_SELECTION_CLOSE_SIZE),
                LAYER_UI,
                () => isShowingLevelSelection,
                () => console.log(level));
        });
    }
}