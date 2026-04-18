import {Comp} from "kaplay";
import {CellData} from "../types";

export interface WireState extends Comp {
    x: number;
    y: number;
    modifier: number;
    rot: number;
    type: string;
    updateRotation: (value: number) => void;
}

export const wireState = (cellData: CellData): WireState => (
    {
        id: "wireState",
        x: cellData.x,
        y: cellData.y,
        modifier: cellData.modifier,
        rot: cellData.rot,
        type: cellData.type,
        updateRotation(value: number) {
            this.rot = (value % 4 + 4) % 4;
            this.trigger("rotationStepUpdated", this.rot);
        }
    }
);
