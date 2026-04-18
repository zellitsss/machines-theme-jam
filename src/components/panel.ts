import {Comp} from "kaplay";

export interface PanelComp extends Comp {
    width: number;
    height: number;
}

export function panel(width: number, height: number): PanelComp {

    return {
        id: "panel",
        require: ["pos", "anchor"],
        width,
        height
    };
}