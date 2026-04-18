import {Comp} from "kaplay";
import {WireData} from "../types";

export interface WireState extends Comp {
    x: number;
    y: number;
    modifier: number;
    rot: number;
    type: string;
    rotateCW: () => void;
}

export const wireState = (wireData: WireData): WireState => (
    {
        id: "wireState",
        x: wireData.x,
        y: wireData.y,
        modifier: wireData.modifier,
        rot: wireData.rot ?? 0,
        type: wireData.type,
        rotateCW() {
            this.rot = ((this.rot + 1) % 4 + 4) % 4;
            this.trigger("rotationStepUpdated", this.rot);
        }
    }
);
