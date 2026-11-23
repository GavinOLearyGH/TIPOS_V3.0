import {hole1,metresPerPlanUnit as k} from '../holes/hole-1.mjs';
import {createCourse} from '../../core/course.mjs';
import {createRound,fullBag} from '../../core/round.mjs';
import {clubs,windDirections,windVector} from '../../core/physics.mjs';
const $=id=>document.getElementById(id),svg=$('map');
const course=createCourse(hole1),ns='http://www.w3.org/2000/svg';
const yards=metres=>Math.round(metres/.9144);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const colors={tee:'#8bac70',fairway:'#88aa5d',surround:'#71934f',green:'#a7bf70',sand:'#dfc996'};
function node(tag,attrs,parent=svg,text){
    const el=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
    if(text!==undefined)el.textContent=text;
    parent.append(el);
    return el;
}
function options(id,items){
    for(const [value,name] of items)$(id).add(new Option(name,value));
}
options('tee',course.tees.map(t=>[t.id,t.name+' · '+t.yards+' yd']));
options('club',fullBag.map(name=>[name,name+(clubs[name].carry?' · '+clubs[name].carry+' yd carry':'')]));
options('wind',windDirections.map((name,i)=>[i,name]));
let round,aim,flight=false,trail=[];
function start(){
    round=createRound(course,{tee:$('tee').value});
    aim={...round.settings.pin};trail=[];
    $('shot-log').replaceChildren();
    $('round-result').textContent='';
    $('club').value='Driver';
    draw();
}
function draw(){
    svg.replaceChildren();
    node('rect',{x:120,y:320,width:1530,height:360,fill:'#4c703d'});
    node('path',{d:'M120 320L1650 380',stroke:'#73776d','stroke-width':12});
    node('path',{d:'M148 354L296 350L287 441L167 446Z',fill:'#777869'});
    node('text',{x:168,y:408,'font-size':15},svg,'Clubhouse');
    for(const [kind,path] of Object.entries(course.shapes))node('path',{d:path,fill:colors[kind],stroke:'#d0dcb2','stroke-width':1});
    for(const d of course.paths)node('path',{d,fill:'none',stroke:'#96978a','stroke-width':7});
    const p=course.pews;
    for(let i=0;i<p.count;i++)node('path',{d:`M${p.x+i*p.spacing} ${p.z-p.length/2}L${p.x+i*p.spacing} ${p.z+p.length/2}`,stroke:'#7f8c48','stroke-width':p.width*1.4,'stroke-linecap':'round'});
    node('path',{d:course.outOfBounds,fill:'none',stroke:'#f8e6ba','stroke-width':3,'stroke-dasharray':'10 8'});
    for(const [x,z,text] of [[620,343,'LEFT · ROAD / OUT OF BOUNDS'],[760,646,'RIGHT · CHURCH PEWS / HOLE 8'],[560,440,'Fairway'],[968,355,'Fairway bunker'],[1550,508,'Green']]){
        node('text',{x,y:z,'font-size':14},svg,text);
    }
    for(const tee of course.tees){
        node('circle',{cx:tee.x/k,cy:tee.z/k,r:5,fill:tee.id===$('tee').value?'#ffe393':'#d8e0d2'});
    }
    const pin=round.settings.pin,ball=round.state.ball,from=course.tees.find(t=>t.id===$('tee').value);
    for(const [d,label] of [[100,'100 yd'],[200,'200 yd'],[300,'300 yd']]){
        const x=(from.x+d*.9144)/k;
        node('path',{d:`M${x} 410L${x} 530`,stroke:'#ffffff40','stroke-width':1,'stroke-dasharray':'4 6'});
        node('text',{x:x+5,y:610,'font-size':13},svg,label);
    }
    node('circle',{cx:pin.x/k,cy:pin.z/k,r:5,fill:'#f4d789'});
    node('path',{d:`M${pin.x/k} ${pin.z/k}v-26l17 8l-17 6`,fill:'#fa864d',stroke:'#fff','stroke-width':1});
    if(trail.length)node('polyline',{points:trail.map(p=>p.x/k+','+p.z/k).join(' '),fill:'none',stroke:'#ffdf8e','stroke-width':2.5});
    if($('view').value==='shots')node('path',{d:`M${ball.x/k} ${ball.z/k}L${aim.x/k} ${aim.z/k}`,stroke:'#fff6ba','stroke-width':2,'stroke-dasharray':'7 5'});
    node('circle',{cx:ball.x/k,cy:ball.z/k,r:5,fill:'white',stroke:'#1c3023','stroke-width':2});
    $('readout').textContent=`${from.name} · ${yards(distance(from,pin))} yd to center · Ball on ${course.surface(ball.x,ball.z)} · ${yards(distance(ball,pin))} yd to pin · ${round.state.strokes} strokes`;
    const fairwayBunker={x:998*k,z:400*k};
    $('readout').textContent+=` · Fairway bunker center ≈ ${yards(distance(from,fairwayBunker))} yd from tee`;
}
svg.addEventListener('pointerdown',event=>{
    if(flight||$('view').value!=='shots')return;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    aim={x:point.x*k,z:point.y*k};draw();
});
$('view').onchange=()=>{$('shot-controls').hidden=$('view').value!=='shots';draw();};
$('power').oninput=()=>{$('power-text').value=$('power').value+'%';};
$('tee').onchange=$('reset').onclick=start;
$('hit').onclick=()=>{
    if(flight||round.state.complete)return;
    const ball=round.state.ball;
    round.settings.wind=windVector(Number($('wind').value),Number($('wind-speed').value));
    if(!round.hit($('club').value,Number($('power').value)/100,Math.atan2(aim.z-ball.z,aim.x-ball.x)))return;
    flight=true;trail=[{...ball}];
    for(const id of ['hit','tee','reset','wind','wind-speed','club'])$(id).disabled=true;
    function animate(){
        for(let i=0;i<80&&['air','roll','drop'].includes(round.state.ball.mode);i++)round.step();
        trail.push({...round.state.ball});draw();
        if(['air','roll','drop'].includes(round.state.ball.mode)){requestAnimationFrame(animate);return;}
        flight=false;
        for(const id of ['hit','tee','reset','wind','wind-speed','club'])$(id).disabled=false;
        const latest=round.state.history.at(-1),item=document.createElement('li');
        item.textContent=`Shot ${round.state.history.length} · ${latest.outcome} · ${yards(distance(latest.from,latest.to))} yd`;
        $('shot-log').append(item);
        $('round-result').textContent=round.state.complete?`Holed · ${round.state.strokes} strokes · ${round.state.strokes-course.par>=0?'+':''}${round.state.strokes-course.par} to par`:
            ['out','water'].includes(latest.outcome)?'One penalty stroke · Replay from the previous position.':'';
        aim={...round.settings.pin};
        const lie=course.surface(round.state.ball.x,round.state.ball.z),remaining=distance(round.state.ball,aim)/.9144;
        $('club').value=lie==='green'?'Putter':lie==='sand'?'SW':
            [...fullBag].reverse().find(name=>clubs[name].carry>=remaining)||'Driver';
        draw();
    }
    requestAnimationFrame(animate);
};
start();
