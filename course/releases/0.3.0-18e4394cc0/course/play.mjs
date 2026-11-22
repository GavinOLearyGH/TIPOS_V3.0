import {randomWind} from '../core/wind-setup.mjs';
import {executionWindow,strikePosition} from '../core/execution.mjs';
import {newSeries,recordHole,seriesScore,setupKey} from '../core/series.mjs';
import {refreshParentWorker} from '../core/updates.mjs';
import {buildId} from '../core/build-info.mjs';
import {dragPower,dragHeading,shotCamera,pullGuideGeometry} from '../core/controls.mjs';
import {holeByNumber,courseCatalog} from './catalog.mjs';
import {createCourse} from '../core/course.mjs';
import {createRound,fullBag} from '../core/round.mjs';
import {createRenderer,makeAtlas} from '../core/renderer.mjs';
import {clubs,ballRadius,stepTime,clamp,mix,ease,windDirections,estimatePutt} from '../core/physics.mjs';

const $=id=>document.getElementById(id);
const requested=new URLSearchParams(location.search),definition=holeByNumber(requested.get('hole')||1);
if(!definition)throw Error('This hole is not available yet.');
const course=createCourse(definition),canvas=$('scene'),minimap=$('map'),stage=$('stage');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const yards=metres=>Math.round(metres/.9144);
const feet=metres=>(metres/.3048).toFixed(1);
const bearing=(a,b)=>Math.atan2(b.z-a.z,b.x-a.x);
const resting=ball=>!['air','roll','drop'].includes(ball.mode);
const lieNames={tee:'Tee box',fairway:'Fairway',rough:'Rough',green:'Green',surround:'Green surround',sand:'Bunker',path:'Cart path'};
function options(id,items){for(const [value,label] of items)$(id).add(new Option(label,value));}
options('hole',courseCatalog.map(hole=>[hole.number,'Hole '+hole.number+' · Par '+hole.par]));
$('hole').value=String(course.number);
options('tee',course.tees.map(tee=>[tee.id,tee.name+' · '+tee.yards+' yd']));
options('club',fullBag.map(name=>[name,name+(clubs[name].carry?' · '+clubs[name].carry+' yd':'')]));
options('wind',['Toward Hole 1 green','Hole 1 green / right','Across Hole 1 right','Hole 1 tee / right','Toward Hole 1 tee','Hole 1 tee / left','Across Hole 1 left','Hole 1 green / left'].map((name,index)=>[index,name]));
if(course.tees.some(tee=>tee.id===requested.get('tee')))$('tee').value=requested.get('tee');
$('hole-title').textContent=course.name;
$('about-copy').textContent=course.about??'Tee names and yardages are confirmed. Terrain, bunker depths, tree positions and green breaks are provisional. All holes share one engine and renderer.';
if(!requested.has('wind')&&!requested.has('mph')){const wind=randomWind();$('wind').value=wind.wind;$('wind-speed').value=wind.mph;}
for(const [key,id,allowed] of [['wind','wind',null],['mph','wind-speed',null],['speed','green-speed',['.8','1','1.24']]]){
    const value=requested.get(key);if(value!==null&&(!allowed||allowed.includes(value)))$(id).value=value;
}
$('replay').textContent='Replay Hole '+course.number;
document.title='The Irish Par · '+course.name;
$('build-version').textContent='Build '+buildId;
refreshParentWorker();

const atlas=makeAtlas(course);
let renderer,round,heading=0,charge=0,drag=null,keyStarted=null,trail=[],mapTrail=[];
let eye,target,lastTime=0,accumulator=0,lastTrail=0,tour=null,preview=null,animationId,frameNumber=0,showGreenGrid=true;
const active=()=>round&&!resting(round.state.ball);
const editable=()=>renderer&&round&&!active()&&!tour&&!round.state.complete&&!$('complete').open;

