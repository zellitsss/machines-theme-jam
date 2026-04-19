import {Comp, KAPLAYCtx} from "kaplay";
import {
    DRAG_THRESHOLD,
    EVENT_WireClicked,
    EVENT_WireDraggingUpdate,
    EVENT_WireEndDragging,
    EVENT_WireStartDragging
} from "../constants";

export interface WireInteraction extends Comp {
}

export interface WireInteractionOpt {
    k: KAPLAYCtx
}

export const wireInteraction = (opt: WireInteractionOpt): WireInteraction => {

    let clickStartPos = opt.k.mousePos();
    let isClickRegistered = false;
    let isDragging = false;
    return {
        id: "wireInteraction",
        require: ["pos", "area"],
        update() {
            // Start clicking
            if (this.isHovering() && opt.k.isMousePressed("left")) {
                clickStartPos = opt.k.mousePos();
                isClickRegistered = true;
            }
            
            // Check for drag
            if (isClickRegistered && opt.k.mousePos().dist(clickStartPos) > DRAG_THRESHOLD) {
                isClickRegistered = false;
                isDragging = true;
                this.trigger(EVENT_WireStartDragging, this);
            }
            
            // Dragging update
            if (isDragging) {
                this.trigger(EVENT_WireDraggingUpdate, this);
            }

            // Trigger Clicked or End Dragging
            if (this.isHovering() && opt.k.isMouseReleased("left")) {
                if (isClickRegistered)
                {
                    isClickRegistered = false;
                    this.trigger(EVENT_WireClicked, this);
                } else if (isDragging) {
                    isDragging = false;
                    this.trigger(EVENT_WireEndDragging, this);
                }
            }
            
            // Safe reset
            if (opt.k.isMouseReleased("left")) {
                isClickRegistered = false;
                isDragging = false;
            }
        }
    }
}
