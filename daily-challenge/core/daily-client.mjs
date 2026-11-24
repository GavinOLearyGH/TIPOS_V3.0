import {themedURL} from './club-theme.mjs';
import {gameRoot} from './navigation.mjs';
import {dayKey,newCompetition,applyCompetitionShot,totalScore} from './competition.mjs';
import {loadPreviewWeather} from './daily-weather.mjs';
import {buildId} from './build-info.mjs';
export {dayKey,totalScore};
export const aceKey=day=>'irish-par-ace:'+day;
export const nineKey=day=>'irish-par-nine:'+day;
const modeKey=(kind,day)=>kind==='ace'?aceKey(day):kind==='nine'?nineKey(day):threeKey(day);
export const sessionKey=session=>modeKey(session.kind,session.day);
export const threeKey=day=>'irish-par-three:'+day;
export function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
export function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
export function randomId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');}
export function playerId(){let id=read('springhaven-player-id');if(!/^[a-f0-9]{32}$/.test(id)){id=randomId();write('springhaven-player-id',id);}return id;}
export function appRoot(){return gameRoot(location.href);}
export function localOnly(){return location.protocol==='file:'||location.hostname.endsWith('.github.io');}
export function challengeWeather(day){
 return location.hostname.endsWith('.github.io')?loadPreviewWeather(day):Promise.resolve(null);
}
async function request(action,data={},kind='three'){
 const response=await fetch(new URL('api/'+(kind??'three'),appRoot()),{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,player:playerId(),...data}),signal:AbortSignal.timeout(15000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Shared scoring could not be reached');return result;
}
export async function startOfficial(kind='three'){
 const day=dayKey(),key=modeKey(kind,day);let session=read(key);
 if(localOnly()){if(!session){const old=kind==='ace'?read('irish-par-official:'+day):null;
 session=newCompetition(day,buildId,randomId(),kind,old?null:await challengeWeather(day));
 if(old)session={...session,...old,kind:'ace',legacy:true,status:'completed',state:{...session.state,complete:true}};
 write(key,session);}}
 else{session=await request('start',{day,build:buildId,id:session?.id??randomId()},kind);write(key,session);}
 return session;
}
export async function submitOfficialShot(session,shot){
 if(session.day!==dayKey())throw Error('This daily challenge has closed. Your saved round is retained. Return to Daily Challenge to play today.');
 const next=localOnly()?applyCompetitionShot(session,shot):await request('shot',{day:session.day,id:session.id,revision:session.revision,shot},session.kind);
 write(sessionKey(session),next);return next;
}
export async function publishThree(session,name){
 name=name.trim().replace(/\s+/g,' ');if(!name||name.length>28)throw Error('Enter a name of up to 28 characters');
 if(session.day!==dayKey())throw Error('This daily challenge has closed');
 if(session.status!=='completed')throw Error(session.kind==='nine'?'Complete all nine holes first':'Complete all three holes first');
 const next=localOnly()?{...session,name:session.name||name}:await request('publish',{day:session.day,id:session.id,name},session.kind);
 write(sessionKey(next),next);return next;
}
export function officialURL(session){const url=new URL('course/releases/'+session.build+'/course/play.html',appRoot());url.searchParams.set(session.kind==='ace'?'ace':'official',session.day);if(session.kind==='nine')url.searchParams.set('mode','nine');url.searchParams.set('hole',session.hole);return themedURL(url).href;}
export function streak(day=dayKey()){
 const completed=date=>Boolean(read('irish-par-official:'+date)||read(aceKey(date))?.status==='completed'||read(threeKey(date))?.status==='completed'||read(nineKey(date))?.status==='completed');
 const previous=date=>new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 let count=0;for(let date=completed(day)?day:previous(day);completed(date);date=previous(date))count++;return count;
}
