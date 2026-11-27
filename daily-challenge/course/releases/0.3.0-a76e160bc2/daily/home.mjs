import {applyClubTheme} from '../core/club-theme.mjs';
import {dailyAceHole,dailyAceSetup,dailySetup,dailyLineup,rankedThree} from '../core/competition.mjs';
import {buildId} from '../core/build-info.mjs';
import {dayKey,read,threeKey,nineKey,aceKey,startOfficial,officialURL,localOnly,appRoot,totalScore,streak,challengeWeather} from '../core/daily-client.mjs';
import {newSeries,roundHoles,roundModes,roundTee} from '../core/series.mjs';
import {readChallengeInvite,describeChallenge} from '../core/challenge-share.mjs';
import {weatherSummary} from '../core/daily-weather.mjs';
import {refreshParentWorker} from '../core/updates.mjs';

applyClubTheme();
const $=id=>document.getElementById(id),day=dayKey(),types=['ace','three','nine'];
const yesterday=new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
const displayDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:'America/New_York'});
const aceBand=row=>row.ace?0:row.mm<914.4?1:row.mm<3048?2:row.mm<7620?3:4;
let boardPeriod='today',yesterdayBoards=null;
const params=new URLSearchParams(location.search),invitation=readChallengeInvite(params);
const requestedBoard=params.get('board');
let selected=types.includes(requestedBoard)?requestedBoard:'ace',boards={},sources={},refreshing=false,weather=null;
const savedRound=kind=>read((kind==='nine'?nineKey:threeKey)(day));
const lineup=kind=>{const saved=savedRound(kind);return saved?roundHoles(saved):dailyLineup(day,kind);};
const conditions=kind=>savedRound(kind)?.setup??dailySetup(day,kind,weather);
const teeNames={1896:'1896 (Black)',rawlins:'Rawlins (Blue)',butler:'Butler (Silver)',dixon:'Dixon (White)'};
const speeds={0.8:'Slow',1:'Medium',1.24:'Fast'};
function describeSetup(setup){
 const wind=Number(setup.mph)?setup.mph+' mph prevailing wind':'Calm';
 const tee=teeNames[setup.tee]??Object.entries(teeNames)
     .filter(([id])=>roundTee(id,6)===setup.tee).map(([,name])=>name).join(' / ');
 return [tee,wind,speeds[Number(setup.speed)]+' greens'].join(' · ');
}
refreshParentWorker();
$('today').setAttribute('datetime',day);
$('today').textContent=displayDate(day);
$('build-version').textContent='Build '+buildId;
$('practice-selection').href='./course/?build='+buildId;
$('practice-cross-country').href='./course/cross-country.html?build='+buildId;
const nameOf=score=>score.ace?'Hole in one':(score.mm/304.8).toFixed(1)+' ft';
const tieOf=score=>score.tieValid?(score.tieMM===0?'Ace':(score.tieMM/304.8).toFixed(1)+' ft'):'Penalty';
const scoreOf=(total,par)=>total+' ('+(total===par?'E':total>par?'+'+(total-par):total-par)+')';
function showPreviewWinners(){
 const scenario=params.get('winners')??'sample';
 if(!location.hostname.endsWith('.github.io')||!['sample','tie','empty'].includes(scenario))return;
 const sample={
  ace:[{name:'Alex',ace:false,mm:1220},{name:'Taylor',ace:false,mm:1524}],
  three:[{name:'Jordan',total:11,tieValid:true,tieMM:3000},{name:'Morgan',total:11,tieValid:true,tieMM:4000}],
  nine:[{name:'Casey',total:34,tieValid:true,tieMM:5000}]
 };
 if(scenario==='tie'){
  sample.three[1].tieMM=sample.three[0].tieMM;
  sample.nine=[];
 }
 const rows=[];
 yesterdayBoards={};
 for(const kind of types){
  const scores=scenario==='empty'?[]:sample[kind];
  const counts=[0,0,0,0,0],totals=new Map();
  for(const score of scores){
   if(kind==='ace')counts[aceBand(score)]++;
   else totals.set(score.total,(totals.get(score.total)??0)+1);
  }
  yesterdayBoards[kind]={leaders:scores,counts,total:scores.length,distribution:[...totals].map(([total,count])=>({total,count}))};
  if(!scores.length)continue;
  const winners=kind==='ace'?scores.filter(score=>score.ace===scores[0].ace&&score.mm===scores[0].mm):
      rankedThree(scores).filter(score=>score.rank===1);
  const [winner]=winners;
  const row=document.createElement('div'),label=document.createElement('dt'),result=document.createElement('dd');
  label.textContent=kind==='ace'?'Hole-in-One':roundModes[kind].label;
  const score=kind==='ace'?nameOf(winner):scoreOf(winner.total,roundModes[kind].par);
  result.textContent=winners.map(entry=>entry.name).join(' & ')+' · '+score;
  row.append(label,result);rows.push(row);
 }
 $('winners-list').replaceChildren(...rows);
 $('winners-empty').hidden=rows.length>0;
 $('yesterday-winners').hidden=false;
 $('board-days').hidden=false;
}
function localRoundBoard(kind){
 const round=savedRound(kind);
 const attempts=Number(Boolean(round?.revision>0||round?.status==='completed'));
 if(!round?.name||round.status!=='completed')return {day,attempts,leaders:[],distribution:[],total:0};
 const total=totalScore(round);
 return {day,attempts,leaders:[{name:round.name,total,tieValid:round.tieValid,tieMM:round.tieMM}],distribution:[{total,count:1}],total:1};
}
function localBoards(){
 const ace=read(aceKey(day))??read('irish-par-official:'+day),counts=[0,0,0,0,0];
 const aceRows=ace?.name&&ace.outcome==='in-play'?[ace]:[];for(const row of aceRows)counts[aceBand(row)]++;
 return {ace:{day,attempts:Number(Boolean(ace&&ace.status!=='in-progress')),leaders:aceRows,counts,total:aceRows.length},three:localRoundBoard('three'),nine:localRoundBoard('nine')};
}
function personal(){
 const officialAce=read(aceKey(day)),legacyAce=read('irish-par-official:'+day);
 const ace=officialAce??legacyAce,count=streak(day);
 const aceHole=ace?(ace.hole??6):dailyAceHole(day);
 $('ace-lineup').textContent='Hole '+aceHole;
 const aceComplete=officialAce?officialAce.status==='completed':Boolean(legacyAce);
 const acePractice=$('practice-ace');
 acePractice.hidden=!aceComplete;
 $('warmup-ace').hidden=aceComplete;
 if(aceComplete)acePractice.href='./course/play.html?hole='+aceHole+'&practiceAce='+day+'&build='+buildId;
 else acePractice.removeAttribute('href');
 const pending=read('irish-par-ace-pending:'+day);
 const pendingSave=ace?.status==='in-progress'&&pending?.id===ace.id&&pending.revision===ace.revision;
 const playedToday=Boolean(legacyAce||ace?.status==='completed'||Object.keys(roundModes).some(kind=>savedRound(kind)?.status==='completed'));
 $('streak-count').textContent=count?count+'-day streak':'No streak yet';
 $('streak-status').textContent=playedToday?'Played today':count?'Play today to keep it':'Play today to start';
 $('streak').setAttribute('data-state',playedToday?'played':count?'at-risk':'new');
 $('ace-setup').textContent=aceComplete&&(!ace.setup||ace.legacy)?'Playing setup unavailable for this result':
     describeSetup(ace?.setup??dailyAceSetup(day,weather));
 $('ace-state').textContent=pendingSave?'Official shot awaiting save':ace?.status==='in-progress'?'Official shot ready · Resume today’s attempt':
     aceComplete?'Official result · '+(ace.outcome==='in-play'?nameOf(ace):ace.outcome==='water'?'Water':'Out of play'):'Not played today';
 $('play-ace').textContent=pendingSave?'Resume saving your shot':ace?.status==='in-progress'?'Resume official shot':ace?'Review today’s result':'Play Hole-in-One';$('play-ace').href='./course/play.html?hole='+aceHole+'&ace='+day+'&build='+buildId;
 $('three-lineup').textContent='Holes '+lineup('three').join(' → ');
 for(const [kind,{label,par}] of Object.entries(roundModes)){
  const round=savedRound(kind),setup=conditions(kind),complete=round?.status==='completed';
  $('practice-'+kind).hidden=!complete;
  $('warmup-'+kind).hidden=complete||round?.revision>0;
  $(kind+'-setup').textContent=describeSetup(setup);
  $(kind+'-state').textContent=complete?'Official result · '+scoreOf(totalScore(round),par):
      round?'Round in progress · Hole '+round.hole+' · '+totalScore(round)+' strokes':'Not played today';
  $('play-'+kind).textContent=complete?'Review today’s result':round?'Resume '+label:kind==='nine'?label:'Play '+label;
 }
}
function cellRow(values,tag='td'){const row=document.createElement('tr');for(const value of values){const cell=document.createElement(tag);cell.textContent=value;row.append(cell);}return row;}
function render(){
 personal();for(const type of types){
  const board=boards[type],leader=board?.leaders?.[0];$(type+'-leader').textContent=leader?.name||'No scores yet';
  $(type+'-leader-detail').textContent=leader?(type==='ace'?nameOf(leader):scoreOf(leader.total,roundModes[type].par)+' · Hole '+lineup(type).at(-1)+': '+tieOf(leader)):'';
  $('tab-'+type).setAttribute('aria-pressed',String(selected===type));
 }
 const historical=boardPeriod==='yesterday',date=historical?yesterday:day;
 $('board-date').setAttribute('datetime',date);
 $('board-date').textContent=displayDate(date);
 $('board-yesterday').setAttribute('aria-pressed',String(historical));
 $('board-today').setAttribute('aria-pressed',String(!historical));
 const board=historical?yesterdayBoards[selected]:boards[selected],par=roundModes[selected]?.par;
 const closingHole=(historical?dailyLineup(yesterday,selected):lineup(selected)).at(-1);
 $('board-source').textContent=historical?'Sample standings for this preview':sources[selected]==='shared'?'Shared leaderboard · Official first attempts':localOnly()?'Local preview leaderboard · Saved on this browser':sources[selected]==='stale'?'Showing last shared results · Refresh unavailable':'Shared leaderboard unavailable · Showing this browser’s saved results';
 const posted=board?.total??0;
 if(Number.isInteger(board?.attempts)){
  const attempts=board.attempts;
  $('board-source').textContent+=' · '+attempts+(attempts===1?' attempt':' attempts')+' · '+posted+' posted';
 }
 $('tie-rule').hidden=selected==='ace';$('tie-rule').textContent='Lowest total score wins. Ties use the first tee shot on Hole '+closingHole+'. Closer wins. Penalty shots rank behind in-play shots. Exact ties share rank.';$('board-head').replaceChildren(cellRow(selected==='ace'?['Rank','Player','Result']:['Rank','Player','Strokes','Hole '+closingHole+' tee shot'],'th'));
 let rows=board?.leaders??[];
 if(selected!=='ace')rows=rankedThree(rows);else{let rank=0,last;rows=rows.map((row,index)=>{if(!last||row.ace!==last.ace||row.mm!==last.mm)rank=index+1;last=row;return {...row,rank};});}
 $('board-rows').replaceChildren(...rows.map(row=>cellRow(selected==='ace'?[row.rank,row.name,nameOf(row)]:[row.rank,row.name,scoreOf(row.total,par),tieOf(row)])));
 $('board-empty').textContent=historical?'No scores were posted yesterday.':'No scores yet. Be the first on today’s leaderboard.';
 $('board-empty').hidden=rows.length>0;$('board-count').textContent=(board?.total??0)+((board?.total??0)===1?' player':' players')+' · Posted results';
 const bands=selected==='ace'?['Ace','Inside 3 ft','3–under 10 ft','10–under 25 ft','25 ft or more']:['Under par','Even par','+1 to +3','+4 to +6','+7 or more'];
 const counts=selected==='ace'?(board?.counts??[0,0,0,0,0]):[0,0,0,0,0];
 if(selected!=='ace')for(const row of board?.distribution??[])counts[row.total<par?0:row.total===par?1:row.total<=par+3?2:row.total<=par+6?3:4]+=row.count;
 $('distribution').replaceChildren(...bands.map((label,index)=>{const row=document.createElement('div'),name=document.createElement('span'),meter=document.createElement('meter'),count=document.createElement('span');name.textContent=label;meter.max=Math.max(1,board?.total??0);meter.value=counts[index];meter.setAttribute('aria-label',label+': '+counts[index]);count.textContent=counts[index];row.append(name,meter,count);return row;}));
}
async function refresh(){
 loadConditions();
 const local=localBoards();
 if(localOnly()){boards=local;render();return;}
 for(const type of types)if(!['shared','stale'].includes(sources[type]))boards[type]=local[type];
 render();
 if(refreshing)return;
 refreshing=true;
 try{
  await Promise.allSettled(types.map(async type=>{
   try{
    const response=await fetch(new URL('api/'+type,appRoot()),{cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw Error();
    const board=await response.json();
    if(board.day!==day||!Array.isArray(board.leaders))throw Error();
    boards[type]=board;sources[type]='shared';
   }catch{
    sources[type]=['shared','stale'].includes(sources[type])?'stale':'unavailable';
   }
  }));
 }finally{refreshing=false;render();}
}
let loadingWeather=false,weatherLoaded=false;
async function loadConditions(){
 if(!location.hostname.endsWith('.github.io')||loadingWeather||weatherLoaded)return;
 loadingWeather=true;
 $('today-conditions').hidden=false;
 $('conditions-summary').textContent='Loading Springhaven forecast…';
 try{
  weather=await challengeWeather(day);
  weatherLoaded=true;
  $('conditions-summary').textContent=weather?weatherSummary(weather):'Generated game conditions for today';
  $('conditions-source').textContent=weather?'Springhaven · National Weather Service 10 a.m. Eastern forecast · Locked for today’s challenges':'Springhaven · Daily forecast unavailable';
 }catch{
  $('conditions-summary').textContent='Springhaven forecast could not load. The game will retry.';
 }
 finally{loadingWeather=false;personal();}
}
async function playChallenge(kind,button,status){
 if(dayKey()!==day){location.reload();return;}
 if(kind==='ace'){location.href=$('play-ace').href;return;}
 button.disabled=true;
 try{location.href=officialURL(await startOfficial(kind));}
 catch(error){status.textContent=error.message;}finally{button.disabled=false;}
}
if(invitation&&invitation.day<=day){
 const {name,result}=describeChallenge(invitation),today=invitation.day===day;
 $('friend-title').textContent=name;
 $('friend-score').textContent=result;
 $('friend-prompt').textContent=today?'Can you beat it?':'This challenge has ended. Play today’s edition.';
 $('friend-status').textContent=today?'Today’s challenge ends at midnight Eastern.':'';
 const play=$('play-friend');
 play.onclick=()=>playChallenge(invitation.kind,play,$('friend-status'));
 $('friend-challenge').hidden=false;
}
function selectBoardDay(period){
 boardPeriod=period;
 render();
}
$('jump-yesterday').onclick=()=>{
 selectBoardDay('yesterday');
 $('leaderboards-title').focus({preventScroll:true});
};
for(const period of ['today','yesterday'])$('board-'+period).onclick=()=>selectBoardDay(period);
for(const type of types)$('tab-'+type).onclick=()=>{selected=type;render();};
for(const kind of Object.keys(roundModes)){
 const button=$('play-'+kind);
 button.onclick=()=>playChallenge(kind,button,$('home-status'));
 $('practice-'+kind).onclick=()=>{
  if(dayKey()!==day||savedRound(kind)?.status!=='completed')return;
  const id=String(Date.now()),setup=conditions(kind),holes=lineup(kind);
  const series={...newSeries(id,setup,holes),practiceDay:day};
  try{
   sessionStorage.setItem('irish-par-series-'+id,JSON.stringify(series));
   location.href='./course/play.html?'+new URLSearchParams({hole:holes[0],series:id,...setup,build:buildId});
  }catch{$('home-status').textContent='Allow browser storage to start a practice round.';}
 };
}
$('guide').hidden=Boolean(read('irish-par-hub-guide'));
$('dismiss-guide').onclick=()=>{try{localStorage.setItem('irish-par-hub-guide','true');}catch{}$('guide').hidden=true;};
$('how-play').onclick=()=>{$('guide').hidden=false;$('guide').scrollIntoView({block:'center'});};
window.addEventListener('focus',()=>{if(dayKey()!==day)location.reload();else refresh();});window.addEventListener('storage',refresh);
window.addEventListener('pageshow',event=>{if(event.persisted){if(dayKey()!==day)location.reload();else refresh();}});
showPreviewWinners();
refresh();

setInterval(()=>{if(document.hidden)return;if(dayKey()!==day)location.reload();else refresh();},30000);

window.addEventListener('beforeinstallprompt',event=>event.preventDefault());

const installButton=$('home-install'),standalone=window.matchMedia?.('(display-mode: standalone)');
const updateInstallButton=()=>{$('home-cta').hidden=Boolean(standalone?.matches||globalThis.navigator?.standalone);};
updateInstallButton();
standalone?.addEventListener('change',updateInstallButton);
installButton.onclick=()=>$('install-help').showModal();
