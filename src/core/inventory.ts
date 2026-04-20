import {ItemData} from "../types";
import {GameObj} from "kaplay";
import {k} from "../constants";
import {createWire} from "../entities/wire";
import {fromItemToWireData} from "../utils";

export const inventory = new Map<string, ItemData>();

export const createInventorySlot = (posX: number, posY: number, size: number, itemData: ItemData, parent: GameObj = null) => {
    const comps = [
        k.pos(posX, posY),
    ];
    const itemSlot = parent === null ? k.add(comps) : parent.add(comps);
    createWire(0, 0, size, fromItemToWireData(itemData), true, ["inventory_item"], itemSlot);
    const countLabel = itemSlot.add([
        k.text(itemData.count.toString(), {size: 24, font: "monospace"}),
        k.anchor("center"),
        k.pos(size, 0),
        k.color(56, 88, 229),
    ]);
    return itemSlot;
}