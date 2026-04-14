import { KAPLAYCtx } from 'kaplay';
import Grid from '../grid';
const GRID_COLS = 3;
const GRID_ROWS = 5
const CELL_SIZE = 128;
export default function createGameScene(k: KAPLAYCtx) {
    return () => {

        let grid = new Grid(GRID_COLS, GRID_ROWS);
        // Create grid
        for (let x = 0; x < GRID_COLS; x++) {
            for (let y = 0; y < GRID_ROWS; y++) {
                grid.at(x, y).pipe = {
                    obj: k.add([
                        // k.rect(CELL_SIZE, CELL_SIZE),
                        k.pos(x * CELL_SIZE, y * CELL_SIZE),
                        k.sprite("pipe-straight", {
                            width: CELL_SIZE,
                            height: CELL_SIZE
                        })
                    ]),
                    id: '',
                    type: ''
                }
            }
        }
    }
}