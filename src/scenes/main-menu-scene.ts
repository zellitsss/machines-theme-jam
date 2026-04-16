import {KAPLAYCtx, MouseButton, Vec2} from 'kaplay';
import {panel} from "../components/panel";
import {NAME_Game} from "../constants";

function createButton(k: KAPLAYCtx, text: string, pos: Vec2, onClick: () => void) {
    const btn = k.add([
        k.rect(240, 60, { radius: 4 }),
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
        k.text(text, { size: 24, font: "monospace" }),
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
            k.anchor("topleft"),
            panel(LAYOUT_PANEL_WIDTH, k.height())
        ]);
        
        const startButton = createButton(k, "Start", k.vec2(layoutPanel.pos.x + layoutPanel.width / 2, layoutPanel.pos.y + layoutPanel.height / 2), () => {
            k.go(NAME_Game);
        });
      
        const creditButton = createButton(k, "Credit", k.vec2(layoutPanel.pos.x + layoutPanel.width / 2, layoutPanel.pos.y + layoutPanel.height / 2 + 80), () => {
            console.log("Credit");
        });
        
    }
}