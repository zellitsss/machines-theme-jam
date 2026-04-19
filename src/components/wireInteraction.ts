import {Comp, KAPLAYCtx} from "kaplay";
import {EVENT_WireClicked} from "../constants";

export interface WireInteraction extends Comp {
}

export interface WireInteractionOpt {
    k: KAPLAYCtx
}

export const wireInteraction = (opt: WireInteractionOpt): WireInteraction => {

    let clickStartPos = opt.k.mousePos();
    let isClickRegistered = false;
    return {
        id: "wireInteraction",
        require: ["pos", "area"],

        // add() {
        //     this.onClick(() => {
        //         this.trigger("wireClicked", this);
        //     });
        // },

        update() {
            if (this.isHovering() && opt.k.isMousePressed("left")) {
                clickStartPos = opt.k.mousePos();
                isClickRegistered = true;
            }

            if (this.isHovering() && opt.k.isMouseReleased("left") && isClickRegistered) {
                isClickRegistered = false;
                this.trigger(EVENT_WireClicked, this);
            }
            
            if (opt.k.isMouseReleased("left")) {
                isClickRegistered = false;
            }
        }
    }
}
