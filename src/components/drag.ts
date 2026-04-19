import { GameObj, KEventController, MouseButton, Vec2 } from "kaplay";
import { wireDictionary } from "../wire-dictionary";
import {CELL_SIZE, k} from "../constants";

export type DragPayload = {
    wireType: string;
    source: "inventory" | "grid";
    fromCell?: any;
};

export type DragOpts = {
    layer: string; // Layer name for the drag ghost (e.g. ui).
    getPayload: () => DragPayload | null;
    onDrop: (worldPos: Vec2, payload: DragPayload) => void;
    onTap?: () => void;
    dragThreshold?: number;
};

const DEFAULT_THRESHOLD = 4;

export function drag(opts: DragOpts) {
    const threshold = opts.dragThreshold ?? DEFAULT_THRESHOLD;

    let ghost: GameObj | null = null;
    let payload: DragPayload | null = null;
    let offset = k.vec2(0, 0);
    let pressed = false;
    let pressStart = k.vec2(0, 0);
    let pendingPayload: DragPayload | null = null;
    let releaseCtl: KEventController | null = null;

    function clearSubscription() {
        if (releaseCtl) {
            releaseCtl.cancel();
            releaseCtl = null;
        }
    }

    function destroyGhost() {
        if (ghost) {
            ghost.destroy();
            ghost = null;
        }
        payload = null;
    }

    function beginDrag(p: DragPayload) {
        const def = wireDictionary.get(p.wireType);
        if (!def) return;
        payload = p;
        const mouse = k.mousePos();
        const angle = p.source === "grid" && p.fromCell?.obj ? p.fromCell.obj.angle : 0;
        ghost = k.add([
            k.layer(opts.layer),
            k.pos(mouse),
            k.anchor("center"),
            k.sprite(def.sprite, {
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
            }),
            k.rotate(angle),
        ]);
        offset = mouse.sub(ghost.pos);
        if (p.source === "grid" && p.fromCell?.obj) {
            p.fromCell.obj.opacity = 0;
        }
    }

    function finishPressOrDrag() {
        if (!pressed && !ghost) return;
        const wasDragging = ghost !== null;
        const p = payload ?? pendingPayload;

        if (wasDragging && p) {
            const worldPos = k.mousePos();
            try {
                opts.onDrop(worldPos, p);
            } finally {
                if (p.source === "grid" && p.fromCell?.obj) {
                    p.fromCell.obj.opacity = 1;
                }
                destroyGhost();
            }
        } else if (pressed && !wasDragging && opts.onTap) {
            opts.onTap();
        }

        pressed = false;
        pendingPayload = null;
        clearSubscription();
    }

    return {
        id: "drag",
        require: ["pos", "area"],

        pick() {
            if (pressed || ghost) return;
            const p = opts.getPayload();
            if (!p) return;
            pendingPayload = p;
            pressed = true;
            pressStart = k.mousePos();

            clearSubscription();
            releaseCtl = k.onMouseRelease((button: MouseButton) => {
                if (button !== "left") return;
                finishPressOrDrag();
            });
        },

        isDragging() {
            return ghost !== null;
        },

        update() {
            if (ghost) {
                ghost.pos = k.mousePos().sub(offset);
                return;
            }
            if (pressed && pendingPayload) {
                const moved = k.mousePos().sub(pressStart).len();
                if (moved >= threshold) {
                    beginDrag(pendingPayload);
                }
            }
        },
    };
}
