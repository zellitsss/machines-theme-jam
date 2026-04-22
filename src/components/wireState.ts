import {Comp} from "kaplay";
import {WireData} from "../types";
import { audio } from "../core/audio";

export interface WireState extends Comp {
    wireData: WireData;
    rotateCW: () => void;
}

export const wireState = (inWireData: WireData): WireState => (
    {
        id: "wireState",
        wireData: {
            x: inWireData.x ?? -1,
            y: inWireData.y ?? -1,
            modifier: inWireData.modifier ?? 0,
            rot: inWireData.rot ?? 0,
            type: inWireData.type
        },
        rotateCW() {
            audio.playSfx("sfx-rotate");
            this.wireData.rot = ((this.wireData.rot + 1) % 4 + 4) % 4;
            this.trigger("rotationStepUpdated", this.wireData.rot);
        }
    }
);
