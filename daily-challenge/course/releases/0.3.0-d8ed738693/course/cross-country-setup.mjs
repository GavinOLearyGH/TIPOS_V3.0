import {buildId} from '../core/build-info.mjs';
import {gameLinks} from '../core/navigation.mjs';
import {drawShotMap} from '../core/shot-hud.mjs';
import {roundTee} from '../core/series.mjs';
import {makeAtlas} from '../core/renderer.mjs';
import {playableHoles,holeByNumber} from './catalog.mjs';
import {createConnectedCourse,makeConnectedView} from './connected-view.mjs';
import {crossCountrySelection,crossCountryMapPoints} from './cross-country.mjs';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const links=gameLinks(location.href);
$('daily-home').href=links.home+'?build='+buildId;
$('practice-home').href=links.practice+'?build='+buildId;
$('build-version').textContent='Build '+buildId;
const from=$('starting-hole'),box=$('tee-box'),green=$('target-green'),map=$('route-map');
for(const hole of playableHoles){
    from.add(new Option('Hole '+hole.number,hole.number));
    green.add(new Option('Hole '+hole.number,hole.number));
}
from.value=String(holeByNumber(params.get('from'))?.number??1);
green.value=String(holeByNumber(params.get('green'))?.number??8);

const course=createConnectedCourse(1),view=makeConnectedView(course),atlas=makeAtlas(course,view);
const bounds=view.bounds;
map.height=Math.round(map.width*(bounds.maxX-bounds.minX)/(bounds.maxZ-bounds.minZ));
function update(){
    const route=crossCountrySelection(from.value,box.value,green.value);
    $('route-estimate').textContent=route.yards+' yd · Estimated par '+route.par;
    $('play-route').href=links.player+'?'+new URLSearchParams({cross:1,from:route.from,tee:route.tee.id,green:route.to,build:buildId});
    const {tee,pin}=crossCountryMapPoints(view,route);
    map.setAttribute('aria-label','Course map. '+route.name+'.');
    drawShotMap(map,atlas,course,{ball:tee,targets:[{...pin,radius:8}]});
}
function updateTees(preferred){
    const hole=holeByNumber(from.value),teeId=roundTee(preferred,hole.number);
    box.replaceChildren(...hole.tees.map(tee=>new Option(tee.name,tee.id)));
    box.value=hole.tees.find(tee=>tee.id===teeId)?.id??roundTee('rawlins',hole.number);
    if(!box.value)box.value=hole.tees[0].id;
    update();
}
from.onchange=()=>updateTees(box.value);
box.onchange=green.onchange=update;
updateTees(params.get('tee')??'rawlins');
