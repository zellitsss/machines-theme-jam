import {GameObj, Vec2} from 'kaplay';
import {panel} from "../components/panel";
import {COLOR_Active, COLOR_Background, k, LAYER_BACKGROUND, LAYER_UI, NAME_Game} from "../constants";
import {audio} from "../core/audio";
import {playEnterTransition, transitionTo} from "../core/transition";

function createButton(parent: GameObj, text: string, pos: Vec2, layer: string, shouldActive: () => boolean, onClick: () => void) {
    const btn = parent.add([
        k.rect(240, 60, {fill: false}),
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
        console.log("Clicked", label.text);
        onClick();
        audio.playSfx("sfx-button-click");
    });

    return btn;
}

let isShowingLevelSelection = false;
export default function createMainMenuScene() {
    const LAYOUT_PANEL_WIDTH = 480;
    return () => {
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
            panel(LAYOUT_PANEL_WIDTH, k.height())
        ]);

        const startButton = createButton(
            layoutPanel,
            "Start",
            k.vec2(),
            LAYER_UI,
            () => !isShowingLevelSelection,
            () => {
                if (!isShowingLevelSelection) {
                    toggleLevelSelection();
                }
            });

        const creditButton = createButton(
            layoutPanel,
            "Credit",
            k.vec2(0, 72),
            LAYER_UI,
            () => !isShowingLevelSelection,
            () => {
                if (!isShowingLevelSelection) {
                    console.log("Credit");
                }
            });

        const levelSelectionMenu = k.add([
            k.rect(720, 360, {radius: 4}),
            k.color(255, 255, 255),
            k.outline(4),
            k.anchor("center"),
            k.pos(k.center()),
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
            k.text("Level selection", {size: 28}),
            k.color("black"),
            k.anchor("top"),
            k.pos(0, -levelSelectionMenu.height / 2),
            k.layer(LAYER_UI),
        ]);

        const buttons: [string, () => void][] = [
            ["Start", () => transitionTo(NAME_Game)],
            ["Close", toggleLevelSelection],
        ];
        buttons.map(([text, onClick], index) => {
            let _ = createButton(
                levelSelectionMenu,
                text.toString(),
                k.vec2(0, (index + 1) * 72 - levelSelectionMenu.height / 2),
                LAYER_UI,
                () => isShowingLevelSelection,
                onClick);
        });
    }
}