let strikeStarted=null,series=null;
try{series=JSON.parse(sessionStorage.getItem('irish-par-series-'+requested.get('series')));}
catch{}
if(series&&(!series.setup||!Array.isArray(series.results)||!requested.get('series')||series.id!==requested.get('series')))series=null;
if(series){
    if(series.results.length<course.number-1){location.replace(holeURL(series.results.length+1));}
    for(const [key,id] of [['tee','tee'],['wind','wind'],['mph','wind-speed'],['speed','green-speed']])$(id).value=series.setup[key];
    $('series-status').hidden=false;
}
function saveSeries(){try{sessionStorage.setItem('irish-par-series-'+series.id,JSON.stringify(series));}catch{}}
function showSeries(){
    if(!series)return;
    const score=seriesScore(series),running=score.total+(series.results.some(row=>row.hole===course.number)?0:(round?.state.strokes??0));$('series-status').textContent='Play 3 · Par 12 · Hole '+course.number+' of 3 · '+running+' strokes';
    for(const id of ['hole','tee','wind','wind-speed','green-speed','apply'])$(id).disabled=true;
}
function drawStrike(now){
    const show=editable()&&strikeStarted!==null&&$('club').value!=='Putter';
    $('strike-panel').hidden=!show;if(!show)return;
    const ball=round.state.ball,lie=course.lieAt?.(ball.x,ball.z)?.id??course.surface(ball.x,ball.z);
    $('strike-zone').style.width=(executionWindow($('club').value,charge,lie)*100)+'%';
    $('strike-marker').style.left=((strikePosition(now-strikeStarted)+1)*50)+'%';
}
function replaySeries(random=false){
    const id=String(Date.now()),setup={...series.setup};
    if(random)Object.assign(setup,randomWind());
    const fresh=newSeries(id,setup);try{sessionStorage.setItem('irish-par-series-'+id,JSON.stringify(fresh));}catch{return;}
    location.href='./play.html?'+new URLSearchParams({hole:1,series:id,...setup,build:buildId});
}
$('series-replay').onclick=()=>replaySeries();$('series-new').onclick=()=>replaySeries(true);

