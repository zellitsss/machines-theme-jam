import {ItemData} from "../types";
import {GameObj, TextComp} from "kaplay";
import {k} from "../constants";
import {createWire} from "../entities/wire";
import {fromItemToWireData} from "../utils";

export const inventory = new Map<string, ItemData>();
export const inventorySlot: GameObj[] = [];

export const createInventorySlot = (posX: number, posY: number, size: number, itemData: ItemData, parent: GameObj = null) => {
    const comps = [
        k.pos(posX, posY),
        "inventory_slot",
        itemData.type
    ];
    const itemSlot = parent === null ? k.add(comps) : parent.add(comps);
    createWire(0, 0, size, fromItemToWireData(itemData), true, ["inventory_item"], itemSlot);
    const countLabel = itemSlot.add([
        k.text(itemData.count.toString(), {size: 24, font: "monospace"}),
        k.anchor("center"),
        k.pos(size, 0),
        k.color(56, 88, 229),
        "inventory_label",
        itemData.type
    ]);
    inventorySlot.push(itemSlot);
    return itemSlot;
}

export const updateItem = (type: string, amount: number) => {
    const item = inventory.get(type);
    if (item) {
        item.count += amount;
        if (item.count <= 0) {
            inventory.delete(type);
        }
        updateItemCountLabel(type);
    } else {
        if (amount > 0) {
            inventory.set(type, {type, count: amount});
            updateItemCountLabel(type);
        }
    }
}

export const updateItemCountLabel = (type: string) => {
    inventorySlot.forEach((slot) => {
        slot.children.forEach((child) => {
            if (child.tags.includes(type) && child.tags.includes("inventory_label")) {
                (child as GameObj<TextComp>).text = inventory.get(type)?.count.toString() ?? "0";
            }
        });
    })
}