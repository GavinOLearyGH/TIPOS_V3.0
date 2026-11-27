import {hole6} from './holes/hole-6.mjs';
import {hole1} from './holes/hole-1.mjs';
import {hole2} from './holes/hole-2.mjs';
import {hole3} from './holes/hole-3.mjs';
import {hole4} from './holes/hole-4.mjs';
import {hole5} from './holes/hole-5.mjs';
import {hole7} from './holes/hole-7.mjs';
import {hole8} from './holes/hole-8.mjs';
import {hole9} from './holes/hole-9.mjs';

export const courseCatalog=[hole1,hole2,hole3];
export const playableHoles=[...courseCatalog,hole4,hole5,hole6,hole7,hole8,hole9];
export function holeByNumber(number){return playableHoles.find(hole=>hole.number===Number(number));}
