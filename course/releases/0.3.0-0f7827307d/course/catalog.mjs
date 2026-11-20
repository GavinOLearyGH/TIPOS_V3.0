import {hole1} from './holes/hole-1.mjs';
import {hole2} from './holes/hole-2.mjs';
export const courseCatalog=[hole1,hole2];
export function holeByNumber(number){return courseCatalog.find(hole=>hole.number===Number(number));}
