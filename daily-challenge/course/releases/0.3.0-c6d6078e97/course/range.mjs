import {drawShotMap,updatePowerRail} from '../core/shot-hud.mjs';
import {advance,clubs,newBall,strike,stepTime,clamp} from '../core/physics.mjs';
import {fullBag} from '../core/round.mjs';
import {clubLie,contactProfile} from '../core/club-lie.mjs';
import {executionWindow,resolveExecution,strikePosition} from '../core/execution.mjs';
import {dragPower,dragHeading,shotCamera} from '../core/controls.mjs';
import {createRenderer,makeAtlas} from '../core/renderer.mjs';
import {rangeCourse,rangeLength,rangeLies,rangeTargets,netContact} from './range-layout.mjs';

const get=id=>document.getElementById(id),$=id=>get('range-'+id);
const canvas=get('scene'),club=$('club'),lie=$('lie'),result=$('result'),next=$('next'),overview=get('flyover');
const minimap=get('map');
for(const name of fullBag.filter(name=>name!=='Putter'))club.add(new Option(name+' · '+clubs[name].carry+' yd',name));
for(const name of Object.keys(rangeLies))lie.add(new Option(name,name));
club.value='7 Iron';lie.value='Mat';
let renderer,atlas;
try{atlas=makeAtlas(rangeCourse);renderer=createRenderer(canvas,rangeCourse,atlas);}
catch(error){result.textContent=error.message;club.disabled=lie.disabled=overview.disabled=true;}
const ground=rangeCourse.ground,settings={greenSpeed:1,wind:{x:0,z:0}};
let ball,trail=[],lastMap=-Infinity,gesture=null,shot=null,power=0,heading=0,view=false,lastTime=0,accumulator=0;
const active=()=>shot&&!shot.done;
function reset(){
    trail=[];lastMap=-Infinity;
    $('lie-label').textContent=lie.value;
    ball=newBall(rangeLies[lie.value],ground);
    gesture=shot=null;power=heading=accumulator=0;
    next.disabled=true;club.disabled=lie.disabled=false;
    result.textContent='Drag down for power, slide to aim, and release in the green zone. Keyboard: hold Space, then release.';
}
function fire(now){
    if(!gesture)return;
    const timing=strikePosition(now-gesture.start);
    gesture=null;
    if(power<.025){power=0;return;}
    const start=rangeLies[lie.value],name=club.value;
    const contact=resolveExecution(name,power,timing,start.id),suitability=clubLie(name,start);
    shot={start,heading,contact:contact.label,firstContact:null,done:false};
    ball=strike(start,ground,name,power,heading+contact.heading,start.surface,contactProfile(name,start));
    ball.spin*=contact.spin;ball.lift*=contact.lift*suitability.lift;ball.curve=contact.curve;
    power=0;club.disabled=lie.disabled=true;result.textContent=contact.label+' · Ball in flight';
}
function step(){
    const before={x:ball.x,y:ball.y,z:ball.z};
    advance(ball,rangeCourse,settings);
    const net=netContact(before,ball);
    if(net)Object.assign(ball,net,{mode:'rest'});
    if(!net&&ball.firstContact&&!shot.firstContact)shot.firstContact={...ball.firstContact};
    if(ball.mode==='air'||ball.mode==='roll')return;
    shot.done=true;next.disabled=false;club.disabled=lie.disabled=false;
    const distance=({x,z})=>Math.hypot(x-shot.start.x,z-shot.start.z)/.9144;
    const offline=((ball.z-shot.start.z)*Math.cos(shot.heading)-(ball.x-shot.start.x)*Math.sin(shot.heading))/.9144;
    const finish=Math.abs(offline)<.5?'On line':Math.abs(offline).toFixed(0)+' yd '+(offline>0?'right':'left');
    const carry=shot.firstContact?'Carry '+Math.round(distance(shot.firstContact))+' yd · ':'';
    const outcome=net?'Hit net · '+Math.round(distance(ball))+' yd to contact':(ball.mode==='out'?'Out of range · ':'')+carry+'Total '+Math.round(distance(ball))+' yd';
    result.textContent=outcome+' · '+finish+' · '+shot.contact;
}
function frame(now){
    accumulator+=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    while(accumulator>=stepTime&&active()){step();accumulator-=stepTime;}
    if(!active())accumulator=0;
    if(gesture?.keyboard)power=clamp((now-gesture.start)/1350,0,1);
    updatePowerRail(get,power);
    get('strike-panel').hidden=!gesture||!power;
    if(gesture){
        const zone=executionWindow(club.value,power,rangeLies[lie.value].id);
        get('strike-zone').style.width=zone*100+'%';
        get('strike-marker').style.left=(1+strikePosition(now-gesture.start))*50+'%';
    }
    const camera=view?{eye:[-64,Math.max(120,95*canvas.clientHeight/Math.max(1,canvas.clientWidth)),0],target:[rangeLength*.48,0,0]}:shotCamera(ball,ground,heading,false,active()&&ball.time>.3);
    const aim=!view&&!shot?{x:ball.x+18*Math.cos(heading),z:ball.z+18*Math.sin(heading),y:.15,near:false}:null;
    renderer.frame({...camera,ball,pin:null,aim,flying:active()});
    const marker=get('ball-ring'),anchor=!view&&!shot?renderer.project({x:ball.x,y:ball.y+.022,z:ball.z}):null;
    marker.hidden=!anchor||anchor.x<4||anchor.x>canvas.clientWidth-4||anchor.y<4||anchor.y>canvas.clientHeight-4;
    if(!marker.hidden){marker.style.left=anchor.x+'px';marker.style.top=anchor.y+'px';}
    if(now-lastMap>=50){
        lastMap=now;
        if(shot&&(active()||!trail.length||trail.at(-1).x!==ball.x||trail.at(-1).z!==ball.z))trail.push({x:ball.x,z:ball.z});
        drawShotMap(minimap,atlas,rangeCourse,{ball,trail,aim,targets:rangeTargets});
    }
    requestAnimationFrame(frame);
}
const ready=()=>renderer&&!shot&&!gesture&&!view;
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
    power=dragPower(depth,false);
});
canvas.addEventListener('pointerup',event=>{if(gesture?.id===event.pointerId)fire(performance.now());});
canvas.addEventListener('pointercancel',()=>{gesture=null;power=0;});
canvas.addEventListener('keydown',event=>{
    if(event.code==='Escape'){gesture=null;power=0;return;}
    if(!ready())return;
    if(['ArrowLeft','ArrowRight'].includes(event.code)){
        event.preventDefault();heading=clamp(heading+(event.code==='ArrowLeft'?-.015:.015),-.5,.5);
    }
    if(event.code==='Space'&&!event.repeat){event.preventDefault();gesture={keyboard:true,start:performance.now()};}
});
canvas.addEventListener('keyup',event=>{if(event.code==='Space'&&gesture?.keyboard){event.preventDefault();fire(performance.now());}});
canvas.addEventListener('blur',()=>{if(gesture?.keyboard){gesture=null;power=0;}});
lie.onchange=reset;
next.onclick=()=>{reset();canvas.focus({preventScroll:true});};
overview.onclick=()=>{
    view=!view;gesture=null;power=0;
    overview.textContent=view?'Back to shot':'Overview';
    overview.setAttribute('aria-label',view?'Back to shot':'Range overview');
};
if(renderer){reset();requestAnimationFrame(frame);}
