import {hole6} from './holes/hole-6.mjs';
import {hole1} from './holes/hole-1.mjs';
import {hole2} from './holes/hole-2.mjs';
import {hole3} from './holes/hole-3.mjs';
export const courseCatalog=[hole1,hole2,hole3];
export const playableHoles=[...courseCatalog,hole6];
export function holeByNumber(number){return playableHoles.find(hole=>hole.number===Number(number));}
