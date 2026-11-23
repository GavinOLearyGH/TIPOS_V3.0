import {clamp,ease,mix} from '../core/physics.mjs';

// Fairway centers in each hole's plan coordinates, from tee toward green.
// Use the playing corridor through carries and gaps between fairway and green.
const centerlines=[
    [[540,438],[690,430],[870,439],[1100,464],[1350,495],[1425,504]],
    [[665,592],[810,611],[1000,623],[1250,623],[1475,617],[1605,602],[1715,565]],
    [[1480,582],[1550,586],[1620,590],[1655,576]],
    [[800,237],[940,234],[1030,210],[1140,127],[1250,140],[1410,225],[1570,258],[1720,249],[1810,255]],
    [[820,331],[920,370],[1050,424],[1160,456],[1230,458],[1370,395],[1460,341],[1530,307],[1605,237],[1710,230],[1775,221]],
    [[750,276],[850,275],[940,282],[1040,269],[1112,245]],
    [[680,286],[870,282],[1120,256],[1360,257],[1570,238],[1700,228],[1760,211]],
    [[530,289],[730,320],[950,340],[1150,364],[1350,369],[1510,347],[1670,300],[1770,268]],
    [[1410,374],[1510,345],[1580,306],[1670,316],[1730,321]]
];

const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const between=(a,b,t)=>({x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)});

export function flyoverPath(course,tee){
    const {minX,maxX,minZ,maxZ}=course.greenBounds;
    const center={x:(minX+maxX)/2,z:(minZ+maxZ)/2};
    const unit=course.plan.metresPerUnit;
    const corridor=(centerlines[course.number-1]??[]).map(([x,z])=>({x:x*unit,z:z*unit}));
    const points=[tee,...corridor.filter(p=>p.x>tee.x+3),center];
    const samples=[{point:tee,at:0}];
    function append(point){
        const previous=samples.at(-1),length=distance(previous.point,point);
        if(length>.00001)samples.push({point,at:previous.at+length});
    }
    for(let i=1;i<points.length-1;i++){
        const [before,pivot,after]=points.slice(i-1,i+2);
        const cut=Math.min(10,distance(before,pivot)*.27,distance(after,pivot)*.27);
        const entry=between(pivot,before,cut/distance(before,pivot));
        const exit=between(pivot,after,cut/distance(after,pivot));
        append(entry);
        for(let j=1;j<=8;j++){
            const t=j/8;
            append(between(between(entry,pivot,t),between(pivot,exit,t),t));
        }
    }
    append(center);
    const length=samples.at(-1).at;
    function at(travel){
        if(travel<=0)return tee;
        if(travel>=length)return center;
        const index=samples.findIndex(s=>s.at>=travel),a=samples[index-1],b=samples[index];
        return between(a.point,b.point,(travel-a.at)/(b.at-a.at));
    }
    return {length,center,at};
}

export function flyoverCamera(course,path,progress,aspect){
    const {length,center,at}=path;
    const {minX,maxX,minZ,maxZ}=course.greenBounds;
    const breadth=Math.max(Math.hypot(maxX-minX,maxZ-minZ)+6,(course.green?.readRadius??22)*2);
    const framing=.85*breadth*Math.max(1,1.1/aspect);
    const endTravel=Math.max(0,length-framing*.58);
    const greenY=course.ground(center.x,center.z);
    const u=clamp(progress,0,1),travel=endTravel*ease(u);
    const point=at(travel),ahead=at(travel+24);
    const first=at(8),tee=at(0),initialAngle=Math.atan2(first.z-tee.z,first.x-tee.x);
    const setback=4*(1-ease(travel/14));
    const ground=course.ground(point.x,point.z),aheadGround=course.ground(ahead.x,ahead.z);
    const startClimb=ease(travel/35);
    const cruise=ground+1.55+startClimb*(23+Math.max(0,aheadGround-ground));
    const arrive=ease((u-.73)/.27);
    const eye=[point.x-Math.cos(initialAngle)*setback,
        mix(cruise,greenY+framing*.9,arrive),
        point.z-Math.sin(initialAngle)*setback];
    const target=[mix(ahead.x,center.x,arrive),mix(aheadGround,greenY,arrive),mix(ahead.z,center.z,arrive)];
    return {eye,target};
}
