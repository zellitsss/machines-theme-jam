import { k, HEX_TRANSITION_WIDTH, LAYER_TRANSITION } from "../constants";

const STAGGER_S = 0.045;
const FADE_S = 0.4;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hexes: any[] = [];

function buildHexGrid() {
    const hexW = HEX_TRANSITION_WIDTH;
    const hexH = hexW * 0.866;
    const rowPitch = hexH * 0.75;
    const cols = Math.ceil(k.width() / hexW) + 3;
    const rows = Math.ceil(k.height() / rowPitch) + 3;
    return { hexW, rowPitch, cols, rows };
}

export function transitionTo(sceneName: string, ...args: unknown[]) {
    const { hexW, rowPitch, cols, rows } = buildHexGrid();
    const diagRange = cols + rows - 2;

    if (hexes.length > 0) {
        hexes.forEach((hex) => {
            const diagProxy = hex.pos.x / hexW - hex.pos.y / rowPitch;
            const delay = (diagProxy + (rows - 1)) * STAGGER_S;
            hex.wait(delay, () => {
                hex.tween(0, 1, FADE_S, (v: number) => (hex.scale = k.vec2(v)), k.easings.easeOutBack);
            });
        });
    } else {
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const oddRowOffset = (row % 2 === 1) ? hexW / 2 : 0;
                const diagIndex = col - row + (rows - 1);
                const delay = diagIndex * STAGGER_S;

                const hex = k.add([
                    k.layer(LAYER_TRANSITION),
                    k.sprite("hexagon"),
                    k.anchor("center"),
                    k.pos(col * hexW + oddRowOffset - hexW / 2, row * rowPitch - rowPitch / 2),
                    k.color(0, 0, 0),
                    k.scale(0),
                    k.fixed(),
                    k.stay(),
                    k.timer(),
                ]);
                hexes.push(hex);
                hex.wait(delay, () => {
                    hex.tween(0, 1, FADE_S, (v) => (hex.scale = k.vec2(v)), k.easings.easeOutBack);
                });
            }
        }
    }

    const trigger = k.add([k.timer(), k.stay()]);
    trigger.wait(diagRange * STAGGER_S + FADE_S, () => {
        trigger.destroy();
        k.go(sceneName, ...args);
    });
}

export function playEnterTransition() {
    console.log("playEnterTransition");
    if (hexes.length === 0) return;

    const hexW = HEX_TRANSITION_WIDTH;
    const rowPitch = hexW * 0.866 * 0.75;
    const diags = hexes.map((h) => h.pos.x / hexW - h.pos.y / rowPitch);
    const minDiag = Math.min(...diags);
    const maxDiag = Math.max(...diags);
    const diagRange = maxDiag - minDiag || 1;

    hexes.forEach((hex, i) => {
        const t = 1 - (diags[i] - minDiag) / diagRange;
        const delay = t * diagRange * STAGGER_S;
        hex.wait(delay, () => {
            hex.tween(1, 0, FADE_S, (v) => (hex.scale = k.vec2(v)), k.easings.easeInBack);
            hex.on("destroy", () => {
                hexes = hexes.filter((h) => h !== hex);
            });
        });
    });
}
