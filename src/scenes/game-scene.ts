import {KAPLAYCtx} from 'kaplay';
import Grid from '../grid';
import {PipeDictionary} from '../pipe-dictionary';
import {LevelData} from "../LevelData";

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

        (levelData as LevelData).cells.forEach((cellDef) => {
            let x = cellDef.x;
            let y = cellDef.y;
            let sprite = PipeDictionary.get(cellDef.type)?.sprite;
            let cell = grid.at(x, y);
            cell.obj = k.add([
                k.pos((x + .5) * CELL_SIZE, (y + .5) * CELL_SIZE),
                k.sprite(sprite ? sprite : "", {
                    width: CELL_SIZE,
                    height: CELL_SIZE
                }),
                k.rotate(cellDef.rot ? cellDef.rot * 90 : 0),
                k.anchor("center")
            ]);
            cell.type = cellDef.type;
        });
    }
}