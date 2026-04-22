import {wireDictionary} from "../wire-dictionary";
import {WireData, WireDefinition} from "../types";
import {getPosKey, getRotationFromStep} from "../utils";
import {WireState, wireState} from "../components/wireState";
import {wireInteraction} from "../components/wireInteraction";
import {
    COLOR_Active,
    COLOR_Negative,
    COLOR_Positive,
    k, Tag_InventoryItem, Tag_InventoryPanel,
    Tag_Wire, Tag_Wire_Bg, Tag_Wire_Ghost,
    Tag_Wire_Modifier_Label, Tag_Wire_Placeholder,
    Tag_Wire_Visual
} from "../constants";
import {AreaComp, GameObj, PosComp, Rect, RotateComp, Vec2} from "kaplay";
import {fixedRotation} from "../components/fixedRotation";
import {gridConstraints, isValidCell} from "../core/grid";
import {getWireColor} from "../core/gameplay";

export const createWireVisual = (wireData: WireData, wireDef: WireDefinition, size: number, isInInventory: boolean) => {
    return [
        k.pos(),
        k.rotate(0),
        k.anchor("center"),
        k.sprite(wireDef?.sprite ?? "", {
            width: size,
            height: size,
            frame: wireDef?.frame,
        }),
        k.color(getWireColor(wireData, isInInventory)),
        k.scale(1),
        k.opacity(1),
        Tag_Wire_Visual,
    ]
};

export const createWireBg = (size: number) => {
    return [
        k.pos(),
        k.anchor("center"),
        k.sprite("atlas", {
            width: size,
            height: size,
            frame: 6
        }),
        Tag_Wire_Bg
    ];
}

export const createWire = (pos: Vec2, size: number, wireData: WireData, needBg: boolean, tags: string[] = [], parent: GameObj | null = null) => {
    const wireDef = wireDictionary.get(wireData.type);
    const comps = [
        k.pos(pos),
        k.anchor("center"),
        k.rotate(getRotationFromStep(wireData.rot)),
        k.area({
            shape: new k.Rect(k.vec2(), size, size)
        }),
        wireInteraction(),
        wireState(wireData),
        k.scale(1),
        k.timer(),
        k.opacity(1),
        Tag_Wire,
        ...tags,
    ];
    const wire = parent === null ? k.add(comps) : parent.add(comps);
    if (needBg) {
        wire.add(createWireBg(size));
    }
    wire.add(createWireVisual(wireData, wireDef, size, tags.includes(Tag_InventoryItem)));
    if (wireDef?.modifier != null && wireDef.modifier != 0) {
        wire.add([
            k.pos(),
            k.rotate(-getRotationFromStep(wireData.rot)),
            k.anchor("center"),
            k.text((wireData.modifier??0).toString(), {size: 24, font: "ZenDots"}),
            k.color("white"),
            fixedRotation(),
            Tag_Wire_Modifier_Label,
        ]);
    }
    return wire;
}

export const createPlaceholderWire = (pos: Vec2, size: number, wireData: WireData, tags: string[], parent: GameObj | null = null) => {
    const wireDef = wireDictionary.get(wireData.type);
    const comps = [
        k.pos(pos),
        k.rotate(),
        k.anchor("center"),
        k.area({
            shape: new k.Rect(k.vec2(), size, size)
        }),
        k.color(199, 199, 199),
        k.scale(1),
        k.opacity(1),
        k.sprite("atlas", {
            width: size,
            height: size,
            frame: wireDef?.placeholderFrame,
        }),
        Tag_Wire_Placeholder,
        ...tags
    ];
    const placeholder = parent === null ? k.add(comps) : parent.add(comps);
    if ((wireDef?.modifier ?? 0) != 0) {
        placeholder.add([
            k.pos(),
            k.anchor("center"),
            k.text(wireData.modifier.toString(), {size: 24, font: "monospace"}),
            k.color(wireDef?.modifier > 0 ? COLOR_Positive : COLOR_Negative),
            fixedRotation(),
            Tag_Wire_Modifier_Label,
        ]);
    }
    placeholder.angle = getRotationFromStep(wireData.rot);
    return placeholder;
}

export const createGhostWire = (original: GameObj) => {
    const wire = original as GameObj<WireState | PosComp | AreaComp>;
    return createWire(
        wire.pos,
        (wire.area.shape as Rect).width,
        wire.wireData,
        true,
        [Tag_Wire_Ghost]
    );
}