import {AreaComp, Color, ColorComp, GameObj, RotateComp, ScaleComp, TimerComp, TweenController, Vec2} from "kaplay";
import {canIn, canOut, getOppositeSide, getPosKey, getRotatedConnections} from "../utils";
import {wireDictionary} from "../wire-dictionary";
import {canRotateAt, getNextConnectedCell, isValidCell} from "./grid";
import {WireState} from "../components/wireState";
import * as Constants from "../constants";
import {CellData, WireData, WireDefinition} from "../types";
import {
    COLOR_Active, COLOR_Inactive,
    COLOR_Neutral, k, Tag_Wire, Tag_Wire_InGrid, Tag_Wire_Visual, Tag_WireType_Blocked, Tag_WireType_End,
    Tag_WireType_Modifier_Minus, Tag_WireType_Modifier_Plus, Tag_WireType_Start
} from "../constants";
import {PanelComp} from "../components/panel";

export const activeTweenByCell = new Map<string, TweenController>();

export const getExitSides = (wire: GameObj<WireState>, enteredSide: number): number[] => {
    const rotatedConnections = getRotatedConnections(wireDictionary.get(wire.wireData.type)?.flow ?? [0, 0, 0, 0], wire.wireData.rot);
    const exitSides: number[] = [];
    for (let side = 0; side < 4; side++) {
        if (side === enteredSide) {
            continue;
        }
        if (canOut(rotatedConnections[side])) {
            exitSides.push(side);
        }
    }
    return exitSides;
}

/**
 * Check if the wire line is valid.
 * @returns -1 if the wire line is not valid, otherwise the modifier value of the wire line.
 */
export const checkWireLineValid = (targetSum: number): { result: boolean, count: number } => {
    const wires = k.query({
        include: [Tag_Wire, Tag_Wire_InGrid],
        includeOp: "and"
    }) as GameObj<WireState>[];
    wires.forEach((wire) => setWiresColor(wire, getWireColor(wire.wireData, false)));

    let startWire = wires.find((w) => w.wireData.type === Tag_WireType_Start);
    if (!startWire) {
        return {result: false, count: 0};
    }
    
    let visited = new Set<string>();
    let totalSum = 0;
    let endWireReached = false;
    
    const traverse = (
        current: GameObj<WireState>,
        incomingSide: number,
        runningSum: number // Track the sum on this specific branch
    ) => {

        const posKey = getPosKey(k.vec2(current.wireData.x, current.wireData.y));
        if (visited.has(posKey)) return;

        const isRequirementType = current.wireData.type.includes("-req"); 
        if (isRequirementType) {
            const requirement = current.wireData.modifier ?? 0;
            if (runningSum < requirement) {
                return;
            }
        }

        visited.add(posKey);
        setWiresColor(current, getWireColor(current.wireData, true));

        const myModifier = isRequirementType ? 0 : current.wireData.modifier ?? 0;
        const newTotal = runningSum + myModifier;

        if (current.wireData.type === Tag_WireType_End) {
            totalSum += newTotal;
            endWireReached = true;
            return;
        }

        const exitSides = getExitSides(current, incomingSide);

        for (const exitSide of exitSides) {
            const next = getNextConnectedCell(wires, current, exitSide);
            if (!next) continue;

            const nextEntrySide = getOppositeSide(exitSide);
            const nextConfig = wireDictionary.get(next.wireData.type);
            const nextRotatedFlow = getRotatedConnections(nextConfig?.flow ?? [0, 0, 0, 0], next.wireData.rot);

            if (canIn(nextRotatedFlow[nextEntrySide])) {
                traverse(next, nextEntrySide, newTotal);
            }
        }
    };

    traverse(startWire, -1, 0);
    return { result: endWireReached && totalSum == targetSum , count: totalSum };
}

export const handleRotatingWire = (wire: GameObj<WireState>) => {
    if (canRotateAt(k.vec2(wire.wireData.x, wire.wireData.y))) {
        wire.rotateCW();
    }
}

export const animateWireRotation = (wire: GameObj<WireState>, onRotationCompleted: () => void) => {
    const obj = wire as GameObj<WireState | RotateComp | TimerComp | ScaleComp>;

    const from = obj.angle;
    const to = from + Constants.ROTATION_ANGLE_PER_STEP;
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

export const getWireColor = (wireData: WireData, connected: boolean): number => {
    const type = wireData.type;
    if (type === Tag_WireType_Modifier_Minus
        || type === Tag_WireType_Modifier_Plus
        || type === Tag_WireType_Blocked
    ) {
        return 0xffffff;
    }
    if (!isValidCell(k.vec2(wireData.x, wireData.y))) {
        return COLOR_Active;
    }
    return connected ? COLOR_Active : COLOR_Inactive;
}

export const setWiresColor = (wire: GameObj, color: number) => {
    wire.children.forEach((child) => {
        if (child.is(Tag_Wire_Visual)) {
            (child as GameObj<ColorComp>).color = k.Color.fromHex(color);
        }
    })
}