import {dailySetup,dailyLineup,rankedThree} from '../core/competition.mjs';
import {buildId} from '../core/build-info.mjs';
import {dayKey,read,threeKey,nineKey,aceKey,startOfficial,officialURL,localOnly,appRoot,totalScore,streak} from '../core/daily-client.mjs';
import {newSeries,roundHoles,roundModes} from '../core/series.mjs';
import {refreshParentWorker} from '../core/updates.mjs';
const $=id=>document.getElementById(id),day=dayKey(),types=['ace','three','nine'];
const requestedBoard=new URLSearchParams(location.search).get('board');
let selected=types.includes(requestedBoard)?requestedBoard:'ace',boards={},sources={},refreshing=false;
const savedRound=kind=>read((kind==='nine'?nineKey:threeKey)(day));
const lineup=kind=>{const saved=savedRound(kind);return saved?roundHoles(saved):dailyLineup(day,kind);};
const conditions=kind=>savedRound(kind)?.setup??dailySetup(day,kind);
const teeNames={1896:'1896 (Black)',rawlins:'Rawlins (Blue)',butler:'Butler (Silver)',dixon:'Dixon (White)'};
const speeds={'.8':'Slow','1':'Medium','1.24':'Fast'};
refreshParentWorker();
$('today').textContent=new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/New_York'});
$('build-version').textContent='Build '+buildId;
$('practice-selection').href='./course/?build='+buildId;
$('practice-cross-country').href='./course/cross-country.html?build='+buildId;
const nameOf=score=>score.ace?'Hole in one':(score.mm/304.8).toFixed(1)+' ft';
const tieOf=score=>score.tieValid?(score.tieMM===0?'Ace':(score.tieMM/304.8).toFixed(1)+' ft'):'Penalty';
const scoreOf=(total,par)=>total+' ('+(total===par?'E':total>par?'+'+(total-par):total-par)+')';
function localRoundBoard(kind){
 const round=savedRound(kind);
 if(!round?.name||round.status!=='completed')return {day,leaders:[],distribution:[],total:0};
 const total=totalScore(round);
 return {day,leaders:[{name:round.name,total,tieValid:round.tieValid,tieMM:round.tieMM}],distribution:[{total,count:1}],total:1};
}
function localBoards(){
 const ace=read(aceKey(day))??read('irish-par-official:'+day),counts=[0,0,0,0,0];
 const aceRows=ace?.name&&ace.outcome==='in-play'?[ace]:[];for(const row of aceRows)counts[row.ace?0:row.mm<914.4?1:row.mm<3048?2:row.mm<7620?3:4]++;
 return {ace:{day,leaders:aceRows,counts,total:aceRows.length},three:localRoundBoard('three'),nine:localRoundBoard('nine')};
}
function personal(){
 const officialAce=read(aceKey(day)),legacyAce=read('irish-par-official:'+day);
 const ace=officialAce??legacyAce,count=streak(day);
 const aceComplete=officialAce?officialAce.status==='completed':Boolean(legacyAce);
 const acePractice=$('practice-ace');
 acePractice.hidden=!aceComplete;
 if(aceComplete)acePractice.href='./course/play.html?hole=6&practiceAce='+day+'&build='+buildId;
 else acePractice.removeAttribute('href');
 const pending=read('irish-par-ace-pending:'+day);
 const pendingSave=ace?.status==='in-progress'&&pending?.id===ace.id&&pending.revision===ace.revision;
 const playedToday=Boolean(legacyAce||ace?.status==='completed'||Object.keys(roundModes).some(kind=>savedRound(kind)?.status==='completed'));
 $('streak').textContent=playedToday?count+'-day streak · You’ve played today.':count?count+'-day streak · Complete any daily challenge to keep your streak going.':'Start your streak · Complete any daily challenge.';
 $('ace-state').textContent=pendingSave?'Official shot awaiting save':ace?.status==='in-progress'?'Official shot ready · Resume today’s attempt':ace?(ace.outcome==='in-play'?'Played today · '+nameOf(ace):ace.outcome==='water'?'Played today · Water':'Played today · Out of play'):'Not played today';
 $('play-ace').textContent=pendingSave?'Resume saving your shot':ace?.status==='in-progress'?'Resume official shot':ace?'Review today’s result':'Play Hole-in-One';$('play-ace').href='./course/play.html?hole=6&ace='+day+'&build='+buildId;
 $('three-lineup').textContent='Today’s holes · '+lineup('three').join(' → ');
 for(const [kind,{label,par}] of Object.entries(roundModes)){
  const round=savedRound(kind),setup=conditions(kind),complete=round?.status==='completed';
  $('practice-'+kind).hidden=!complete;
  $(kind+'-setup').textContent=teeNames[setup.tee]+' · '+setup.mph+' mph prevailing wind · '+speeds[setup.speed]+' greens';
  $(kind+'-state').textContent=complete?'Official result: '+scoreOf(totalScore(round),par):
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
 const board=boards[selected],par=roundModes[selected]?.par,closingHole=lineup(selected).at(-1);$('board-source').textContent=sources[selected]==='shared'?'Shared leaderboard · Official first attempts':localOnly()?'Local preview leaderboard · Saved on this browser':sources[selected]==='stale'?'Showing last shared results · Refresh unavailable':'Shared leaderboard unavailable · Showing this browser’s saved results';
 $('tie-rule').hidden=selected==='ace';$('tie-rule').textContent='Lowest total score wins. Ties use the first tee shot on Hole '+closingHole+'. Closer wins. Penalty shots rank behind in-play shots. Exact ties share rank.';$('board-head').replaceChildren(cellRow(selected==='ace'?['Rank','Player','Result']:['Rank','Player','Strokes','Hole '+closingHole+' tee shot'],'th'));
 let rows=board?.leaders??[];
 if(selected!=='ace')rows=rankedThree(rows);else{let rank=0,last;rows=rows.map((row,index)=>{if(!last||row.ace!==last.ace||row.mm!==last.mm)rank=index+1;last=row;return {...row,rank};});}
 $('board-rows').replaceChildren(...rows.map(row=>cellRow(selected==='ace'?[row.rank,row.name,nameOf(row)]:[row.rank,row.name,scoreOf(row.total,par),tieOf(row)])));
 $('board-empty').hidden=rows.length>0;$('board-count').textContent=(board?.total??0)+((board?.total??0)===1?' player':' players')+' · Official results';
 const bands=selected==='ace'?['Ace','Inside 3 ft','3–under 10 ft','10–under 25 ft','25 ft or more']:['Under par','Even par','+1 to +3','+4 to +6','+7 or more'];
 const counts=selected==='ace'?(board?.counts??[0,0,0,0,0]):[0,0,0,0,0];
 if(selected!=='ace')for(const row of board?.distribution??[])counts[row.total<par?0:row.total===par?1:row.total<=par+3?2:row.total<=par+6?3:4]+=row.count;
 $('distribution').replaceChildren(...bands.map((label,index)=>{const row=document.createElement('div'),name=document.createElement('span'),meter=document.createElement('meter'),count=document.createElement('span');name.textContent=label;meter.max=Math.max(1,board?.total??0);meter.value=counts[index];meter.setAttribute('aria-label',label+': '+counts[index]);count.textContent=counts[index];row.append(name,meter,count);return row;}));
}
async function refresh(){
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
for(const type of types)$('tab-'+type).onclick=()=>{selected=type;render();};
for(const kind of Object.keys(roundModes)){
 const button=$('play-'+kind);
 button.onclick=async()=>{button.disabled=true;try{location.href=officialURL(await startOfficial(kind));}
 catch(error){$('home-status').textContent=error.message;}finally{button.disabled=false;}};
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
refresh();

setInterval(()=>{if(document.hidden)return;if(dayKey()!==day)location.reload();else refresh();},30000);

const installButton=$('install');
const standalone=window.matchMedia?.('(display-mode: standalone)');
const device=globalThis.navigator;
const appleMobile=/iPad|iPhone|iPod/.test(device?.userAgent??'')||(device?.platform==='MacIntel'&&device.maxTouchPoints>1);
if(appleMobile){
 installButton.textContent='Add to Home Screen';
 $('install-title').textContent='Add to Home Screen';
 $('apple-install-steps').hidden=false;
 $('apple-install-note').hidden=false;
 $('install-steps').hidden=true;
}
let installPrompt;
const updateInstallButton=()=>{installButton.hidden=Boolean(standalone?.matches||globalThis.navigator?.standalone);};
updateInstallButton();
standalone?.addEventListener('change',updateInstallButton);
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 installPrompt=event;
});
window.addEventListener('appinstalled',()=>{
 installPrompt=undefined;
 installButton.hidden=true;
});
installButton.onclick=async()=>{
 if(!appleMobile&&installPrompt){
  const prompt=installPrompt;
  installPrompt=undefined;
  try{await prompt.prompt();return;}catch{}
 }
 if(!appleMobile)$('install-steps').textContent='Open your browser menu and choose Install app or Add to Home Screen, if available.';
 $('install-help').showModal();
};
