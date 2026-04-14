import { KAPLAYCtx } from 'kaplay';
import Grid from '../grid';
import { PipeDictionary } from '../pipe-dictionary';
const GRID_COLS = 3;
const GRID_ROWS = 5
const CELL_SIZE = 128;

function initializePipeDictionary() {
    PipeDictionary.add('pipe-straight', {
        sprite: 'pipe-straight'
    });
    PipeDictionary.add('pipe-l', {
        sprite: 'pipe-l'
    });
    PipeDictionary.add('pipe-gate', {
        sprite: 'pipe-gate'
    });
}

export default function createGameScene(k: KAPLAYCtx) {
    return async () => {
        // Load Level data
        const levelData = await k.loadJSON("levelData", "data/level-01.json");
        console.log(levelData);

        initializePipeDictionary();

        // Create grid
        let grid = new Grid(GRID_COLS, GRID_ROWS);
        for (let x = 0; x < GRID_ROWS; x++) {
            for (let y = 0; y < GRID_COLS; y++) {
                // TODO: may be we could fill with the background or whatever
            }
        }

        levelData.cells.forEach((cellDef: any) => {
            let x = cellDef.x;
            let y = cellDef.y;
            let sprite = PipeDictionary.get(cellDef.pipe)?.sprite;
            console.log(cellDef)
            console.log(sprite)
            obj: k.add([
                // k.rect(CELL_SIZE, CELL_SIZE),
                k.pos((x + .5) * CELL_SIZE, (y + .5) * CELL_SIZE),
                k.sprite(sprite ? sprite : "", {
                    width: CELL_SIZE,
                    height: CELL_SIZE
                }),
                k.rotate(cellDef.rot ? cellDef.rot * 90 : 0),
                k.anchor("center")
            ])
        });
    }
}