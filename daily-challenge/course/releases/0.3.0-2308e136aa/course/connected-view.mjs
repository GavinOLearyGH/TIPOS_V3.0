import {createCourse} from '../core/course.mjs';
import {geometryPath,containsPoint} from '../core/geometry.mjs';
import {clamp,ease,mix} from '../core/physics.mjs';
import {hole1} from './holes/hole-1.mjs';
import {hole2} from './holes/hole-2.mjs';
import {hole8} from './holes/hole-8.mjs';

const scale=hole8.plan.metresPerUnit;
const aerial=(x,z)=>({x:x*scale,z:z*scale});
// First-pass registration from the Hole 8 aerial. Positions are in metres on
// Hole 8's plan, with Hole 1 bearing reversed through the Church Pews.
const pewCenter=hole=>({
    x:(hole.pews.x+(hole.pews.count-1)*hole.pews.spacing/2)*hole.plan.metresPerUnit,
    z:hole.pews.z*hole.plan.metresPerUnit
});
const heading=(from,to)=>Math.atan2(to.z-from.z,to.x-from.x);
const firstGreen=aerial(127,392);
const firstAngle=heading(firstGreen,pewCenter(hole8))-heading(hole1.pins[0],pewCenter(hole1));
const definitions=[
    {hole:hole1,anchor:firstGreen,angle:firstAngle},
    {hole:hole2,anchor:aerial(1851,102),angle:(hole2.bearing-hole8.bearing)*Math.PI/180},
    {hole:hole8,anchor:hole8.pins[0],angle:0}
];

function placement({hole,anchor,angle}){
    const c=Math.cos(angle),s=Math.sin(angle),pin=hole.pins[0];
    return {a:c,b:s,x:anchor.x-c*pin.x+s*pin.z,z:anchor.z-s*pin.x-c*pin.z};
}
function localToMap(transform,x,z){
    return {x:transform.a*x-transform.b*z+transform.x,z:transform.b*x+transform.a*z+transform.z};
}
function mapToLocal(transform,x,z){
    return {x:transform.a*(x-transform.x)+transform.b*(z-transform.z),
        z:-transform.b*(x-transform.x)+transform.a*(z-transform.z)};
}
function distanceFromBounds(bounds,x,z){
    return Math.hypot(x-clamp(x,bounds.minX,bounds.maxX),z-clamp(z,bounds.minZ,bounds.maxZ));
}
function corners({minX,maxX,minZ,maxZ}){
    return [[minX,minZ],[minX,maxZ],[maxX,minZ],[maxX,maxZ]];
}

export function makeConnectedView(active){
    if(!definitions.some(entry=>entry.hole.number===active.number))return null;
    const entries=definitions.map(definition=>({...definition,transform:placement(definition),
        course:definition.hole.number===active.number?active:createCourse(definition.hole)}));
    const current=entries.find(entry=>entry.hole.number===active.number);
    const toActive=(entry,x,z)=>{
        const point=localToMap(entry.transform,x,z);
        return mapToLocal(current.transform,point.x,point.z);
    };
    const toEntry=(entry,x,z)=>{
        const point=localToMap(current.transform,x,z);
        return mapToLocal(entry.transform,point.x,point.z);
    };
    const neighbours=entries.filter(entry=>entry!==current);
    const extent=entries.flatMap(entry=>corners(entry.course.bounds).map(([x,z])=>toActive(entry,x,z)));
    const padding=28;
    const bounds={minX:Math.min(...extent.map(p=>p.x))-padding,maxX:Math.max(...extent.map(p=>p.x))+padding,
        minZ:Math.min(...extent.map(p=>p.z))-padding,maxZ:Math.max(...extent.map(p=>p.z))+padding};

    function ground(x,z){
        const distance=distanceFromBounds(active.bounds,x,z);
        const base=active.ground(x,z);
        if(distance===0)return base;

        // Continue the active surface at the edge, then blend into the closest
        // aligned hole. Only the wider view uses this provisional grading.
        let total=0,weight=0;
        for(const entry of neighbours){
            const local=toEntry(entry,x,z);
            const proximity=distanceFromBounds(entry.course.bounds,local.x,local.z);
            if(proximity>=28)continue;
            const influence=1-ease(proximity/28);
            total+=entry.course.ground(local.x,local.z)*influence;
            weight+=influence;
        }
        const outer=weight?mix(base,total/weight,Math.min(weight,1)):base;
        return mix(base,outer,ease(distance/18));
    }

    const layers=[...neighbours,current].map(entry=>{
        const origin=toActive(entry,0,0),east=toActive(entry,1,0);
        const course=entry.course;
        const shapes=course.number===8?{...course.shapes,fairway:course.mainFairway}:course.shapes;
        // The barranca already appears in the active Hole 8 atlas. Use the
        // Hole 2 version when viewing the shared feature from Hole 1 or 2.
        const landforms=entry!==current&&(active.number===8||course.number===8)?[]:course.landforms;
        return {course:{...course,shapes,landforms},foreground:entry===current,
            transform:{a:east.x-origin.x,b:east.z-origin.z,x:origin.x,z:origin.z}};
    });
    const playingAreas=layers.map(({course})=>({
        entry:entries.find(entry=>entry.hole.number===course.number),
        unit:course.plan.metresPerUnit,
        paths:['fairway','tee','green'].flatMap(kind=>geometryPath(course.shapes[kind]))
    }));
    function crossesOtherHole(source,x,z){
        return playingAreas.some(({entry,unit,paths})=>{
            if(entry===source)return false;
            const local=toEntry(entry,x,z);
            return containsPoint(paths,local.x/unit,local.z/unit);
        });
    }
    const scenery={trees:[],buildings:[...(active.scenery?.buildings??[])]};
    const hiddenTrees=new Set();
    for(const entry of [current,...neighbours]){
        for(const tree of entry.course.scenery?.trees??[]){
            const point=entry===current?tree:toActive(entry,tree.x,tree.z);
            if(crossesOtherHole(entry,point.x,point.z)){
                if(entry===current)hiddenTrees.add(tree.x+':'+tree.z);
                continue;
            }
            if(entry!==current&&scenery.trees.some(other=>Math.hypot(other.x-point.x,other.z-point.z)<5))continue;
            scenery.trees.push({...tree,...point});
        }
    }
    for(const entry of neighbours){
        for(const building of entry.course.scenery?.buildings??[]){
            const point=toActive(entry,building.x,building.z);
            if(scenery.buildings.some(other=>Math.hypot(other.x-point.x,other.z-point.z)<16))continue;
            scenery.buildings.push({...building,...point});
        }
    }
    const flags=neighbours.map(entry=>toActive(entry,entry.hole.pins[0].x,entry.hole.pins[0].z));
    // In preview practice, a suppressed local tree must also stop colliding.
    const obstacles=active.obstacles.filter(({center})=>!hiddenTrees.has(center.x+':'+center.z));
    return {bounds,ground,layers,scenery,flags,obstacles};
}
