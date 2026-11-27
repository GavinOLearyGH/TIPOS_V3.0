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
import {dragPower,dragHeading,shotCamera,startBallPull,pullDepth,shotPower,drawShotPullGuide} from '../core/controls.mjs';
import {turnHeading} from '../core/view-controls.mjs';
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
const weatherControls=$('weather-controls');
const conditionsDialog=$('settings'),changeConditions=$('change-conditions'),restoreConditions=$('restore-conditions');
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
let selectedTarget=null,ball,trail=[],lastMap=-Infinity,gesture=null,turnDrag=null,shot=null,power=0,heading=0,view=false,lastTime=0,accumulator=0;
const active=()=>shot&&!shot.done;
let todaySetup,isCustom=false,wind,drawPrecipitation,windTime=0;
function updateWindReading(){
    const reading=windReading(settings.wind,heading),arrow=$('wind-arrow');
    arrow.hidden=reading.calm;
    arrow.style.transform='rotate('+reading.rotation+'deg)';
    $('wind-reading').textContent='Shot wind: '+(reading.calm?'Calm':reading.text);
}
function applyWeather(){
    const setup=isCustom?{mph:windSpeed.value,windAngle:windDirection.value,windSeed:'range-custom',weather:{sky:sky.value}}:todaySetup;
    const weather=setup.weather;
    wind=isCustom?null:createWind(setup);
    const angle=Number(setup.windAngle)*Math.PI/180,mph=clamp(Number(setup.mph)||0,0,25);
    settings.wind=wind?.sample(windTime)??{x:Math.cos(angle)*mph*.44704,z:Math.sin(angle)*mph*.44704};
    settings.wetness=turfWetness(weather);
    renderer?.setWeather(weather);
    weatherCanvas.hidden=true;
    drawPrecipitation=precipitationOverlay(weatherCanvas,weather?.sky);
    $('conditions-title').textContent=isCustom?'Custom practice conditions':
        warmupCard?'Today’s challenge conditions':'Today’s practice conditions';
    $('conditions').textContent=isCustom?sky.selectedOptions[0].textContent+
        (mph?' · '+mph+' mph · '+windDirection.selectedOptions[0].textContent:' · Calm'):
        weather?weatherSummary(weather):'Generated wind · '+setup.mph+' mph';
    restoreConditions.hidden=!isCustom;
    updateWindReading();
}
async function loadToday(){
    const day=dayKey(),keys={ace:aceKey,three:threeKey,nine:nineKey};
    const saved=warmupCard?read(keys[warmupKind](day))?.setup:null;
    const weather=saved?null:await challengeWeather(day).catch(()=>null);
    todaySetup=saved??(warmupKind==='ace'?dailyAceSetup(day,weather):dailySetup(day,warmupKind==='nine'?'nine':'three',weather));
    restoreToday();
    setWeatherControlsDisabled(false);
}
function restoreToday(){
    isCustom=false;
    windSpeed.value=todaySetup.mph;
    windDirection.value=String((Math.round(Number(todaySetup.windAngle)/30)%12)*30);
    sky.value=todaySetup.weather?.sky??'clear';
    applyWeather();
}
function showShotData(outcome){
    const yards=distance=>(distance/.9144).toFixed(1)+' yd';
    result.textContent='Finish: '+outcome;
    $('carry').textContent=yards(shot.carry);
    $('roll').textContent=yards(shot.roll);
    $('total').textContent=yards(shot.carry+shot.roll);
}
function setWeatherControlsDisabled(disabled){
    weatherControls.disabled=changeConditions.disabled=restoreConditions.disabled=disabled;
}
function cancelAim(){
    if(turnDrag)heading=turnDrag.heading;
    turnDrag=gesture=null;
    power=0;
    get('ball-ring').classList.toggle('grabbed',false);
    updateWindReading();
}
function placeBall(){
    $('lie-label').textContent=lie.value;
    ball=newBall(rangeStart,ground);
    cancelAim();shot=null;accumulator=0;
    club.disabled=lie.disabled=targetSelect.disabled=false;
    setWeatherControlsDisabled(!todaySetup);
    lastMap=-Infinity;
}
function fire(now){
    if(!gesture)return;
    const timing=strikePosition(now-gesture.start);
    gesture=null;
    get('ball-ring').classList.toggle('grabbed',false);
    if(power<.025){power=0;return;}
    const start={...rangeStart,...rangeLies[lie.value]},name=club.value;
    trail=[];lastMap=-Infinity;
    const contact=resolveExecution(name,power,timing,start.id),suitability=clubLie(name,start);
    shot={start,heading,firstContact:null,carry:0,roll:0,done:false};
    setWeatherControlsDisabled(true);
    ball=strike(start,ground,name,power,heading+contact.heading,start.surface,contactProfile(name,start));
    ball.spin*=contact.spin;ball.lift*=contact.lift*suitability.lift;ball.curve=contact.curve;
    power=0;club.disabled=lie.disabled=targetSelect.disabled=true;
    const feedback=contact.error===0?'Clean strike':timing<0?'Early release · Draw':'Late release · Fade';
    $('data-detail').textContent=name+' · '+feedback;
    $('data-detail').hidden=false;
    for(const field of ['carry','roll','total'])$(field).textContent='—';
    result.textContent='Ball in flight…';
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
        showShotData('In the basket · '+basket.target.yards+' yd');
        return;
    }
    if(net)Object.assign(ball,net,{mode:'rest'});
    if(!net&&ball.firstContact&&!shot.firstContact)shot.firstContact={...ball.firstContact};
    if(ball.mode==='air'||ball.mode==='roll')return;
    shot.done=true;
    shot.returnAt=now+1100;
    const offline=((ball.z-shot.start.z)*Math.cos(shot.heading)-(ball.x-shot.start.x)*Math.sin(shot.heading))/.9144;
    const finish=Math.abs(offline)<.5?'On your aim line':
        Math.abs(offline).toFixed(0)+' yd '+(offline>0?'right':'left')+' of your aim line';
    const netDistance=net?Math.round(Math.hypot(ball.x-shot.start.x,ball.z-shot.start.z)/.9144):null;
    showShotData(net?'Hit net at '+netDistance+' yd':ball.mode==='out'?'Out of range':finish);
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
    if(gesture?.keyboard)power=shotPower((now-gesture.start)/1350);
    updatePowerRail(get,power);
    get('strike-panel').hidden=!gesture;
    if(gesture){
        const zone=executionWindow(club.value,power,rangeLies[lie.value].id);
        get('strike-zone').style.width=zone*100+'%';
        get('strike-marker').style.left=(1+strikePosition(now-gesture.start))*50+'%';
    }
    const caught=shot?.catch;
    const highlighted=caught?.target??selectedTarget;
    const pull=gesture?.keyboard?null:gesture;
    const cameraHeading=pull?.heading??heading;
    const camera=shotCamera(ball,ground,cameraHeading,false,active()&&ball.time>.3);
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
        camera.eye[0]-=1.12*Math.cos(cameraHeading);
        camera.eye[1]+=.56;
        camera.eye[2]-=1.12*Math.sin(cameraHeading);
        camera.target[1]+=.20;
    }
    const aim=!view&&!shot?{x:ball.x+28*Math.cos(heading),z:ball.z+28*Math.sin(heading),y:.15,near:false}:null;
    renderer.frame({...camera,ball,pin:null,aim:pull?null:aim,flying:active(),selectedTarget:highlighted});
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
    const anchor=!view&&!shot?projectBall():null;
    placeMarker('ball-ring',anchor);
    placeMarker('aim-ring',aim&&!pull?renderer.project({...aim,y:ground(aim.x,aim.z)+.06}):null);
    drawShotPullGuide(get,anchor,pull,renderer,ball,heading,power,false,canvas);
    if(now-lastMap>=50){
        lastMap=now;
        if(shot&&(active()||!trail.length||trail.at(-1).x!==ball.x||trail.at(-1).z!==ball.z))trail.push({x:ball.x,z:ball.z});
        drawShotMap(minimap,atlas,rangeCourse,{ball,trail,aim,targets:rangeTargets,selectedTarget:highlighted});
    }
    requestAnimationFrame(frame);
}
function placeMarker(id,point){
    const marker=get(id);
    marker.hidden=!point||point.x<4||point.x>canvas.clientWidth-4||point.y<4||point.y>canvas.clientHeight-4;
    if(!marker.hidden){marker.style.left=point.x+'px';marker.style.top=point.y+'px';}
}
function projectBall(){
    return renderer.project({...ball,y:ball.y+.022});
}
const ready=()=>renderer&&todaySetup&&!shot&&!view&&!conditionsDialog.open;
function previewPull(event){
    heading=dragHeading(gesture.heading,targetHeading(),event.clientX-gesture.x);
    gesture.depth=pullDepth(gesture,event.clientY);
    power=shotPower(dragPower(gesture.depth,false));
    updateWindReading();
}
canvas.addEventListener('pointerdown',event=>{
    if(!ready()||gesture||turnDrag||event.button>0||event.isPrimary===false)return;
    const pull=startBallPull(event,canvas.getBoundingClientRect(),projectBall(),window.visualViewport?.height||innerHeight,heading);
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    if(!pull){turnDrag={id:event.pointerId,x:event.clientX,heading};return;}
    canvas.focus({preventScroll:true});
    gesture={...pull,start:performance.now()};
    get('ball-ring').classList.toggle('grabbed',true);
    power=0;
});
canvas.addEventListener('pointermove',event=>{
    if(turnDrag?.id===event.pointerId){
        event.preventDefault();
        heading=turnHeading(turnDrag.heading,event.clientX-turnDrag.x);
        updateWindReading();
    }else if(gesture?.id===event.pointerId){
        event.preventDefault();
        previewPull(event);
    }
});
canvas.addEventListener('pointerup',event=>{
    if(turnDrag?.id===event.pointerId){
        heading=turnHeading(turnDrag.heading,event.clientX-turnDrag.x);
        turnDrag=null;
        updateWindReading();
        return;
    }
    if(gesture?.id!==event.pointerId)return;
    previewPull(event);
    if(event.clientY-gesture.y<8){cancelAim();return;}
    fire(performance.now());
});
for(const eventName of ['pointercancel','lostpointercapture'])canvas.addEventListener(eventName,event=>{
    if(turnDrag?.id===event.pointerId||gesture?.id===event.pointerId)cancelAim();
});
window.addEventListener('keydown',event=>{
    if(conditionsDialog.open)return;
    if(event.code==='Escape'){
        if(view)overview.click();
        else cancelAim();
        return;
    }
    if(event.target.matches('input,select,button,a,textarea')||!ready())return;
    if(event.code==='Space'){
        event.preventDefault();
        if(!gesture&&!turnDrag)gesture={keyboard:true,start:performance.now()};
    }
    if(['ArrowLeft','ArrowRight'].includes(event.code)&&(!gesture||gesture.keyboard)){
        event.preventDefault();
        heading+=(event.code==='ArrowLeft'?-1:1)*.005;
        updateWindReading();
    }
});
window.addEventListener('keyup',event=>{if(event.code==='Space'&&gesture?.keyboard){event.preventDefault();fire(performance.now());}});
window.addEventListener('blur',()=>{cancelAim();lastTime=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAim();lastTime=0;accumulator=0;});
const targetHeading=()=>selectedTarget?Math.atan2(selectedTarget.z-rangeStart.z,selectedTarget.x-rangeStart.x):0;
targetSelect.onchange=()=>{
    selectedTarget=rangeTargets.find(target=>target.yards===Number(targetSelect.value))??null;
    heading=targetHeading();
    lastMap=-Infinity;
    updateWindReading();
};
windSpeed.onchange=windDirection.onchange=sky.onchange=()=>{
    isCustom=true;
    windSpeed.value=clamp(Math.round(Number(windSpeed.value)||0),0,25);
    applyWeather();
};
changeConditions.onclick=()=>{cancelAim();conditionsDialog.showModal();};
restoreConditions.onclick=()=>{cancelAim();restoreToday();changeConditions.focus();};
lie.onchange=placeBall;
overview.onclick=()=>{
    view=!view;cancelAim();
    $('stage').classList.toggle('range-overview',view);
    overview.textContent=view?'Back to shot':'Overview';
    overview.setAttribute('aria-label',view?'Back to shot':'Range overview');
};
if(renderer){placeBall();targetSelect.onchange();requestAnimationFrame(frame);}
loadToday();
