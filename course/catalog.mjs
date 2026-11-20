import {hole1} from './holes/hole-1.mjs';
export const courseCatalog=[hole1];
export function holeByNumber(number){return courseCatalog.find(hole=>hole.number===Number(number));}
