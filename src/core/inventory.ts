import {ItemData} from "../types";
import {GameObj, TextComp} from "kaplay";
import {
    COLOR_Active,
    INVENTORY_CELL_SIZE,
    INVENTORY_ITEM_COUNT, INVENTORY_TITLE_HEIGHT, INVENTORY_TITLE_PADDING, ITEM_SLOT_PADDING,
    k, MAIN_PANEL_PADDING,
    Tag_InventoryItem,
    Tag_InventoryLabel,
    Tag_InventoryPanel
} from "../constants";
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
        const existedSlots = panel.children.filter((child) => child.is("inventory_slot"));
        if (existedSlots.length < INVENTORY_ITEM_COUNT && itemSlot === null) {
            comps.push(k.pos(panel.panelWidth / 2, MAIN_PANEL_PADDING + INVENTORY_TITLE_PADDING * 2 + INVENTORY_TITLE_HEIGHT + (size * (existedSlots.length + 0.5)) ));
            itemSlot = panel.add(comps);
        }
    });

    if (itemSlot === null) {
        // TODO: handle full inventory
        return null;
    }
    createWire(k.vec2(), size, fromItemToWireData(itemData), true, [Tag_InventoryItem], itemSlot);
    const countLabel = itemSlot.add([
        k.text(itemData.count.toString(), {size: 24, font: "monospace"}),
        k.anchor("center"),
        k.pos(size / 2 + 16, 0),
        k.color(COLOR_Active),
        Tag_InventoryLabel,
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
                INVENTORY_CELL_SIZE,
                {
                    type: inType,
                    modifier: itemDef.modifier ?? 0,
                    count: amount
                },
                k.get([Tag_InventoryPanel])
            );
            inventorySlots.push(newSlot);
        }
    }
}

export const updateItemCountLabel = (type: string) => {
    inventorySlots.forEach((slot) => {
        slot.children.forEach((child) => {
            if (child.is([type, Tag_InventoryLabel])) {
                (child as GameObj<TextComp>).text = inventory.get(type)?.count.toString() ?? "0";
            }
        });
    })
}