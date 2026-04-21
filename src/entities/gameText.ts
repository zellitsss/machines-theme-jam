import {COLOR_Active, k} from "../constants";
import {Anchor, GameObj, TextAlign, Vec2} from "kaplay";

export const createGameText = (pos: Vec2, text: string, size: number, anchor: Anchor | Vec2, textAlign: TextAlign, tags: string[] = [], parent: GameObj = null) => {
    const comps = [
        k.pos(pos),
        k.text(text, {size: size, font: "monospace", align: textAlign}),
        k.anchor(anchor),
        k.color(COLOR_Active),
        ...tags
    ];
    return parent === null ? k.add(comps) : parent.add(comps);
};