import {Comp} from "kaplay";
import {CellData} from "../types";

export interface WireState extends Comp {
    x: number;
    y: number;
    modifier: number;
    rot: number;
    type: string;
    rotateCW: () => void;
}

export const wireState = (cellData: CellData): WireState => (
    {
        id: "wireState",
        x: cellData.x,
        y: cellData.y,
        modifier: cellData.modifier,
        rot: cellData.rot ?? 0,
        type: cellData.type,
        rotateCW() {
            this.rot = ((this.rot + 1) % 4 + 4) % 4;
            this.trigger("rotationStepUpdated", this.rot);
        }
    }
);
