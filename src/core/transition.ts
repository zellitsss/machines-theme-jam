import { k, HEX_TRANSITION_WIDTH, LAYER_TRANSITION } from "../constants";

const STAGGER_S = 0.125;
const FADE_S = 0.4;

interface GridMeta {
    minDiag: number;
    maxDiag: number;
    diagRange: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HexObj = any & { diagIndex: number };

let hexes: HexObj[] = [];
let grid: GridMeta | null = null;

function createHexGrid(): GridMeta {
    const hexW = HEX_TRANSITION_WIDTH;
    const hexH = hexW * 0.866;
    const rowPitch = hexH * 0.75;
    const cols = Math.ceil(k.width() / hexW) + 3;
    const rows = Math.ceil(k.height() / rowPitch) + 3;

    // diagIndex = col - row, so bounds are deterministic from grid dimensions
    const minDiag = -(rows - 1);
    const maxDiag = cols - 1;
    const diagRange = maxDiag - minDiag; // cols + rows - 2

    for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
            const oddRowOffset = row % 2 === 1 ? hexW / 2 : 0;
            const diagIndex = col - row;

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
            ]) as HexObj;

            hex.diagIndex = diagIndex;
            hexes.push(hex);
        }
    }

    return { minDiag, maxDiag, diagRange };
}

function totalDuration(meta: GridMeta): number {
    return meta.diagRange * STAGGER_S + FADE_S;
}

function animateGrid(
    meta: GridMeta,
    fromScale: number,
    toScale: number,
    easing: (t: number) => number,
    reverse = false
) {
    const { minDiag, maxDiag } = meta;

    for (const hex of hexes) {
        const baseDelay = reverse
            ? (maxDiag - hex.diagIndex) * STAGGER_S
            : (hex.diagIndex - minDiag) * STAGGER_S;
        const jitter = (Math.random() - 0.5) * STAGGER_S * 0.3;
        const delay = Math.max(0, baseDelay + jitter);

        hex.wait(delay, () => {
            hex.tween(fromScale, toScale, FADE_S, (v: number) => (hex.scale = k.vec2(v)), easing);
        });
    }
}

export function transitionTo(sceneName: string, ...args: unknown[]): Promise<void> {
    return new Promise((resolve) => {
        if (!grid) {
            grid = createHexGrid();
        }

        animateGrid(grid, 0, 1, k.easings.easeOutBack);

        const trigger = k.add([k.timer(), k.stay()]);
        trigger.wait(totalDuration(grid), () => {
            trigger.destroy();
            resolve();
            k.go(sceneName, ...args);
        });
    });
}

export function playEnterTransition(): Promise<void> {
    return new Promise((resolve) => {
        if (hexes.length === 0 || !grid) {
            resolve();
            return;
        }

        animateGrid(grid, 1, 0, k.easings.easeInBack, true);

        const trigger = k.add([k.timer(), k.stay()]);
        trigger.wait(totalDuration(grid), () => {
            trigger.destroy();
            resolve();
        });
    });
}
