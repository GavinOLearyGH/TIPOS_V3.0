import {applyClubTheme,themedURL} from '../core/club-theme.mjs';
import {gameRoot} from '../core/navigation.mjs';
import {drawShotMap,updatePowerRail} from '../core/shot-hud.mjs';
import {advance,clubs,newBall,strike,stepTime,clamp,windVector,mix} from '../core/physics.mjs';
import {windReading} from '../core/wind.mjs';
import {fullBag} from '../core/round.mjs';
import {clubLie,contactProfile} from '../core/club-lie.mjs';
import {executionWindow,resolveExecution,strikePosition} from '../core/execution.mjs';
import {dragPower,dragHeading,shotCamera} from '../core/controls.mjs';
import {createRenderer,makeAtlas} from '../core/renderer.mjs';
import {rangeCourse,rangeLength,rangeStart,rangeLies,rangeTargets,netContact,basketContact,bounceOffBasket} from './range-layout.mjs';

applyClubTheme();

const get=id=>document.getElementById(id),$=id=>get('range-'+id);
if(new URLSearchParams(location.search).get('warmup')==='ace'){
    const home=gameRoot(location.href);
    home.hash='hole-in-one';
    $('home').href=themedURL(home).href;
    $('home').textContent='Back to today’s challenge';
}
const canvas=get('scene'),club=$('club'),lie=$('lie'),result=$('result'),overview=get('flyover');
const minimap=get('map'),targetSelect=$('target'),targetMarker=$('target-marker');
for(const {yards} of rangeTargets)targetSelect.add(new Option(yards+' yd',yards));
const windToggle=$('wind-toggle'),windPanel=$('wind-panel'),windSpeed=$('wind-speed'),windDirection=$('wind-direction');
const cardinalDirections={0:'downrange',3:'left to right',6:'toward the mats',9:'right to left'};
for(let hour=0;hour<12;hour++){
    const direction=cardinalDirections[hour];
    windDirection.add(new Option((hour||12)+' o’clock'+(direction?' · '+direction:''),hour*30));
}
for(const name of fullBag.filter(name=>name!=='Putter'))club.add(new Option(name+' · '+clubs[name].carry+' yd',name));
for(const name of Object.keys(rangeLies))lie.add(new Option(name,name));
club.value='7 Iron';lie.value='Mat';
let renderer,atlas;
try{atlas=makeAtlas(rangeCourse);renderer=createRenderer(canvas,rangeCourse,atlas);}
catch(error){result.textContent=error.message;club.disabled=lie.disabled=overview.disabled=true;}
const ground=rangeCourse.ground,settings={greenSpeed:1,wind:{x:0,z:0}};
let selectedTarget=null,ball,trail=[],lastMap=-Infinity,gesture=null,shot=null,power=0,heading=0,view=false,lastTime=0,accumulator=0;
const active=()=>shot&&!shot.done;
function showWindPanel(open,restoreFocus=false){
    windPanel.hidden=!open;
    windToggle.setAttribute('aria-expanded',String(open));
    if(restoreFocus)windToggle.focus();
}
function updateWindReading(){
    const reading=windReading(settings.wind,heading),arrow=$('wind-arrow');
    arrow.hidden=reading.calm;
    arrow.style.transform='rotate('+reading.rotation+'deg)';
    $('wind-reading').textContent=reading.calm?'Wind: Calm':windSpeed.value+' mph';
    windToggle.setAttribute('aria-label',reading.calm?'Wind, calm':'Wind blowing '+reading.text+' relative to aim');
}
function updateWind(){
    const mph=Number(windSpeed.value);
    windDirection.disabled=mph===0;
    settings.wind=windVector(Number(windDirection.value)/45,mph);
    updateWindReading();
}
function placeBall(){
    $('lie-label').textContent=lie.value;
    ball=newBall(rangeStart,ground);
    gesture=shot=null;power=accumulator=0;
    club.disabled=lie.disabled=windToggle.disabled=targetSelect.disabled=false;
    lastMap=-Infinity;
}
function fire(now){
    if(!gesture)return;
    const timing=strikePosition(now-gesture.start);
    gesture=null;
    if(power<.025){power=0;return;}
    const start={...rangeStart,...rangeLies[lie.value]},name=club.value;
    trail=[];lastMap=-Infinity;
    const contact=resolveExecution(name,power,timing,start.id),suitability=clubLie(name,start);
    shot={start,heading,contact:contact.label,firstContact:null,done:false};
    ball=strike(start,ground,name,power,heading+contact.heading,start.surface,contactProfile(name,start));
    ball.spin*=contact.spin;ball.lift*=contact.lift*suitability.lift;ball.curve=contact.curve;
    power=0;club.disabled=lie.disabled=windToggle.disabled=targetSelect.disabled=true;result.textContent=contact.label+' · Ball in flight';
}
function step(now){
    const before={x:ball.x,y:ball.y,z:ball.z},wasAirborne=ball.mode==='air';
    advance(ball,rangeCourse,settings);
    const net=netContact(before,ball),basket=wasAirborne?basketContact(before,ball):null;
    if(basket&&(!net||basket.t<net.t)){
        if(basket.kind==='rim'){
            bounceOffBasket(ball,basket);
            return;
        }
        shot.done=true;
        shot.catch=basket;
        shot.caughtAt=now;
        shot.returnAt=now+1450;
        Object.assign(ball,{x:basket.x,y:basket.y,z:basket.z,mode:'basket'});
        trail.push({x:ball.x,z:ball.z});
        lastMap=-Infinity;
        result.textContent='In the basket · '+basket.target.yards+' yd';
        return;
    }
    if(net)Object.assign(ball,net,{mode:'rest'});
    if(!net&&ball.firstContact&&!shot.firstContact)shot.firstContact={...ball.firstContact};
    if(ball.mode==='air'||ball.mode==='roll')return;
    shot.done=true;
    shot.returnAt=now+1100;
    const distance=({x,z})=>Math.hypot(x-shot.start.x,z-shot.start.z)/.9144;
    const offline=((ball.z-shot.start.z)*Math.cos(shot.heading)-(ball.x-shot.start.x)*Math.sin(shot.heading))/.9144;
    const finish=Math.abs(offline)<.5?'On line':Math.abs(offline).toFixed(0)+' yd '+(offline>0?'right':'left');
    const carry=shot.firstContact?'Carry '+Math.round(distance(shot.firstContact))+' yd · ':'';
    const outcome=net?'Hit net · '+Math.round(distance(ball))+' yd to contact':(ball.mode==='out'?'Out of range · ':'')+carry+'Total '+Math.round(distance(ball))+' yd';
    result.textContent=outcome+' · '+finish+' · '+shot.contact;
}
function frame(now){
    accumulator+=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    while(accumulator>=stepTime&&active()){step(now);accumulator-=stepTime;}
    if(!active())accumulator=0;
    if(shot?.done&&now>=shot.returnAt)placeBall();
    if(gesture?.keyboard)power=clamp((now-gesture.start)/1350,0,1);
    updatePowerRail(get,power);
    get('strike-panel').hidden=!gesture||!power;
    if(gesture){
        const zone=executionWindow(club.value,power,rangeLies[lie.value].id);
        get('strike-zone').style.width=zone*100+'%';
        get('strike-marker').style.left=(1+strikePosition(now-gesture.start))*50+'%';
    }
    const caught=shot?.catch;
    const highlighted=caught?.target??selectedTarget;
    const camera=shotCamera(ball,ground,heading,false,active()&&ball.time>.3);
    if(caught){
        const {x,z}=caught.target,y=ground(x,z),drop=clamp((now-shot.caughtAt)/220,0,1);
        ball.x=mix(caught.x,x,drop);
        ball.y=mix(caught.y,y+.12,drop**2);
        ball.z=mix(caught.z,z,drop);
        camera.eye=[x-6.4*Math.cos(shot.heading),y+2.9,z-6.4*Math.sin(shot.heading)];
        camera.target=[x,y+.38,z];
    }else if(view){
        const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
        camera.eye=[-Math.max(40,29/Math.max(.35,aspect)),26,0];
        camera.target=[rangeLength*.42,0,0];
    }else if(!shot){
        camera.eye[0]-=1.12*Math.cos(heading);
        camera.eye[1]+=.56;
        camera.eye[2]-=1.12*Math.sin(heading);
        camera.target[1]+=.20;
    }
    const aim=!view&&!shot?{x:ball.x+18*Math.cos(heading),z:ball.z+18*Math.sin(heading),y:.15,near:false}:null;
    renderer.frame({...camera,ball,pin:null,aim,flying:active(),selectedTarget:highlighted});
    const targetPoint=highlighted&&(!shot||caught)
        ?renderer.project({x:highlighted.x,y:ground(highlighted.x,highlighted.z)+.6,z:highlighted.z}):null;
    targetMarker.hidden=!targetPoint||targetPoint.x<35||targetPoint.x>canvas.clientWidth-35||
        targetPoint.y<38||targetPoint.y>canvas.clientHeight;
    targetMarker.classList.toggle('caught',Boolean(caught));
    if(!targetMarker.hidden){
        targetMarker.style.left=targetPoint.x+'px';
        targetMarker.style.top=targetPoint.y+'px';
        const text=$('target-marker-text'),label=caught?'In the basket · '+highlighted.yards+' yd':highlighted.yards+' yd';
        if(text.textContent!==label)text.textContent=label;
    }
    const marker=get('ball-ring'),anchor=!view&&!shot?renderer.project({x:ball.x,y:ball.y+.022,z:ball.z}):null;
    marker.hidden=!anchor||anchor.x<4||anchor.x>canvas.clientWidth-4||anchor.y<4||anchor.y>canvas.clientHeight-4;
    if(!marker.hidden){marker.style.left=anchor.x+'px';marker.style.top=anchor.y+'px';}
    if(now-lastMap>=50){
        lastMap=now;
        if(shot&&(active()||!trail.length||trail.at(-1).x!==ball.x||trail.at(-1).z!==ball.z))trail.push({x:ball.x,z:ball.z});
        drawShotMap(minimap,atlas,rangeCourse,{ball,trail,aim,targets:rangeTargets,selectedTarget:highlighted});
    }
    requestAnimationFrame(frame);
}
const ready=()=>renderer&&!shot&&!gesture&&!view&&windPanel.hidden;
canvas.addEventListener('pointerdown',event=>{
    if(!ready()||event.button!==0)return;
    canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,heading,start:performance.now()};
});
canvas.addEventListener('pointermove',event=>{
    if(gesture?.id!==event.pointerId)return;
    const depth=clamp((event.clientY-gesture.y)/120,0,1);
    if(power===0&&depth>0)gesture.start=performance.now();
    heading=dragHeading(gesture.heading,0,event.clientX-gesture.x);
    updateWindReading();
    power=dragPower(depth,false);
});
canvas.addEventListener('pointerup',event=>{if(gesture?.id===event.pointerId)fire(performance.now());});
canvas.addEventListener('pointercancel',()=>{gesture=null;power=0;});
canvas.addEventListener('keydown',event=>{
    if(event.code==='Escape'){gesture=null;power=0;return;}
    if(!ready())return;
    if(['ArrowLeft','ArrowRight'].includes(event.code)){
        event.preventDefault();heading=clamp(heading+(event.code==='ArrowLeft'?-.015:.015),-.5,.5);
        updateWindReading();
    }
    if(event.code==='Space'&&!event.repeat){event.preventDefault();gesture={keyboard:true,start:performance.now()};}
});
canvas.addEventListener('keyup',event=>{if(event.code==='Space'&&gesture?.keyboard){event.preventDefault();fire(performance.now());}});
canvas.addEventListener('blur',()=>{if(gesture?.keyboard){gesture=null;power=0;}});
targetSelect.onfocus=()=>showWindPanel(false);
targetSelect.onchange=()=>{
    selectedTarget=rangeTargets.find(target=>target.yards===Number(targetSelect.value))??null;
    heading=selectedTarget?Math.atan2(selectedTarget.z-rangeStart.z,selectedTarget.x-rangeStart.x):0;
    lastMap=-Infinity;
    updateWindReading();
};
windToggle.onclick=()=>{
    if(!gesture&&!view&&!shot)showWindPanel(windPanel.hidden);
};
$('wind-done').onclick=()=>showWindPanel(false,true);
windSpeed.onchange=windDirection.onchange=updateWind;
document.addEventListener('click',event=>{
    if(!windPanel.hidden&&!windPanel.contains(event.target)&&!windToggle.contains(event.target))showWindPanel(false);
});
document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!windPanel.hidden){
        event.preventDefault();
        showWindPanel(false,true);
    }
});
lie.onchange=placeBall;
overview.onclick=()=>{
    view=!view;gesture=null;power=0;
    showWindPanel(false);
    $('stage').classList.toggle('range-overview',view);
    overview.textContent=view?'Back to shot':'Overview';
    overview.setAttribute('aria-label',view?'Back to shot':'Range overview');
};
if(renderer){updateWind();placeBall();targetSelect.onchange();requestAnimationFrame(frame);}
