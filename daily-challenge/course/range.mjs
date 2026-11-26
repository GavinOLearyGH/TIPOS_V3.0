import {applyClubTheme,themedURL} from '../core/club-theme.mjs';
import {gameRoot} from '../core/navigation.mjs';
import {aceKey,challengeWeather,dayKey,nineKey,read,threeKey} from '../core/daily-client.mjs';
import {dailyAceSetup,dailySetup} from '../core/competition.mjs';
import {turfWetness,weatherSummary} from '../core/daily-weather.mjs';
import {precipitationOverlay} from './precipitation.mjs';
import {drawShotMap,updatePowerRail} from '../core/shot-hud.mjs';
import {advance,clubs,newBall,strike,stepTime,clamp,mix} from '../core/physics.mjs';
import {createWind,windReading} from '../core/wind.mjs';
import {fullBag} from '../core/round.mjs';
import {clubLie,contactProfile} from '../core/club-lie.mjs';
import {executionWindow,resolveExecution,strikePosition} from '../core/execution.mjs';
import {dragPower,dragHeading,shotCamera} from '../core/controls.mjs';
import {createRenderer,makeAtlas} from '../core/renderer.mjs';
import {rangeCourse,rangeLength,rangeStart,rangeLies,rangeTargets,netContact,basketContact,bounceOffBasket} from './range-layout.mjs';

applyClubTheme();

const get=id=>document.getElementById(id),$=id=>get('range-'+id);
const warmupCards=new Map([['ace','hole-in-one'],['three','three-holes'],['nine','play-nine-card']]);
const warmupKind=new URLSearchParams(location.search).get('warmup');
const warmupCard=warmupCards.get(warmupKind);
if(warmupCard){
    const home=gameRoot(location.href);
    home.hash=warmupCard;
    $('home').href=themedURL(home).href;
    $('home').textContent='Back to today’s challenge';
}
const canvas=get('scene'),club=$('club'),lie=$('lie'),result=$('result'),overview=get('flyover');
const minimap=get('map'),targetSelect=$('target'),targetMarker=$('target-marker');
for(const {yards} of rangeTargets)targetSelect.add(new Option(yards+' yd',yards));
const weatherControls=$('weather-controls'),weatherMode=$('weather-mode'),custom=$('custom-weather');
const windSpeed=$('wind-speed'),windDirection=$('wind-direction'),sky=$('sky'),weatherCanvas=get('weather-effects');
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
let todaySetup,wind,drawPrecipitation,windTime=0;
function updateWindReading(){
    const reading=windReading(settings.wind,heading),arrow=$('wind-arrow');
    arrow.hidden=reading.calm;
    arrow.style.transform='rotate('+reading.rotation+'deg)';
    $('wind-reading').textContent=reading.calm?'Wind: Calm':reading.text;
}
function applyWeather(){
    const isCustom=weatherMode.value==='custom';
    custom.hidden=!isCustom;
    const setup=isCustom?{mph:windSpeed.value,windAngle:windDirection.value,windSeed:'range-custom',weather:{sky:sky.value}}:todaySetup;
    const weather=setup.weather;
    wind=isCustom?null:createWind(setup);
    const angle=Number(setup.windAngle)*Math.PI/180,mph=clamp(Number(setup.mph)||0,0,25);
    settings.wind=wind?.sample(windTime)??{x:Math.cos(angle)*mph*.44704,z:Math.sin(angle)*mph*.44704};
    settings.wetness=turfWetness(weather);
    renderer?.setWeather(weather);
    weatherCanvas.hidden=true;
    drawPrecipitation=precipitationOverlay(weatherCanvas,weather?.sky);
    $('conditions').textContent=isCustom?'Custom · '+sky.selectedOptions[0].textContent:
        weather?weatherSummary(weather):'Today’s conditions · Generated wind · '+setup.mph+' mph';
    updateWindReading();
}
async function loadToday(){
    const day=dayKey(),keys={ace:aceKey,three:threeKey,nine:nineKey};
    const saved=warmupCard?read(keys[warmupKind](day))?.setup:null;
    const weather=saved?null:await challengeWeather(day).catch(()=>null);
    todaySetup=saved??(warmupKind==='ace'?dailyAceSetup(day,weather):dailySetup(day,warmupKind==='nine'?'nine':'three',weather));
    windSpeed.value=todaySetup.mph;
    windDirection.value=String((Math.round(Number(todaySetup.windAngle)/30)%12)*30);
    sky.value=todaySetup.weather?.sky??'clear';
    weatherMode.value='today';
    applyWeather();
    weatherControls.disabled=false;
}
function showShotData(outcome){
    const yards=distance=>(distance/.9144).toFixed(1)+' yd';
    $('data-detail').textContent=[shot.club,shot.contact,outcome].filter(Boolean).join(' · ');
    $('carry').textContent=yards(shot.carry);
    $('roll').textContent=yards(shot.roll);
    $('total').textContent=yards(shot.carry+shot.roll);
}
function placeBall(){
    $('lie-label').textContent=lie.value;
    ball=newBall(rangeStart,ground);
    gesture=shot=null;power=accumulator=0;
    club.disabled=lie.disabled=targetSelect.disabled=false;
    weatherControls.disabled=!todaySetup;
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
    shot={start,heading,club:name,contact:contact.label,firstContact:null,carry:0,roll:0,done:false};
    weatherControls.disabled=true;
    ball=strike(start,ground,name,power,heading+contact.heading,start.surface,contactProfile(name,start));
    ball.spin*=contact.spin;ball.lift*=contact.lift*suitability.lift;ball.curve=contact.curve;
    power=0;club.disabled=lie.disabled=targetSelect.disabled=true;result.textContent=contact.label+' · Ball in flight';
}
function step(now){
    const before={x:ball.x,y:ball.y,z:ball.z},wasAirborne=ball.mode==='air';
    advance(ball,rangeCourse,settings);
    const net=netContact(before,ball),basket=wasAirborne?basketContact(before,ball):null;
    const hitsBasket=basket&&(!net||basket.t<net.t),end=hitsBasket?basket:net??ball;
    shot[shot.firstContact?'roll':'carry']+=Math.hypot(end.x-before.x,end.z-before.z);
    if(hitsBasket){
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
        showShotData('In the basket · '+basket.target.yards+' yd');
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
    showShotData(net?'Hit net':ball.mode==='out'?'Out of range':finish);
}
function frame(now){
    const elapsed=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));
    accumulator+=elapsed;lastTime=now;
    if(wind){
        windTime+=elapsed;
        settings.wind=wind.sample(windTime);
        updateWindReading();
    }
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
    drawPrecipitation?.(now,view);
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
const ready=()=>renderer&&todaySetup&&!shot&&!gesture&&!view;
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
targetSelect.onchange=()=>{
    selectedTarget=rangeTargets.find(target=>target.yards===Number(targetSelect.value))??null;
    heading=selectedTarget?Math.atan2(selectedTarget.z-rangeStart.z,selectedTarget.x-rangeStart.x):0;
    lastMap=-Infinity;
    updateWindReading();
};
weatherMode.onchange=windSpeed.onchange=windDirection.onchange=sky.onchange=applyWeather;
lie.onchange=placeBall;
overview.onclick=()=>{
    view=!view;gesture=null;power=0;
    $('stage').classList.toggle('range-overview',view);
    overview.textContent=view?'Back to shot':'Overview';
    overview.setAttribute('aria-label',view?'Back to shot':'Range overview');
};
if(renderer){placeBall();targetSelect.onchange();requestAnimationFrame(frame);}
loadToday();
