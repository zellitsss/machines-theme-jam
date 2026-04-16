import { GameObj, KAPLAYCtx } from "kaplay";


export function drag(k: KAPLAYCtx) {
    let currentDragging: GameObj | null = null;
    let offset = k.vec2(0, 0);

    return {
        id: "drag",
        require: ["pos", "area"],
        pick() {
            currentDragging = this;
            offset = k.mousePos().sub(this.pos);
        },
        release() {
            currentDragging = null;
        },
        isDragging() {
            return currentDragging !== null;
        },
        update() {
            if (currentDragging) {
                this.pos = k.mousePos().sub(offset);
            }
        },
    }
}