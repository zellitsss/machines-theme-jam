import {WireDefinition} from "./types";

export const wireDictionary = {
    _definitions: new Map<string, WireDefinition>(),

    add(type: string, wireDef: WireDefinition) {
        if (!this._definitions.has(type)) {
            this._definitions.set(type, wireDef);
        }
    },

    get(type: string): WireDefinition | undefined {
        return this._definitions.get(type);
    },

    has(type: string): boolean {
        return this._definitions.has(type);
    }
}