import {CellConnections} from "./types";

export interface PipeDef {
    sprite: string;
    // [Top, Right, Bottom, Left]
    flow: CellConnections;
}
export const PipeDictionary = {
    _definitions: new Map<string, PipeDef>(),

    add(type: string, pipeDef: PipeDef) {
        if (!this._definitions.has(type)) {
            this._definitions.set(type, pipeDef);
        }
    },

    get(type: string): PipeDef | undefined {
        return this._definitions.get(type);
    },

    has(type: string): boolean {
        return this._definitions.has(type);
    }
}