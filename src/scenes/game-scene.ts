import { KAPLAYCtx } from 'kaplay';
const GRID_WIDTH = 3;
const GRID_HEIGHT = 5
const CELL_SIZE = 64;
export default function createGameScene(k: KAPLAYCtx) {
    return () => {
        // Create grid
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                k.add([
                    // k.rect(CELL_SIZE, CELL_SIZE),
                    k.pos(x * CELL_SIZE, y * CELL_SIZE),
                    k.color(100, 100, 100),
                    k.outline(1),
                    k.sprite("pipe-straight", {
                        width: CELL_SIZE,
                        height: CELL_SIZE
                    })
                ]);
            }
        }
    }
}