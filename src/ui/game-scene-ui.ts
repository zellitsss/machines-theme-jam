import { GameObj, KAPLAYCtx, MouseButton, Vec2 } from "kaplay";
import { CELL_SIZE } from "../constants";
import { PipeDictionary } from "../pipe-dictionary";
import { drag } from "../components/drag";

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";

const SLOT_PADDING = 10;
const COUNT_TEXT_SIZE = 22;
const CONTAINER_PADDING = 14;

export type Inventory = {
    add(type: string, n: number): void;
};

export function setupLayers(k: KAPLAYCtx): void {
    k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI], LAYER_GAME);
}

export function createInventorySlots(
    k: KAPLAYCtx,
    container: GameObj,
    inventory: Map<string, number>,
    tryPlaceFromInventory: (pipeType: string, worldPos: Vec2) => boolean
): Inventory {
    const counts = new Map<string, number>(inventory);
    const countLabels = new Map<string, GameObj>();

    function refreshLabel(pipeType: string) {
        const label = countLabels.get(pipeType);
        if (label) {
            label.text = String(counts.get(pipeType) ?? 0);
        }
    }

    const entries = Array.from(counts.entries());
    entries.forEach(([pipeType], index) => {
        const def = PipeDictionary.get(pipeType)!;
        const slotTop = CONTAINER_PADDING + index * (CELL_SIZE + SLOT_PADDING);

        const slot = container.add([
            k.pos(CONTAINER_PADDING, slotTop),
            k.anchor("topleft"),
            k.rect(CELL_SIZE, CELL_SIZE, { fill: true }),
            k.color(255, 255, 255),
            k.outline(2, k.rgb(0, 0, 0)),
            k.area(),
            drag({
                k,
                layer: LAYER_UI,
                getPayload: () => {
                    const c = counts.get(pipeType) ?? 0;
                    if (c <= 0) return null;
                    return { pipeType, source: "inventory" as const };
                },
                onDrop(worldPos, payload) {
                    if (payload.source !== "inventory" || payload.pipeType !== pipeType) return;
                    if (tryPlaceFromInventory(pipeType, worldPos)) {
                        const next = (counts.get(pipeType) ?? 0) - 1;
                        counts.set(pipeType, Math.max(0, next));
                        refreshLabel(pipeType);
                    }
                },
            }),
        ]);

        slot.add([
            k.pos(CELL_SIZE / 2, CELL_SIZE / 2),
            k.anchor("center"),
            k.sprite(def.sprite, {
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
            }),
        ]);

        const countLabel = slot.add([
            k.pos(CELL_SIZE - 4, CELL_SIZE - 2),
            k.anchor("botright"),
            k.text(String(counts.get(pipeType) ?? 0), {
                size: COUNT_TEXT_SIZE,
                align: "right",
            }),
            k.color(0, 0, 0),
        ]);
        countLabels.set(pipeType, countLabel);

        slot.onClick((button: MouseButton) => {
            if (button !== "left") return;
            if (slot.isDragging()) {
                return;
            }
            slot.pick();
        }, "left");
    });

    return {
        add(type: string, n: number) {
            counts.set(type, (counts.get(type) ?? 0) + n);
            refreshLabel(type);
        },
    };
}
