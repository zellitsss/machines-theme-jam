import {ItemData} from "../types";
import {GameObj, TextComp} from "kaplay";
import {k} from "../constants";
import {createWire} from "../entities/wire";
import {fromItemToWireData} from "../utils";
import {PanelComp} from "../components/panel";
import {wireDictionary} from "../wire-dictionary";

export const inventory = new Map<string, ItemData>();
export const inventorySlots: GameObj[] = [];

export const createInventorySlot = (size: number, itemData: ItemData, panels: GameObj[]) => {
    if (panels.length == 0) {
        return null;
    }
    const comps: any[] = [
        k.anchor("center"),
        "inventory_slot",
        itemData.type
    ];
    let itemSlot: GameObj | null = null;
    panels.forEach((panel: GameObj<PanelComp>) => {
        const existedSlots = panel.children.filter((child) => child.tags.includes("inventory_slot"));
        if (existedSlots.length < 4 && itemSlot === null) {
            comps.push(k.pos(panel.width / 2, (size + 8) * existedSlots.length + size));
            itemSlot = panel.add(comps);
        }
    });

    if (itemSlot === null) {
        // TODO: handle full inventory
        return null;
    }
    createWire(0, 0, size, fromItemToWireData(itemData), true, ["inventory_item"], itemSlot);
    const countLabel = itemSlot.add([
        k.text(itemData.count.toString(), {size: 24, font: "monospace"}),
        k.anchor("center"),
        k.pos(size, 0),
        k.color(56, 88, 229),
        "inventory_label",
        itemData.type
    ]);
    inventorySlots.push(itemSlot);
    return itemSlot;
}

export const updateItem = (inType: string, amount: number) => {
    const item = inventory.get(inType);
    if (item) {
        item.count = Math.max(item.count + amount, 0);
        updateItemCountLabel(inType);
    } else {
        if (amount > 0) {
            inventory.set(inType, {type: inType, count: amount});
            const itemDef = wireDictionary.get(inType);
            const newSlot = createInventorySlot(
                100,
                {
                    type: inType,
                    modifier: itemDef.modifier ?? 0,
                    count: amount
                },
                k.get(["inventory_panel"])
            );
            inventorySlots.push(newSlot);
        }
    }
}

export const updateItemCountLabel = (type: string) => {
    inventorySlots.forEach((slot) => {
        slot.children.forEach((child) => {
            if (child.tags.includes(type) && child.tags.includes("inventory_label")) {
                (child as GameObj<TextComp>).text = inventory.get(type)?.count.toString() ?? "0";
            }
        });
    })
}