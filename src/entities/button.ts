import {GameObj, Vec2} from "kaplay";
import {COLOR_Active, k} from "../constants.ts";
import {audio} from "../core/audio.ts";

// The `topMostOnlyActivated` is not working
let clickDelay = .2;
let lastClickedTime = 0;
export function createButton(parent: GameObj, text: string, pos: Vec2, size: Vec2, layer: string, shouldActive: () => boolean, onClick: () => void) {
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
    });

    btn.onHoverEnd(() => {
        btn.scale = k.vec2(1);
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