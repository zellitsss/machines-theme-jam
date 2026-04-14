import {Cell, CellFactory} from './cell';

export default class Grid {
    private matrix: Cell[][] = [];

    constructor(cols: number, rows: number) {
        if (cols > 0 && rows > 0) {
            this.matrix = Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => CellFactory.Freedom()));
        }
    }

    at(x: number, y: number): Cell {
        return this.matrix[y][x];
    }
}