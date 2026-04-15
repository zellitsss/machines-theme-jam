export interface PipeDef {
    sprite: string;
    // [Top, Right, Bottom, Left]
    // 0: No connection, 1: Inlet, 2: Outlet, 3: Both
    flow: [number, number, number, number]
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