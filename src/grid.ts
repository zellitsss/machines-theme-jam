import {Cell, CellFactory} from './cell';

export default class Grid {
    private _matrix: Cell[][] = [];
    private _startCell: Cell;
    private _endCell: Cell;
    
    constructor(cols: number, rows: number) {
        if (cols > 0 && rows > 0) {
            this._matrix = Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => CellFactory.Freedom()));
        }
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