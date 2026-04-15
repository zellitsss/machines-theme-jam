import { KAPLAYCtx } from "kaplay";

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";

export function setupLayers(k: KAPLAYCtx): void {
    k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI], LAYER_GAME);
}