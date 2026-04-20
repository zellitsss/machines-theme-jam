import {wireDictionary} from "../wire-dictionary";
import {WireData, WireDefinition} from "../types";
import {getPosKey, getRotationFromStep} from "../utils";
import {WireState, wireState} from "../components/wireState";
import {wireInteraction} from "../components/wireInteraction";
import {k} from "../constants";
import {AreaComp, GameObj, PosComp, Rect, RotateComp} from "kaplay";
import {fixedRotation} from "../components/fixedRotation";
import {gridConstraints} from "../core/grid";
import {getWireColor} from "../core/gameplay";

export const createWireVisual = (type: string, wireDef: WireDefinition, size: number) => {
    return [
        k.pos(),
        k.rotate(0),
        k.anchor("center"),
        k.sprite(wireDef?.sprite ?? "", {
            width: size,
            height: size,
            frame: wireDef?.frame,
        }),
        k.color(getWireColor(type, false)),
        k.scale(1),
        k.opacity(1),
        "wire_visual",
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
        "wire_Bg"
    ];
}

export const createWire = (posX: number, posY: number, size: number, wireData: WireData, needBg: boolean, tags: string[] = [], parent: GameObj | null = null) => {
    const wireDef = wireDictionary.get(wireData.type);
    const comps = [
        k.pos(posX, posY),
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
        "wire",
        ...tags,
    ];
    const wire = parent === null ? k.add(comps) : parent.add(comps);
    if (needBg) {
        wire.add(createWireBg(size));
    }
    wire.add(createWireVisual(wireData.type, wireDef, size));
    if (wireDef?.modifier != null && wireDef.modifier != 0) {
        wire.add([
            k.pos(),
            k.rotate(-getRotationFromStep(wireData.rot)),
            k.anchor("center"),
            k.text(wireData.modifier.toString(), {size: 24, font: "monospace"}),
            k.color("white"),
            fixedRotation(),
            "wire_modifier_label",
        ]);
    }
    return wire;
}

export const createPlaceholderWire = (posX: number, posY: number, size: number, wireData: WireData, tags: string[], parent: GameObj | null = null) => {
    const wireDef = wireDictionary.get(wireData.type);
    const comps = [
        k.pos(posX, posY),
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
        "placeholder_wire",
        ...tags
    ];
    const placeholder = parent === null ? k.add(comps) : parent.add(comps);
    if (wireDef?.modifier != null && wireDef.modifier != 0) {
        placeholder.add([
            k.pos(),
            k.anchor("center"),
            k.text(wireData.modifier.toString(), {size: 24, font: "monospace"}),
            k.color("white"),
            fixedRotation(),
            "wire_modifier_label",
        ]);
    }
    placeholder.angle = getRotationFromStep(wireData.rot);
    return placeholder;
}

export const createGhostWire = (original: GameObj) => {
    const wire = original as GameObj<WireState | PosComp | AreaComp>;
    return createWire(
        wire.pos.x,
        wire.pos.y,
        (wire.area.shape as Rect).width,
        wire.wireData,
        true,
        ["ghost"]
    );
}