function suggestClub(){
    const ball=round.state.ball,lie=course.surface(ball.x,ball.z),carry=distance(ball,round.settings.pin)/.9144-4;
    $('club').value=lie==='green'?'Putter':lie==='sand'?'SW':
        [...fullBag].reverse().find(name=>clubs[name].carry>=carry)||'Driver';
}
function updateHUD(){
    if(!round)return;
    const ball=round.state.ball,pin=round.settings.pin,metres=distance(ball,pin);
    $('distance').textContent='Pin · '+(metres<27?feet(metres)+' ft':yards(metres)+' yd');
    const profile=course.lieAt?.(ball.x,ball.z);
    $('lie').textContent=profile?profile.featureName+' · '+profile.label:lieNames[course.surface(ball.x,ball.z)]||ball.mode;
    $('score-label').textContent=round.state.strokes+' '+(round.state.strokes===1?'stroke':'strokes')+
        (round.state.penalties?' · '+round.state.penalties+' penalty':'')+' · Par '+course.par;
    const wind=round.settings.wind,speed=Math.hypot(wind.x,wind.z)/.44704;
    const relative=Math.atan2(wind.z,wind.x)-heading;
    const labels=['tailwind','tail/right','left to right','head/right','headwind','head/left','right to left','tail/left'];
    $('wind-label').textContent=speed<.01?'Calm':['↑','↗','→','↘','↓','↙','←','↖'][(Math.round(relative/(Math.PI/4))+8)%8]+' '+Math.round(speed)+' mph · '+labels[(Math.round(relative/(Math.PI/4))+8)%8];
    const putting=$('club').value==='Putter',onGreen=course.surface(ball.x,ball.z)==='green';
    $('slope').hidden=!putting||!onGreen||active()||!!tour;
    if(putting&&onGreen){
        const sample=.1;
        const rise=(course.ground(ball.x+Math.cos(heading)*sample,ball.z+Math.sin(heading)*sample)-course.ground(ball.x,ball.z))/sample;
        const across=(course.ground(ball.x-Math.sin(heading)*sample,ball.z+Math.cos(heading)*sample)-course.ground(ball.x,ball.z))/sample;
        $('slope').textContent=Math.abs(rise*100).toFixed(1)+'% '+(rise>=0?'uphill':'downhill')+
            (Math.abs(across)<.002?' · little side break':across>0?' · breaks left':' · breaks right');
    }
    $('green-grid').hidden=!(editable()&&$('club').value==='Putter'&&course.surface(ball.x,ball.z)==='green');
    $('green-grid').setAttribute('aria-pressed',String(showGreenGrid));
    const locked=active()||!!tour;
    for(const id of ['club','reset','hole','tee','wind','wind-speed','green-speed','apply'])$(id).disabled=locked||!renderer;
    $('club').disabled=locked||round.state.complete||!renderer;
    $('reload-build').disabled=active();
    $('flyover').disabled=active()||!renderer||$('complete').open;
    $('flyover').textContent=tour?'Skip flyover':'Flyover';
    showSeries();
}
function updatePower(){
    $('power').value=charge*100;
    if($('club').value!=='Putter'||!editable()){
        $('power-label').textContent='Power · '+Math.round(charge*100)+'%';return;
    }
    const ball=round.state.ball;
    if(preview?.ball!==ball||preview.heading!==heading||preview.charge!==charge){
        preview={ball,heading,charge,...estimatePutt(ball,course,heading,charge,round.settings.greenSpeed)};
    }
    $('power-label').textContent=feet(distance(ball,round.settings.pin))+' ft to cup · '+Math.round(charge*100)+'%'+
        (charge>=.025?' · est. '+feet(preview.finish)+' ft roll':'');
}
function setPower(value){charge=Math.round(clamp(value,0,1)*2000)/2000;updatePower();}
function cancel(){
    drag=null;keyStarted=null;strikeStarted=null;$('strike-panel').hidden=true;setPower(0);
    $('ball-ring').classList.remove('grabbed');
    for(const id of ['pull-handle','pull-line','pull-aim'])$(id).hidden=true;
}
function startRound(){
    if(series){series={...series,results:series.results.filter(row=>row.hole<course.number)};saveSeries();}
    cancel();tour=null;$('fade').hidden=true;$('tour-label').hidden=true;
    if($('complete').open)$('complete').close();
    round=createRound(course,{tee:$('tee').value,windDirection:Number($('wind').value),
        windMph:clamp(Number($('wind-speed').value)||0,0,25),greenSpeed:Number($('green-speed').value)});
    const tee=course.tees.find(item=>item.id===$('tee').value);
    $('setup-label').textContent=tee.name+' · '+yards(distance(tee,round.settings.pin))+' yd · Center pin';
    heading=bearing(round.state.ball,course.aimTarget(round.state.ball));
    trail=[];mapTrail=[];eye=null;target=null;accumulator=0;preview=null;
    $('shot-summary').hidden=true;
    suggestClub();updatePower();updateHUD();drawMap();
    $('status').textContent='Ready. Pull back from the ball to play your tee shot.';
}
function shoot(){
    if(!editable()||charge<.025){cancel();return;}
    const position=strikeStarted===null?0:strikePosition(performance.now()-strikeStarted);
    const played=round.hit($('club').value,charge,heading,position);
    cancel();
    if(!played)return;
    trail=[];mapTrail=[{...round.state.ball}];lastTrail=0;accumulator=0;
    $('shot-summary').hidden=true;
    $('status').textContent='Ball in play.';
    updateHUD();
}
function finishShot(){
    const ball=round.state.ball,last=round.state.history.at(-1);
    const metrics=last.metrics,unit=metrics.total<10?.3048:.9144,suffix=unit===.3048?' ft':' yd';
    for(const [id,key] of [['shot-carry','carry'],['shot-roll','bounceRoll'],['shot-total','total']]){
        $(id).textContent=(metrics[key]/unit).toFixed(1)+suffix;
    }
    $('shot-summary-title').textContent='Shot '+round.state.history.length+' · '+metrics.club;
    $('shot-summary-detail').textContent=Math.round(metrics.power*100)+'% · '+metrics.contact+' · From '+(metrics.startingLieLabel??lieNames[metrics.startingLie])+
        (last.outcome==='out'?' · Out of bounds':last.outcome==='water'?' · Water':last.outcome==='holed'?' · Holed':'');
    $('shot-summary').hidden=false;
    heading=bearing(ball,course.aimTarget(ball));
    trail=[];eye=null;target=null;preview=null;
    if(round.state.complete){
        const relative=round.state.strokes-course.par;
        const score=relative===0?'Par':relative===-1?'Birdie':relative===-2?'Eagle':
            (relative>0?'+':'')+relative+' to par';
        $('complete-title').textContent=score;
        $('complete-detail').textContent=round.state.strokes+' strokes'+
            (round.state.penalties?' · '+round.state.penalties+' penalty strokes':'')+' · '+course.name;
        $('status').textContent='Holed out · '+score+'.';
        const next=courseCatalog.find(hole=>hole.number>course.number);
        $('next-hole').hidden=!next;if(next){$('next-hole').href=holeURL(next.number);$('next-hole').textContent='Play Hole '+next.number;}
        if(series){
            series=recordHole(series,course.number,round.state.strokes,round.state.penalties);saveSeries();
            const total=seriesScore(series),card=$('series-card');card.replaceChildren();
            const table=document.createElement('table');
            for(const row of [{hole:'Hole',strokes:'Strokes',penalties:'Penalties'},...series.results]){
                const tr=document.createElement('tr');for(const value of [row.hole,row.strokes,row.penalties]){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}table.append(tr);
            }card.append(table);
            if(total.complete){
                $('complete-title').textContent='Play 3 complete';
                $('complete-detail').textContent=total.total+' strokes · '+(total.relative===0?'Even par':(total.relative>0?'+':'')+total.relative)+' · Par 12';
                $('series-replay').hidden=$('series-new').hidden=false;
                try{const key='irish-par-best-'+setupKey(series.setup),best=Number(localStorage.getItem(key))||Infinity;
                    localStorage.setItem(key,String(Math.min(best,total.total)));
                    $('series-best').textContent='Best on this setup: '+Math.min(best,total.total)+' strokes';}catch{}
            }
        }
        $('complete').showModal();$('replay').focus();
    }else{
        const penalty=['out','water'].includes(last.outcome);
        $('status').textContent=penalty?(last.outcome==='out'?'Out of bounds':'Water')+' · One penalty stroke. Replay from the previous position.':
            (ball.obstacle?'Hit '+ball.obstacle+'. ':'')+
            (distance(ball,round.settings.pin)<27?feet(distance(ball,round.settings.pin))+' ft':yards(distance(ball,round.settings.pin))+' yd')+
            ' to the cup · '+(course.lieAt?.(ball.x,ball.z)?.label??lieNames[course.surface(ball.x,ball.z)])+'.';
        suggestClub();
    }
    updateHUD();updatePower();drawMap();
}
function pointOnMap(point){
    const b=course.bounds;
    return {x:12+(point.z-b.minZ)/(b.maxZ-b.minZ)*(minimap.width-24),
        y:12+(1-(point.x-b.minX)/(b.maxX-b.minX))*(minimap.height-24)};
}
function drawMap(){
    if(!round)return;
    const c=minimap.getContext('2d'),b=course.bounds;
    c.clearRect(0,0,minimap.width,minimap.height);
    c.save();
    c.translate(12,minimap.height-12);
    c.transform(0,-(minimap.height-24)/atlas.width,(minimap.width-24)/atlas.height,0,0,0);
    c.drawImage(atlas,0,0);c.restore();
    if(mapTrail.length){
        c.strokeStyle='#ffe4a0';c.lineWidth=2.5;c.beginPath();
        mapTrail.forEach((point,index)=>{const p=pointOnMap(point);if(index)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});
        c.stroke();
    }
    const pin=pointOnMap(round.settings.pin),ball=pointOnMap(round.state.ball);
    c.fillStyle='#f3cc74';c.beginPath();c.arc(pin.x,pin.y,6,0,Math.PI*2);c.fill();
    if(editable()){
        const aim=pointOnMap({x:round.state.ball.x+Math.cos(heading)*28,z:round.state.ball.z+Math.sin(heading)*28});
        c.strokeStyle='#fff4b8';c.lineWidth=2;c.beginPath();c.moveTo(ball.x,ball.y);c.lineTo(aim.x,aim.y);c.stroke();
    }
    c.fillStyle='white';c.strokeStyle='#213322';c.lineWidth=2;c.beginPath();c.arc(ball.x,ball.y,5,0,Math.PI*2);c.fill();c.stroke();
}
function marker(id,point){
    const element=$(id);
    element.hidden=!point||point.x<4||point.x>canvas.clientWidth-4||point.y<4||point.y>canvas.clientHeight-4;
    if(!element.hidden){element.style.left=point.x+'px';element.style.top=point.y+'px';}
}
function cameraForBall(){
    const ball=round.state.ball,near=$('club').value==='Putter';
    return shotCamera(ball,course.ground,drag?drag.heading:heading,near,active()&&ball.time>.3&&ball.mode!=='drop');
}
function stopTour(){
    tour=null;$('fade').hidden=true;$('tour-label').hidden=true;
    updateHUD();updatePower();
}
$('flyover').onclick=()=>{
    if(tour){stopTour();return;}
    if(active()||drag||keyStarted!==null||!renderer)return;
    cancel();
    const tee=course.tees.find(t=>t.id===$('tee').value),pin=round.settings.pin;
    tour={start:null,tee,pin,distance:distance(tee,pin),heading:bearing(tee,pin)};
    $('fade').hidden=false;$('fade').style.opacity=0;
    updateHUD();
};
function tourView(now){
    tour.start??=now;
    const elapsed=(now-tour.start)/1000,arrival=6,departure=9;
    if(elapsed>=9.7){stopTour();return null;}
    const returning=elapsed>=9.35;
    $('fade').style.opacity=returning?1-ease((elapsed-9.35)/.35):ease((elapsed-departure)/.35);
    if(returning){$('tour-label').hidden=true;return {...cameraForBall(),greenGrid:false};}
    const u=ease(elapsed/arrival),dx=Math.cos(tour.heading),dz=Math.sin(tour.heading);
    const breadth=(course.green.readRadius??22)*2;
    const framing=breadth*Math.max(1,1.1/(canvas.clientWidth/canvas.clientHeight));
    const along=mix(-4,tour.distance-framing*.62,u);
    const x=tour.tee.x+dx*along,z=tour.tee.z+dz*along;
    const y=mix(course.ground(tour.tee.x,tour.tee.z)+1.55,course.ground(tour.pin.x,tour.pin.z)+framing*.85,u)+30*Math.sin(Math.PI*u);
    const targetDistance=Math.min(tour.distance,along+mix(24,framing*.62,u));
    const tx=tour.tee.x+dx*targetDistance,tz=tour.tee.z+dz*targetDistance;
    const greenGrid=elapsed>=arrival&&elapsed<departure;
    $('tour-label').hidden=!greenGrid;
    return {eye:[x,y,z],target:[tx,course.ground(tx,tz)+mix(-2,.1,u),tz],greenGrid,
        readOpacity:ease((elapsed-arrival)/.35)*ease((departure-elapsed)/.35)};
}
function pullGraphics(anchor){
    for(const id of ['pull-handle','pull-line','pull-aim'])$(id).hidden=true;
    if(!drag||!anchor)return;
    const ball=round.state.ball,near=$('club').value==='Putter';
    const distance=(near?12:36)*charge**.82;
    const ahead=renderer.project({x:ball.x+Math.cos(heading)*Math.max(1,distance),
        y:ball.y+.022,z:ball.z+Math.sin(heading)*Math.max(1,distance)});
    if(!ahead)return;
    const guide=pullGuideGeometry(anchor,ahead,drag.depth,canvas.clientWidth,canvas.clientHeight,distance);
    if(!guide)return;
    const {dx,dy,angle,forward,back}=guide;
    const position=(id,x,y,length)=>{
        const line=$(id);line.hidden=false;line.style.left=x+'px';line.style.top=y+'px';
        line.style.width=length+'px';line.style.transform='translateY(-50%) rotate('+angle+'rad)';
    };
    if(forward>=13)position('pull-aim',anchor.x+dx*10,anchor.y+dy*10,forward-10);
    if(back>=6)marker('pull-handle',{x:anchor.x-dx*back,y:anchor.y-dy*back});
    if(back>=17)position('pull-line',anchor.x-dx*(back-8),anchor.y-dy*(back-8),back-16);
}
function frame(now){
    const dt=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    if(!renderer)return;
    if(keyStarted!==null)setPower((now-keyStarted)/1350);
    if(active()){
        accumulator+=dt;
        while(accumulator>=stepTime&&active()){round.step();accumulator-=stepTime;}
        const ball=round.state.ball;
        if(ball.time-lastTrail>.04){
            lastTrail=ball.time;trail.push({...ball});mapTrail.push({...ball});
            if(trail.length>34)trail.shift();
        }
        if(!active())finishShot();
    }
    drawStrike(performance.now());
    const view=tour?tourView(now):null;
    const desired=view||cameraForBall(),smoothing=active()?1-Math.exp(-dt*9):1;
    eye=eye?eye.map((v,i)=>mix(v,desired.eye[i],smoothing)):desired.eye;
    target=target?target.map((v,i)=>mix(v,desired.target[i],smoothing)):desired.target;
    const ball=round.state.ball,near=$('club').value==='Putter',ready=editable();
    const aimLength=drag?Math.max(1,(near?5:32)*charge**.82):near?Math.min(8,distance(ball,round.settings.pin)):28;
    renderer.frame({eye,target,ball,pin:round.settings.pin,heading,trail,time:now,
        aim:ready&&!drag?{x:ball.x+Math.cos(heading)*aimLength,z:ball.z+Math.sin(heading)*aimLength,
            y:course.ground(ball.x+Math.cos(heading)*aimLength,ball.z+Math.sin(heading)*aimLength),near}:null,
        readOpacity:view?.readOpacity??null,greenGrid:view?.greenGrid||showGreenGrid&&ready&&near&&course.surface(ball.x,ball.z)==='green',flying:active()});
    const anchor=ready?renderer.project({x:ball.x,y:ball.y+.022,z:ball.z}):null;
    marker('ball-ring',anchor);
    const ahead=ready&&!drag?{x:ball.x+Math.cos(heading)*aimLength,z:ball.z+Math.sin(heading)*aimLength}:null;
    marker('aim-ring',ahead?renderer.project({...ahead,y:course.ground(ahead.x,ahead.z)+.06}):null);
    pullGraphics(anchor);
    if(frameNumber++%5===0){updateHUD();drawMap();}
    animationId=requestAnimationFrame(frame);
}
function previewDrag(event){
    heading=dragHeading(drag.heading,bearing(round.state.ball,round.settings.pin),event.clientX-drag.x);
    drag.depth=clamp((event.clientY-drag.y)/drag.travel,0,1);
    setPower(dragPower(drag.depth,$('club').value==='Putter'));
}
canvas.addEventListener('pointerdown',event=>{
    if(!editable()||drag||keyStarted!==null||event.button>0)return;
    const rect=canvas.getBoundingClientRect(),point=renderer.project({...round.state.ball,y:round.state.ball.y+.022});
    if(!point||Math.hypot(event.clientX-rect.left-point.x,event.clientY-rect.top-point.y)>70)return;
    event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,heading,depth:0,
        travel:clamp((window.visualViewport?.height||innerHeight)-event.clientY-20,110,200)};
    strikeStarted=performance.now();$('ball-ring').classList.add('grabbed');setPower(0);
});
canvas.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId){event.preventDefault();previewDrag(event);}});
canvas.addEventListener('pointerup',event=>{
    if(drag?.id!==event.pointerId)return;
    previewDrag(event);
    if(event.clientY-drag.y<8){cancel();return;}
    drag=null;shoot();
});
for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(drag?.id===event.pointerId)cancel();});
window.addEventListener('keydown',event=>{
    if(event.code==='Escape'){if(tour)stopTour();else cancel();return;}
    if(event.target.matches('input,select,button,a')||!editable())return;
    if(event.code==='Space'){event.preventDefault();if(keyStarted===null&&!drag){keyStarted=performance.now();strikeStarted=keyStarted;}}
    if((event.code==='ArrowLeft'||event.code==='ArrowRight')&&!drag){
        event.preventDefault();heading+=(event.code==='ArrowLeft'?-1:1)*($('club').value==='Putter'?.007:.005);
    }
});
window.addEventListener('keyup',event=>{
    if(event.code==='Space'&&keyStarted!==null){event.preventDefault();keyStarted=null;shoot();}
});
window.addEventListener('blur',cancel);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();lastTime=0;});
$('green-grid').onclick=()=>{showGreenGrid=!showGreenGrid;updateHUD();};
$('club').onchange=()=>{cancel();preview=null;updateHUD();};
function holeURL(number){
    const query=new URLSearchParams({hole:number,tee:$('tee').value,wind:$('wind').value,
        mph:$('wind-speed').value,speed:$('green-speed').value,build:buildId});
    if(series)query.set('series',series.id);
    return './play.html?'+query;
}
$('hole').onchange=()=>{
    const selected=$('tee').value,hole=holeByNumber($('hole').value);
    $('tee').replaceChildren();options('tee',hole.tees.map(tee=>[tee.id,tee.name+' · '+tee.yards+' yd']));
    if(hole.tees.some(tee=>tee.id===selected))$('tee').value=selected;
};
$('reset').onclick=$('replay').onclick=()=>{
    if(active()||tour)return;
    $('series-replay').hidden=$('series-new').hidden=true;$('series-card').replaceChildren();$('series-best').textContent='';
    $('hole').value=String(course.number);$('hole').onchange();startRound();canvas.focus({preventScroll:true});
};
$('apply').onclick=()=>{
    if(active()||tour)return;
    if(Number($('hole').value)!==course.number){location.assign(holeURL(Number($('hole').value)));return;}
    startRound();canvas.focus({preventScroll:true});
};
$('close-result').onclick=()=>{$('complete').close();updateHUD();canvas.focus({preventScroll:true});};
$('complete').addEventListener('close',()=>updateHUD());
canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();cancelAnimationFrame(animationId);cancel();
    $('render-error').hidden=false;$('render-error').textContent='3D graphics paused. Reload this page to restart the hole.';
});
try{
    renderer=createRenderer(canvas,course,atlas);
    startRound();animationId=requestAnimationFrame(frame);
}catch(error){
    $('render-error').hidden=false;$('render-error').textContent=error.message;
    $('stage').hidden=true;$('status').textContent='Course graphics could not start.';
}

let availableBuild;
async function checkBuild(){
    try{
        const response=await fetch(new URL('./release.json',document.baseURI),{cache:'no-store'});
        if(!response.ok)return;
        const release=await response.json();
        if(typeof release.buildId!=='string'||release.buildId===buildId)return;
        availableBuild=release.buildId;$('update-notice').hidden=false;
        $('reload-build').disabled=active();
    }catch{/* Local/offline play remains available without a release manifest. */}
}
$('reload-build').onclick=()=>{
    if(active()||!availableBuild)return;
    const url=new URL(location.href);url.searchParams.set('build',availableBuild);url.searchParams.set('tee',$('tee').value);
    location.replace(url.href);
};
window.addEventListener('focus',checkBuild);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkBuild();});
checkBuild();
