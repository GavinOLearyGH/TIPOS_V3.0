import {dailySetup,rankedThree} from '../core/competition.mjs';
import {buildId} from '../core/build-info.mjs';
import {dayKey,read,threeKey,startOfficial,officialURL,localOnly,appRoot,totalScore,streak} from '../core/daily-client.mjs';
import {newSeries} from '../core/series.mjs';
import {refreshParentWorker} from '../core/updates.mjs';
const $=id=>document.getElementById(id),day=dayKey(),setup=dailySetup(day);
let selected=new URLSearchParams(location.search).get('board')==='three'?'three':'ace',boards={ace:null,three:null},sources={ace:'local',three:'local'},requestNumber=0;
refreshParentWorker();
$('today').textContent=new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/New_York'});
$('build-version').textContent='Build '+buildId;
$('practice-ace').href='./ace.html?hub=1&practice=1&build='+buildId;
$('three-setup').textContent={1896:'1896 (Black)',rawlins:'Rawlins (Blue)',butler:'Butler (Silver)',dixon:'Dixon (White)'}[setup.tee]+' · '+setup.mph+' mph prevailing wind · '+({'.8':'Slow','1':'Medium','1.24':'Fast'}[setup.speed])+' greens';
const nameOf=score=>score.ace?'Hole in one':(score.mm/304.8).toFixed(1)+' ft';
const tieOf=score=>score.tieValid?(score.tieMM===0?'Ace':(score.tieMM/304.8).toFixed(1)+' ft'):'Penalty';
const scoreOf=total=>total+' ('+(total===12?'E':total>12?'+'+(total-12):total-12)+')';
function localBoards(){
 const ace=read('irish-par-official:'+day),three=read(threeKey(day)),counts=[0,0,0,0,0];
 const aceRows=ace?.name&&ace.outcome==='in-play'?[ace]:[];for(const row of aceRows)counts[row.ace?0:row.mm<914.4?1:row.mm<3048?2:row.mm<7620?3:4]++;
 return {ace:{day,leaders:aceRows,counts,total:aceRows.length},three:{day,leaders:three?.name&&three.status==='completed'?[{name:three.name,total:totalScore(three),tieValid:three.tieValid,tieMM:three.tieMM}]:[],
  distribution:three?.name&&three.status==='completed'?[{total:totalScore(three),count:1}]:[],total:three?.name&&three.status==='completed'?1:0}};
}
function personal(){
 const ace=read('irish-par-official:'+day),three=read(threeKey(day)),count=streak(day);
 $('streak').textContent=count?count+'-day streak · Complete either challenge to keep it going.':'Start your streak · Complete either daily challenge.';
 $('ace-state').textContent=ace?'Official result: '+(ace.outcome==='in-play'?nameOf(ace):ace.outcome==='water'?'Water · Streak kept':'Out of play · Streak kept'):'Not played today';
 $('play-ace').textContent=ace?'Review today’s result':'Play Hole-in-One';$('play-ace').href='./ace.html?hub=1'+(ace?'&review=1':'')+'&build='+buildId;
 $('three-state').textContent=three?.status==='completed'?'Official result: '+scoreOf(totalScore(three)):three?'Round in progress · Hole '+three.hole+' · '+totalScore(three)+' strokes':'Not played today';
 $('play-three').textContent=three?.status==='completed'?'Review official round':three?'Resume official round':'Play Three Holes';
}
function cellRow(values,tag='td'){const row=document.createElement('tr');for(const value of values){const cell=document.createElement(tag);cell.textContent=value;row.append(cell);}return row;}
function render(){
 personal();for(const type of ['ace','three']){
  const board=boards[type],leader=board?.leaders?.[0];$(type+'-leader').textContent=leader?.name||'No scores yet';
  $(type+'-leader-detail').textContent=leader?(type==='ace'?nameOf(leader):scoreOf(leader.total)+' · Hole 3: '+tieOf(leader)):'';
  $('tab-'+type).setAttribute('aria-pressed',String(selected===type));
 }
 const board=boards[selected];$('board-source').textContent=sources[selected]==='shared'?'Shared leaderboard · Official first attempts':localOnly()?'Local preview leaderboard · Saved on this browser':'Shared leaderboard unavailable · Showing this browser’s saved results';
 $('tie-rule').hidden=selected!=='three';$('board-head').replaceChildren(cellRow(selected==='ace'?['Rank','Player','Result']:['Rank','Player','Strokes','Hole 3 tee shot'],'th'));
 let rows=board?.leaders??[];
 if(selected==='three')rows=rankedThree(rows);else{let rank=0,last;rows=rows.map((row,index)=>{if(!last||row.ace!==last.ace||row.mm!==last.mm)rank=index+1;last=row;return {...row,rank};});}
 $('board-rows').replaceChildren(...rows.map(row=>cellRow(selected==='ace'?[row.rank,row.name,nameOf(row)]:[row.rank,row.name,scoreOf(row.total),tieOf(row)])));
 $('board-empty').hidden=rows.length>0;$('board-count').textContent=(board?.total??0)+' players · First attempts';
 const bands=selected==='ace'?['Ace','Inside 3 ft','3–under 10 ft','10–under 25 ft','25 ft or more']:['Under par','Even par','+1 to +3','+4 to +6','+7 or more'];
 const counts=selected==='ace'?(board?.counts??[0,0,0,0,0]):[0,0,0,0,0];
 if(selected==='three')for(const row of board?.distribution??[])counts[row.total<12?0:row.total===12?1:row.total<=15?2:row.total<=18?3:4]+=row.count;
 $('distribution').replaceChildren(...bands.map((label,index)=>{const row=document.createElement('div'),name=document.createElement('span'),meter=document.createElement('meter'),count=document.createElement('span');name.textContent=label;meter.max=Math.max(1,board?.total??0);meter.value=counts[index];meter.setAttribute('aria-label',label+': '+counts[index]);count.textContent=counts[index];row.append(name,meter,count);return row;}));
}
async function refresh(){const version=++requestNumber;boards=localBoards();render();if(localOnly())return;
 await Promise.allSettled(['ace','three'].map(async type=>{try{const response=await fetch(new URL('api/'+(type==='ace'?'leaderboard':'three'),appRoot()),{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error();const board=await response.json();if(board.day!==day||!Array.isArray(board.leaders))throw Error();if(version===requestNumber){boards[type]=board;sources[type]='shared';render();}}catch{if(version===requestNumber){sources[type]='unavailable';$('home-status').textContent='Shared scores could not be loaded. Showing results saved on this browser.';render();}}}));}
for(const type of ['ace','three'])$('tab-'+type).onclick=()=>{selected=type;render();};
$('play-three').onclick=async()=>{const button=$('play-three');button.disabled=true;try{const session=await startOfficial();location.href=officialURL(session);}catch(error){$('home-status').textContent=error.message;}finally{button.disabled=false;}};
$('practice-three').onclick=()=>{const id=String(Date.now()),series=newSeries(id,setup);try{sessionStorage.setItem('irish-par-series-'+id,JSON.stringify(series));location.href='./course/play.html?'+new URLSearchParams({hole:1,series:id,...setup,build:buildId});}catch{$('home-status').textContent='Allow browser storage to play a three-hole practice round.';}};
$('guide').hidden=Boolean(read('irish-par-hub-guide'));
$('dismiss-guide').onclick=()=>{try{localStorage.setItem('irish-par-hub-guide','true');}catch{}$('guide').hidden=true;};
$('how-play').onclick=()=>{$('guide').hidden=false;$('guide').scrollIntoView({block:'center'});};
window.addEventListener('focus',()=>{if(dayKey()!==day)location.reload();else refresh();});window.addEventListener('storage',refresh);
refresh();

setInterval(()=>{if(document.hidden)return;if(dayKey()!==day)location.reload();else refresh();},30000);
