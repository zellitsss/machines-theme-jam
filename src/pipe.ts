import { GameObj } from 'kaplay';

export interface Pipe {
    id: string;
    type: string; // could be enum
    obj: GameObj;
}