import {dayKey,newCompetition,applyCompetitionShot,totalScore} from './competition.mjs';
import {buildId} from './build-info.mjs';
export {dayKey,totalScore};
export const threeKey=day=>'irish-par-three:'+day;
export function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
export function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
export function randomId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');}
export function playerId(){let id=read('springhaven-player-id');if(!/^[a-f0-9]{32}$/.test(id)){id=randomId();write('springhaven-player-id',id);}return id;}
export function appRoot(){const url=new URL(location.href),index=url.pathname.indexOf('/course/');return index>=0?new URL(url.pathname.slice(0,index+1),url):new URL('./',url);}
export function localOnly(){return location.protocol==='file:'||location.hostname.endsWith('.github.io');}
async function request(action,data={}){
 const response=await fetch(new URL('api/three',appRoot()),{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,player:playerId(),...data}),signal:AbortSignal.timeout(15000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Shared scoring could not be reached');return result;
}
export async function startOfficial(){
 const day=dayKey();let session=read(threeKey(day));
 if(localOnly()){if(!session){session=newCompetition(day,buildId,randomId());write(threeKey(day),session);}}
 else{session=await request('start',{day,build:buildId,id:session?.id??randomId()});write(threeKey(day),session);}
 return session;
}
export async function submitOfficialShot(session,shot){
 if(session.day!==dayKey())throw Error('This daily challenge has closed. Your saved round is retained. Return to Daily Challenge to play today.');
 const next=localOnly()?applyCompetitionShot(session,shot):await request('shot',{day:session.day,id:session.id,revision:session.revision,shot});
 write(threeKey(session.day),next);return next;
}
export async function publishThree(session,name){
 name=name.trim().replace(/\s+/g,' ');if(!name||name.length>28)throw Error('Enter a name of up to 28 characters');
 if(session.day!==dayKey())throw Error('This daily challenge has closed');
 if(session.status!=='completed')throw Error('Complete all three holes first');
 const next=localOnly()?{...session,name:session.name||name}:await request('publish',{day:session.day,id:session.id,name});
 write(threeKey(next.day),next);return next;
}
export function officialURL(session){const url=new URL('course/releases/'+session.build+'/course/play.html',appRoot());url.searchParams.set('official',session.day);url.searchParams.set('hole',session.hole);return url.href;}
export function streak(day=dayKey()){
 const completed=date=>Boolean(read('irish-par-official:'+date)||read(threeKey(date))?.status==='completed');
 const previous=date=>new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 let count=0;for(let date=completed(day)?day:previous(day);completed(date);date=previous(date))count++;return count;
}
