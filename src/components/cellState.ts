import {CellData} from "../types";
import {Comp} from "kaplay";

export interface CellState extends Comp {
    cellData: CellData;
}

export function cellState(cellData: CellData): CellState {
    return {
        id: "cellState",
        cellData
    };
}