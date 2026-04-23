import {GameObj, Vec2} from "kaplay";
import {COLOR_Active, COLOR_Background, COLOR_Neutral, k} from "../constants.ts";
import {audio} from "../core/audio.ts";

// The `topMostOnlyActivated` is not working
let clickDelay = .2;
let lastClickedTime = 0;
export function createButton(parent: GameObj, text: string, pos: Vec2, size: Vec2, layer: string, shouldActive: () => boolean, onClick: () => void) {
    const activeColor = k.Color.fromHex(COLOR_Active);
    const neutralColor = k.Color.fromHex(COLOR_Neutral);
    const backgroundColor = k.Color.fromHex(COLOR_Background);

    const btn = parent.add([
        k.rect(size.x, size.y),
        k.pos(pos),
        k.outline(4, activeColor),
        k.area(),
        k.anchor("center"),
        k.scale(1),
        k.layer(layer),
        k.color(backgroundColor),
        "button"
    ]);

    // Add the label
    const label = btn.add([
        k.text(text, {size: 24, font: "Audiowide"}),
        k.anchor("center"),
        k.color(activeColor),
    ]);

    let wasEnabled = true;
    btn.onUpdate(() => {
        const enabled = shouldActive();
        if (enabled === wasEnabled) return;
        wasEnabled = enabled;
        const accent = enabled ? activeColor : neutralColor;
        // Replace outline to recolor it
        btn.use(k.outline(4, accent));
        btn.color = backgroundColor;
        label.color = accent;
        btn.scale = k.vec2(1);
    });

    // --- HOVER LOGIC ---
    btn.onHoverUpdate(() => {
        if (!shouldActive()) return;
        btn.scale = k.vec2(1.05);
        btn.color = activeColor;
        label.color = backgroundColor;
    });

    btn.onHoverEnd(() => {
        btn.scale = k.vec2(1);
        const accent = shouldActive() ? activeColor : neutralColor;
        btn.color = backgroundColor;
        label.color = accent;
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
