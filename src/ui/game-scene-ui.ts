import { GameObj, KAPLAYCtx, MouseButton, Vec2 } from "kaplay";
import { CELL_SIZE } from "../constants";
import { wireDictionary } from "../wire-dictionary";
import { drag } from "../components/drag";

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";

const SLOT_PADDING = 10;
const COUNT_TEXT_SIZE = 22;
const CONTAINER_PADDING = 14;

export type InventoryOld = {
    add(type: string, n: number): void;
};

export function setupLayers(k: KAPLAYCtx): void {
    k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI], LAYER_GAME);
}

export function createInventorySlots(
    k: KAPLAYCtx,
    container: GameObj,
    inventory: Map<string, number>,
    tryPlaceFromInventory: (wireType: string, worldPos: Vec2) => boolean
): InventoryOld {
    const counts = new Map<string, number>(inventory);
    const countLabels = new Map<string, GameObj>();

    function refreshLabel(wireType: string) {
        const label = countLabels.get(wireType);
        if (label) {
            label.text = String(counts.get(wireType) ?? 0);
        }
    }

    const entries = Array.from(counts.entries());
    entries.forEach(([wireType], index) => {
        const def = wireDictionary.get(wireType)!;
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
                    const c = counts.get(wireType) ?? 0;
                    if (c <= 0) return null;
                    return { wireType, source: "inventory" as const };
                },
                onDrop(worldPos, payload) {
                    if (payload.source !== "inventory" || payload.wireType !== wireType) return;
                    if (tryPlaceFromInventory(wireType, worldPos)) {
                        const next = (counts.get(wireType) ?? 0) - 1;
                        counts.set(wireType, Math.max(0, next));
                        refreshLabel(wireType);
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
            k.text(String(counts.get(wireType) ?? 0), {
                size: COUNT_TEXT_SIZE,
                align: "right",
            }),
            k.color(0, 0, 0),
        ]);
        countLabels.set(wireType, countLabel);

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
