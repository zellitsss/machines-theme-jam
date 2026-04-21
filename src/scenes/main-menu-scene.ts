import {GameObj, KAPLAYCtx, Vec2} from 'kaplay';
import {panel} from "../components/panel";
import {COLOR_Active, k, LAYER_BACKGROUND, LAYER_GAME, LAYER_UI, NAME_Game} from "../constants";
import {audio} from "../core/audio";
import {playEnterTransition, transitionTo} from "../core/transition";

function createButton(parent: GameObj, text: string, pos: Vec2, onClick: () => void) {
    const btn = parent.add([
        k.rect(240, 60, {fill: false}),
        k.pos(pos),
        k.outline(4, k.Color.fromHex(COLOR_Active)),
        k.area(),
        k.anchor("center"),
        k.scale(1),
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
        btn.scale = k.vec2(1.05);
        k.setCursor("pointer");
    });

    btn.onHoverEnd(() => {
        btn.scale = k.vec2(1);
        k.setCursor("default");
    });

    // --- CLICK LOGIC ---
    btn.onClick(() => {
        onClick();
        audio.playSfx("sfx-button-click");
    });

    return btn;
}

export default function createMainMenuScene() {
    const LAYOUT_PANEL_WIDTH = 480;
    return () => {
        playEnterTransition();

        audio.playBgm("bgm-menu");

        k.add([
            k.pos(),
            k.anchor("topleft"),
            k.layer(LAYER_BACKGROUND),
            k.sprite("background", {
                width: k.width(),
                height: k.height(),
            })
        ]);
        
        const layoutPanel = k.add([
            k.pos(k.center()),
            k.anchor("center"),
            panel(LAYOUT_PANEL_WIDTH, k.height())
        ]);

        const startButton = createButton(layoutPanel, "Start", k.vec2(), () => {
            if (levelSelectionMenu.hidden) {
                toggleLevelSelection();
            }
        });

        const creditButton = createButton(layoutPanel, "Credit", k.vec2(0, 72), () => {
            if (levelSelectionMenu.hidden) {
                console.log("Credit");
            }
        });

        const levelSelectionMenu = k.add([
            k.rect(720, 360, {radius: 4}),
            k.color(255, 255, 255),
            k.outline(4),
            k.anchor("center"),
            k.pos(k.center()),
            k.layer(LAYER_UI),
        ]);
        levelSelectionMenu.hidden = true;
        levelSelectionMenu.paused = true;
        
        function toggleLevelSelection() {
            levelSelectionMenu.hidden = !levelSelectionMenu.hidden;
        }

        const levelSelectionTitle = levelSelectionMenu.add([
            k.text("Level selection", {size: 28}),
            k.color("black"),
            k.anchor("top"),
            k.pos(0, -levelSelectionMenu.height / 2),
        ]);

        const buttons: [string, () => void][] = [
            ["Start", () => transitionTo(NAME_Game)],
            ["Close", toggleLevelSelection],
        ];
        buttons.map(([text, onClick], index) => {
            createButton(levelSelectionMenu, text.toString(), k.vec2(0, (index + 1) * 72 - levelSelectionMenu.height / 2), onClick);
        });
    }
}