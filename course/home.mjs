import {gameLinks} from '../core/navigation.mjs';
import {randomWindSetup} from '../core/wind.mjs';
import {newSeries} from '../core/series.mjs';
import {buildId} from '../core/build-info.mjs';
import {refreshParentWorker} from '../core/updates.mjs';
import {playableHoles as courseCatalog} from './catalog.mjs';
import {surfaceColors} from '../core/renderer.mjs';
const links=gameLinks(location.href);links.home+='?build='+buildId;links.practice+='?build='+buildId;
document.getElementById('daily-home').href=links.home;
refreshParentWorker();
document.getElementById('build-version').textContent='Build '+buildId;
const ns='http://www.w3.org/2000/svg';
for(const hole of courseCatalog){
    const card=document.getElementById('hole-template').content.cloneNode(true),article=card.querySelector('article');
    card.querySelector('.hole-number').textContent='HOLE '+hole.number+' · PAR '+hole.par;
    const title=card.querySelector('h2');title.id='hole-title-'+hole.number;title.textContent=hole.title??hole.name;
    article.setAttribute('aria-labelledby',title.id);
    card.querySelector('.hole-description').textContent=hole.description;
    const select=card.querySelector('select'),play=card.querySelector('.play-hole');
    select.setAttribute('aria-label','Tee for Hole '+hole.number);
    for(const tee of hole.tees)select.add(new Option(tee.name+' · '+tee.yards+' yd',tee.id));
    play.textContent='Play Hole '+hole.number;
    select.onchange=()=>{play.href=links.player+'?hole='+hole.number+'&tee='+select.value+'&build='+buildId;};select.onchange();
    const svg=document.createElementNS(ns,'svg'),b=hole.bounds,k=hole.plan.metresPerUnit;
    svg.setAttribute('viewBox',[b.minX/k,b.minZ/k,(b.maxX-b.minX)/k,(b.maxZ-b.minZ)/k].join(' '));
    svg.setAttribute('role','img');svg.setAttribute('aria-label','Hole '+hole.number+' overhead layout');
    const shape=(d,fill)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill',fill);svg.append(p);};
    for(const kind of ['tee','fairway','surround','water','green','sand','bridge'])if(hole.shapes[kind])shape(hole.shapes[kind],surfaceColors[kind]);
    for(const feature of hole.landforms??[])shape(feature.shape,'#87764d');
    if(hole.pews)for(let i=0;i<hole.pews.count;i++){
        const p=hole.pews,line=document.createElementNS(ns,'path');line.setAttribute('d',`M${p.x+i*p.spacing} ${p.z-p.length/2}v${p.length}`);
        line.setAttribute('stroke','#8a9353');line.setAttribute('stroke-width',p.width);svg.append(line);
    }
    card.querySelector('.hole-art').append(svg);document.getElementById('holes').append(card);
}

document.getElementById('play-three').onclick=()=>{
    const id=String(Date.now()),setup={tee:document.getElementById('series-tee').value,...randomWindSetup(),speed:'1'};
    try{sessionStorage.setItem('irish-par-series-'+id,JSON.stringify(newSeries(id,setup)));}
    catch{document.getElementById('play-three').textContent='Enable browser storage to play a three-hole round';return;}
    location.href=links.player+'?'+new URLSearchParams({hole:1,series:id,...setup,build:buildId});
};
