import {GameObj, KAPLAYCtx} from "kaplay";
import { CELL_SIZE } from "../constants";
import { PipeDictionary } from "../pipe-dictionary";

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";

const INVENTORY_PANEL_GAP = 100;
const SLOT_PADDING = 10;
const COUNT_TEXT_SIZE = 22;
const CONTAINER_PADDING = 14;

export function setupLayers(k: KAPLAYCtx): void {
    k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI], LAYER_GAME);
}

export function createInventorySlots(k: KAPLAYCtx, container: GameObj, inventory: Map<string, number>): void {
    const entries = Array.from(inventory.entries());
    entries.forEach(([pipeType, count], index) => {
        const def = PipeDictionary.get(pipeType)!;
        const slotTop = CONTAINER_PADDING + index * (CELL_SIZE + SLOT_PADDING);

        const slot = container.add([
            k.pos(CONTAINER_PADDING, slotTop),
            k.anchor("topleft"),
            k.rect(CELL_SIZE, CELL_SIZE, { fill: true }),
            k.color(255, 255, 255),
            k.outline(2, k.rgb(0, 0, 0)),
        ]);

        slot.add([
            k.pos(CELL_SIZE / 2, CELL_SIZE / 2),
            k.anchor("center"),
            k.sprite(def.sprite, {
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
            }),
        ]);

        slot.add([
            k.pos(CELL_SIZE - 4, CELL_SIZE - 2),
            k.anchor("botright"),
            k.text(String(count), {
                size: COUNT_TEXT_SIZE,
                align: "right",
            }),
            k.color(0, 0, 0),
        ]);
    });
}