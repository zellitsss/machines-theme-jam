import {Comp} from "kaplay";

export interface FixedRotation extends Comp {
}
export const fixedRotation = (): FixedRotation => {
    return {
        id: "fixedRotation",
        update() {
            if (this.parent) {
                this.angle = -this.parent.angle;
            }
        }
    }
};