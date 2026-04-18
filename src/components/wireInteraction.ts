import {Comp} from "kaplay";

export interface WireInteraction extends Comp {
    
}

export const wireInteraction = (): WireInteraction => ({
    id: "wireInteraction",
    require: ["pos", "area"],
    
    add() {
        this.onClick(() => {
            this.trigger("wireClicked", this);
        })
    }
});