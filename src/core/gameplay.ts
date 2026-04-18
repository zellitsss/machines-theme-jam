import {GameObj} from "kaplay";
import {canIn, canOut, getOppositeSide, getPosKey, getRotatedConnections} from "../utils";
import {wireDictionary} from "../wire-dictionary";
import {getNextConnectedCell} from "./grid";
import {WireState} from "../components/wireState";

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