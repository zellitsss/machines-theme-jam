import {AreaComp, Color, ColorComp, GameObj, RotateComp, ScaleComp, TimerComp, TweenController, Vec2} from "kaplay";
import {canIn, canOut, getOppositeSide, getPosKey, getRotatedConnections} from "../utils";
import {wireDictionary} from "../wire-dictionary";
import {canRotateAt, getNextConnectedCell} from "./grid";
import {WireState} from "../components/wireState";
import * as Constants from "../constants";
import {CellData, WireDefinition} from "../types";
import {
    COLOR_Active, COLOR_Inactive, k, Tag_Wire, Tag_Wire_InGrid, Tag_Wire_Visual, Tag_WireType_End,
    Tag_WireType_Modifier_Minus, Tag_WireType_Modifier_Plus, Tag_WireType_Start
} from "../constants";
import {PanelComp} from "../components/panel";

export const activeTweenByCell = new Map<string, TweenController>();

export const getExitSide = (wire: GameObj<WireState>, enteredSide: number): number | null => {
    const rotatedConnections = getRotatedConnections(wireDictionary.get(wire.wireData.type)?.flow ?? [0, 0, 0, 0], wire.wireData.rot);
    for (let side = 0; side < 4; side++) {
        if (side === enteredSide) {
            continue;
        }
        if (canOut(rotatedConnections[side])) {
            return side;
        }
    }
    return null;
}

/**
 * Check if the wire line is valid.
 * @returns -1 if the wire line is not valid, otherwise the modifier value of the wire line.
 */
export const checkWireLineValid = (): number => {
    const wires = k.query({
        include: [Tag_Wire, Tag_Wire_InGrid],
        includeOp: "and"
    }) as GameObj<WireState>[];
    wires.forEach((wire) => {
        setWiresColor(wire, getWireColor(wire.wireData.type, false));
    });
    // Reset color
    
    let startWire: GameObj<WireState> | null = null;
    let endWire: GameObj<WireState> | null = null;
    wires.forEach((wire) => {
        if (wire.wireData.type === Tag_WireType_Start) {
            startWire = wire;
        } else if (wire.wireData.type === Tag_WireType_End) {
            endWire = wire;
        }
    })

    if (!startWire || !endWire) {
        return -1;
    }
    let current = startWire;
    let visited = new Set<string>();
    let incomingSide = -1;
    let currentModifier = 0;

    while (current) {
        setWiresColor(current, getWireColor(current.wireData.type, true));
        currentModifier += current.wireData.modifier ?? 0;
        const posKey = getPosKey(k.vec2(current.wireData.x, current.wireData.y));
        if (visited.has(posKey)) {
            return -1;
        }
        visited.add(posKey);

        if (current === endWire) {
            return currentModifier;
        }
        const exitSide = getExitSide(current, incomingSide);
        if (exitSide === null) {
            break;
        }

        const next = getNextConnectedCell(wires, current, exitSide);
        if (!next) {
            break;
        }

        // Check if next cell is connected to the current cell
        const nextEntrySide = getOppositeSide(exitSide);
        const nextRotatedConnections = getRotatedConnections(wireDictionary.get(next.wireData.type)?.flow ?? [0, 0, 0, 0], next.wireData.rot);
        if (!canIn(nextRotatedConnections[nextEntrySide])) {
            break;
        }

        incomingSide = (exitSide + 2) % 4;
        current = next;
    }

    return -1;
}

export const handleRotatingWire = (wire: GameObj<WireState>) => {
    if (canRotateAt(k.vec2(wire.wireData.x, wire.wireData.y))) {
        wire.rotateCW();
    }
}

export const animateWireRotation = (wire: GameObj<WireState>, onRotationCompleted: () => void) => {
    const obj = wire as GameObj<WireState | RotateComp | TimerComp | ScaleComp>;

    const from = obj.angle;
    const to = obj.wireData.rot * Constants.ROTATION_ANGLE_PER_STEP;
    // Rotate tween
    const tween = obj.tween(from, to, Constants.ROTATE_TWEEN_SEC, (a) => {
        obj.angle = a;
    }, k.easings.easeInOutQuad);

    const half = Constants.ROTATE_TWEEN_SEC / 2;
    const scaleNormal = k.vec2(1, 1);
    const scaleSmall = k.vec2(Constants.ROTATE_SCALE_PEAK, Constants.ROTATE_SCALE_PEAK);
    // Scale tween
    obj
        .tween(scaleNormal, scaleSmall, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
        .then(() =>
            obj.tween(scaleSmall, scaleNormal, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
        );

    const posKey = getPosKey(k.vec2(wire.wireData.x, wire.wireData.y));
    activeTweenByCell.set(posKey, tween);
    tween.onEnd(() => {
        activeTweenByCell.delete(posKey);
        obj.angle = obj.wireData.rot * Constants.ROTATION_ANGLE_PER_STEP;
        obj.scaleTo(1);
        onRotationCompleted();
    });
}

export const needWireBg = (cellData: CellData): boolean => {
    return (cellData.canPlace ?? true) || cellData.type === Tag_WireType_Start || cellData.type === Tag_WireType_End;
}

export const isInPanels = (objs: GameObj[], pos: Vec2): boolean => {
    let isIn = false;
    console.log(objs);
    objs.forEach((obj) => {
        isIn = isIn || (new k.Rect(obj.pos, obj.width, obj.height)).contains(pos);
    });
    return isIn;
}

export const getWireColor = (type: string, connected: boolean): number => {
    if (type === Tag_WireType_Modifier_Minus || type === Tag_WireType_Modifier_Plus)
    {
        return 0xffffff;
    }
    return connected ? COLOR_Active : COLOR_Inactive;
}

export const setWiresColor =  (wire: GameObj, color: number) => {
    wire.children.forEach((child) => {
        if (child.is(Tag_Wire_Visual))
        {
            (child as GameObj<ColorComp>).color = k.Color.fromHex(color);
        }
    })
}