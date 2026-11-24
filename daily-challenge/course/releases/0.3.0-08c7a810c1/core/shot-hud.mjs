import {powerHeight} from './view-controls.mjs';

export function updatePowerRail(get,power){
    get('power').setAttribute('aria-valuenow',String(Math.round(power*100)));
    get('power-fill').style.height=powerHeight(power)+'%';
    get('power-label').textContent=Math.round(power*100)+'%';
}

export function drawShotMap(minimap,atlas,course,{ball:ballPosition,trail=[],targets=[],aim:aimPoint,selectedTarget=null,start=null}){
    const c=minimap.getContext('2d'),b=course.bounds;
    const pointOnMap=point=>({x:12+(point.z-b.minZ)/(b.maxZ-b.minZ)*(minimap.width-24),
        y:12+(1-(point.x-b.minX)/(b.maxX-b.minX))*(minimap.height-24)});
    c.clearRect(0,0,minimap.width,minimap.height);
    c.save();
    c.translate(12,minimap.height-12);
    c.transform(0,-(minimap.height-24)/atlas.width,(minimap.width-24)/atlas.height,0,0,0);
    const ab=course.atlasBounds??b;
    c.drawImage(atlas,(b.minX-ab.minX)/(ab.maxX-ab.minX)*atlas.width,(b.minZ-ab.minZ)/(ab.maxZ-ab.minZ)*atlas.height,
        (b.maxX-b.minX)/(ab.maxX-ab.minX)*atlas.width,(b.maxZ-b.minZ)/(ab.maxZ-ab.minZ)*atlas.height,0,0,atlas.width,atlas.height);c.restore();
    for(const feature of course.mapFeatures??[]){c.fillStyle=feature.color;c.beginPath();feature.points.forEach((point,index)=>{const p=pointOnMap(point);if(index)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.closePath();c.fill();}
    if(trail.length){
        c.strokeStyle='#ffe4a0';c.lineWidth=2.5;c.beginPath();
        trail.forEach((point,index)=>{const p=pointOnMap(point);if(index)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});
        c.stroke();
    }
    for(const target of targets){
        const point=pointOnMap(target);
        c.fillStyle='#f3cc74';c.beginPath();c.arc(point.x,point.y,target.radius??6,0,Math.PI*2);c.fill();
    }
    if(start){
        const tee=pointOnMap(start);
        c.strokeStyle='white';c.lineWidth=1.5;c.beginPath();
        c.rect(tee.x-4,tee.y-4,8,8);c.stroke();
    }
    const ball=pointOnMap(ballPosition);
    if(aimPoint){
        const aim=pointOnMap(aimPoint);
        c.strokeStyle='#fff4b8';c.lineWidth=2;c.beginPath();c.moveTo(ball.x,ball.y);c.lineTo(aim.x,aim.y);c.stroke();
    }
    if(selectedTarget){
        const point=pointOnMap(selectedTarget);
        c.strokeStyle='#ffe4a0';c.lineWidth=2.5;c.beginPath();
        c.arc(point.x,point.y,(selectedTarget.radius??6)+5,0,Math.PI*2);c.stroke();
    }
    c.fillStyle='white';c.strokeStyle='#213322';c.lineWidth=2;c.beginPath();c.arc(ball.x,ball.y,5,0,Math.PI*2);c.fill();c.stroke();
}
