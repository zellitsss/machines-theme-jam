import {CellConnections} from "./types";

export interface wireDef {
    sprite: string;
    // [Top, Right, Bottom, Left]
    flow: CellConnections;
}
export const wireDictionary = {
    _definitions: new Map<string, wireDef>(),

    add(type: string, wireDef: wireDef) {
        if (!this._definitions.has(type)) {
            this._definitions.set(type, wireDef);
        }
    },

    get(type: string): wireDef | undefined {
        return this._definitions.get(type);
    },

    has(type: string): boolean {
        return this._definitions.has(type);
    }
}