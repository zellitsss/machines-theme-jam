import {GameObj, KAPLAYCtx, RotateComp, ScaleComp, TimerComp, TweenController} from "kaplay";
import {canIn, canOut, getOppositeSide, getPosKey, getRotatedConnections} from "../utils";
import {wireDictionary} from "../wire-dictionary";
import {canRotateAt, getNextConnectedCell, gridConstraints} from "./grid";
import {WireState} from "../components/wireState";
import * as Constants from "../constants";

export const activeTweenByCell = new Map<string, TweenController>();

export const getExitSide = (wire: GameObj<WireState>, enteredSide: number): number | null => {
    const rotatedConnections = getRotatedConnections(wireDictionary.get(wire.type)?.flow ?? [0, 0, 0, 0], wire.rot);
    for (let side = 0; side < 4; side++) {
        if (side === enteredSide)
        {
            continue;
        }
        if (canOut(rotatedConnections[side]))
        {
            return side;
        }
    }
    return null;
}

export const isWiresConnected = (wires: GameObj<WireState>[], startWire: GameObj<WireState>, endWire: GameObj<WireState>): boolean => {
    if (!startWire || !endWire) {
        return false;
    }
    let current = startWire;
    let visited = new Set<string>();
    let incomingSide = -1;
    
    while (current) {
        const posKey = getPosKey(current.x, current.y);
        if (visited.has(posKey)) {
            return false;
        }
        visited.add(posKey);

        if (current === endWire) {
            return true;
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
        const nextRotatedConnections = getRotatedConnections(wireDictionary.get(next.type)?.flow ?? [0, 0, 0, 0], next.rot);
        if (!canIn(nextRotatedConnections[nextEntrySide])) {
            break;
        }

        incomingSide = (exitSide + 2) % 4;
        current = next;
    }

    return false;
}

export const handleRotatingWire = (wire: GameObj<WireState>) => {
    if (canRotateAt(wire.x, wire.y)) {
        wire.rotateCW();
    }
}

export const animateWireRotation = (k: KAPLAYCtx, wire: GameObj<WireState>, onRotationCompleted: () => void) => {
    const obj = wire as GameObj<WireState | RotateComp | TimerComp | ScaleComp>;

    const from = obj.angle;
    const to = obj.rot * Constants.ROTATION_ANGLE_PER_STEP;
    // Rotate tween
    const tween = obj.tween(from, to, Constants.ROTATE_TWEEN_SEC, (a) => {
        obj.angle = a;
    }, k.easings.easeInOutQuad);

    const half = Constants.ROTATE_TWEEN_SEC / 2;
    const scaleNormal = k.vec2(1, 1);
    const scaleSmall = k.vec2(Constants.ROTATE_SCALE_PEAK, Constants.ROTATE_SCALE_PEAK);
    // Scale tween
    // obj
    //     .tween(scaleNormal, scaleSmall, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
    //     .then(() =>
    //         obj.tween(scaleSmall, scaleNormal, half, (v) => obj.scaleTo(v), k.easings.easeOutQuad)
    //     );

    const posKey = getPosKey(obj.x, obj.y);
    activeTweenByCell.set(posKey, tween);
    tween.onEnd(() => {
        activeTweenByCell.delete(posKey);
        obj.angle = obj.rot * Constants.ROTATION_ANGLE_PER_STEP;
        // obj.scaleTo(1);
        onRotationCompleted();
    });
}