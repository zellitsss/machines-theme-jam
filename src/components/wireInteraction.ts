import {Comp} from "kaplay";
import {
    DRAG_THRESHOLD,
    EVENT_WireClicked,
    EVENT_WireDraggingUpdate,
    EVENT_WireEndDragging,
    EVENT_WireStartDragging, k
} from "../constants";

export interface WireInteraction extends Comp {
}

export interface WireInteractionOpt {
}

export const wireInteraction = (opt: WireInteractionOpt = {}): WireInteraction => {

    let clickStartPos = k.mousePos();
    let isClickRegistered = false;
    let isDragging = false;
    return {
        id: "wireInteraction",
        require: ["pos", "area"],
        update() {
            // Start clicking
            if (this.isHovering() && k.isMousePressed("left")) {
                clickStartPos = k.mousePos();
                isClickRegistered = true;
            }

            // Check for drag
            if (isClickRegistered && k.mousePos().dist(clickStartPos) > DRAG_THRESHOLD) {
                isClickRegistered = false;
                isDragging = true;
                this.trigger(EVENT_WireStartDragging, this);
            }

            // Dragging update
            if (isDragging) {
                this.trigger(EVENT_WireDraggingUpdate, this);
            }

            // Trigger Clicked or End Dragging
            if (k.isMouseReleased("left")) {
                if (this.isHovering() && isClickRegistered)
                {
                    isClickRegistered = false;
                    this.trigger(EVENT_WireClicked, this);
                } else if (isDragging) {
                    isDragging = false;
                    this.trigger(EVENT_WireEndDragging, this);
                }
            }
        }
    }
}
