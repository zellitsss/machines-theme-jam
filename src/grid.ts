import {Cell, CellFactory} from './cell';
import {TRAVEL_OFFSET} from "./types";
import {GameObj} from "kaplay";

export default class Grid {
    private _cols: number;
    private _rows: number;
    private _cellSize: number;
    private _matrix: Cell[][] = [];
    private _startCell: Cell;
    private _endCell: Cell;
    private _parent: GameObj;

    constructor(parent: GameObj, cols: number, rows: number, cellSize: number) {
        this._parent = parent;
        this._cols = cols;
        this._rows = rows;
        this._cellSize = cellSize;
        if (cols > 0 && rows > 0) {
            this._matrix = Array.from({ length: rows }, (_, y) =>
                Array.from({ length: cols }, (_, x) => CellFactory.Freedom(x, y))
            );
        }
    }

    getNextConnectedCell(currentCell: Cell, side: number): Cell | null {
        const offset = TRAVEL_OFFSET[side];
        const nextX = currentCell.x + offset.x;
        const nextY = currentCell.y + offset.y;
        if (nextX >= 0 && nextX < this.getCols() && nextY >= 0 && nextY < this.getRows())
        {
            return this.at(nextX, nextY);
        }
        return null;
    }

    cellAtWorld(worldX: number, worldY: number): Cell | null {
        const gx = Math.floor((worldX - this._parent.pos.x) / this._cellSize);
        const gy = Math.floor((worldY - this._parent.pos.y) / this._cellSize);
        if (gx < 0 || gy < 0 || gx >= this._cols || gy >= this._rows) {
            return null;
        }
        return this.at(gx, gy);
    }

    getCols(): number {
        return this._cols;
    }

    getRows(): number {
        return this._rows;
    }

    at(x: number, y: number): Cell {
        return this._matrix[y][x];
    }
    
    setStartCell(cell: Cell) {
        this._startCell = cell;
    }
    
    setEndCell(cell:Cell) {
        this._endCell = cell;
    }
    
    getStartCell(): Cell {
        return this._startCell;
    }
    
    getEndCell(): Cell {
        return this._endCell;   
    }
}