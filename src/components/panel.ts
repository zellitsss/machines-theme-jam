import {Comp} from "kaplay";

export interface PanelComp extends Comp {
    panelWidth: number;
    panelHeight: number;
}

export function panel(width: number, height: number): PanelComp {

    return {
        id: "panel",
        require: ["pos", "anchor"],
        panelWidth: width,
        panelHeight: height,
    };
}