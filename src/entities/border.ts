import {GameObj, Vec2} from "kaplay";
import {COLOR_Active, COLOR_Background, INVENTORY_TITLE_PADDING, k} from "../constants";

export const createBorder = (title: string, pos: Vec2, width: number, height: number, tags: string[], parent: GameObj = null) => {
    const comps = [
        k.pos(pos),
        k.anchor("top"),
        k.rect(width, height),
        k.outline(4, k.Color.fromHex(COLOR_Active)),
        k.color(COLOR_Background),
        k.area(),
        ...tags
    ];
    const border = parent === null ? k.add(comps) : parent.add(comps);
    border.add([
        k.pos(k.vec2(0, INVENTORY_TITLE_PADDING)),
        k.anchor("top"),
        k.text(title, {size: 24}),
        k.color(COLOR_Active),
    ]);
    return border;
}