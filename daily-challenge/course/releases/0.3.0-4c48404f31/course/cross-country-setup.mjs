import {buildId} from '../core/build-info.mjs';
import {gameLinks} from '../core/navigation.mjs';

const $=id=>document.getElementById(id);
const links=gameLinks(location.href);
$('daily-home').href=links.home+'?build='+buildId;
$('practice-home').href=links.practice+'?build='+buildId;
$('build-version').textContent='Build '+buildId;
$('play-open').href=links.player+'?'+new URLSearchParams({cross:'open',build:buildId});
