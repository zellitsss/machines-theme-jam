import {GameObj, KAPLAYCtx, MouseButton, Vec2} from 'kaplay';
import {panel} from "../components/panel";
import {NAME_Game} from "../constants";

function createButton(k: KAPLAYCtx, parent: GameObj, text: string, pos: Vec2, onClick: () => void) {
    const btn = parent.add([
        k.rect(240, 60, {radius: 4}),
        k.pos(pos),
        k.color(40, 40, 45),
        k.outline(3, k.rgb(80, 80, 90)),
        k.area(),
        k.anchor("center"),
        k.scale(1),
        "button"
    ]);

    // Add the label
    const label = btn.add([
        k.text(text, {size: 24, font: "monospace"}),
        k.anchor("center"),
        k.color(200, 200, 210)
    ]);

    // --- HOVER LOGIC ---
    btn.onHoverUpdate(() => {
        btn.color = k.rgb(60, 60, 70);
        btn.scale = k.vec2(1.05);
        k.setCursor("pointer");
    });

    btn.onHoverEnd(() => {
        btn.color = k.rgb(40, 40, 45);
        btn.scale = k.vec2(1);
        k.setCursor("default");
    });

    // --- CLICK LOGIC ---
    btn.onClick(() => {
        onClick();
    });

    return btn;
}

export default function createMainMenuScene(k: KAPLAYCtx) {
    const LAYOUT_PANEL_WIDTH = 480;
    return () => {
        const layoutPanel = k.add([
            k.pos((k.width() - LAYOUT_PANEL_WIDTH) / 2, 0),
            k.anchor("top"),
            panel(LAYOUT_PANEL_WIDTH, k.height())
        ]);

        const startButton = createButton(k, layoutPanel, "Start", layoutPanel.pos.add(0, 256), () => {
            if (levelSelectionMenu.hidden) {
                toggleLevelSelection();
            }
        });

        const creditButton = createButton(k, layoutPanel, "Credit", startButton.pos.add(0, 72), () => {
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
            k.layer("ui"),
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
            ["Start", () => k.go(NAME_Game)],
            ["Close", toggleLevelSelection],
        ];
        buttons.map(([text, onClick], index) => {
            createButton(k, levelSelectionMenu, text.toString(), k.vec2(0, (index + 1) * 72 - levelSelectionMenu.height / 2), onClick);
        });
    }
}