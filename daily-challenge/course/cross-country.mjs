import {ease} from '../core/physics.mjs';
import {geometryPath,containsPoint} from '../core/geometry.mjs';
import {holeByNumber} from './catalog.mjs';
import {createConnectedCourse,makeConnectedView} from './connected-view.mjs';

const yardsPerMetre=1/.9144;

function onLayer(layers,number,point){
    const {a,b,x,z}=layers.find(layer=>layer.course.number===number).transform;
    return {...point,x:a*point.x-b*point.z+x,z:b*point.x+a*point.z+z};
}

export function crossCountrySelection(from,teeId,to){
    const start=holeByNumber(from),destination=holeByNumber(to);
    const selectedTee=start?.tees.find(tee=>tee.id===teeId);
    if(!selectedTee||!destination)return null;
    const course=createConnectedCourse(destination.number),view=makeConnectedView(course);
    const tee=onLayer(view.layers,start.number,selectedTee);
    const pin=course.pins.find(point=>point.id==='center'||point.id==='middle')??course.pins[0];
    const yards=Math.round(Math.hypot(tee.x-pin.x,tee.z-pin.z)*yardsPerMetre);
    // One full shot up to 215 yards, then one extra stroke per 185 yards.
    const par=3+Math.max(0,Math.ceil((yards-215)/185));
    return {from:start.number,to:destination.number,tee,pin,yards,par,
        name:'Hole '+start.number+' tee to Hole '+destination.number+' green'};
}

export function crossCountryMapPoints(view,selection){
    const start=view.layers.find(layer=>layer.course.number===selection.from).course;
    const tee=start.tees.find(point=>point.id===selection.tee.id);
    return {tee:onLayer(view.layers,selection.from,tee),pin:onLayer(view.layers,selection.to,selection.pin)};
}

export function crossCountryBounds(a,b,padding=24){
    return {minX:Math.min(a.x,b.x)-padding,maxX:Math.max(a.x,b.x)+padding,
        minZ:Math.min(a.z,b.z)-padding,maxZ:Math.max(a.z,b.z)+padding};
}

export function createCrossCountryGame(route){
    // Use the target hole's frame for its normal green grid and fine terrain.
    const target=createConnectedCourse(route.to),view=makeConnectedView(target);
    const {tee,pin}=route,teeDetail=crossCountryBounds(tee,tee,18);
    const mapBounds=crossCountryBounds(tee,pin);
    const aimTarget=()=>pin,green=geometryPath(target.shapes.green),unit=target.plan.metresPerUnit;
    const onTargetGreen=({x,z})=>containsPoint(green,x/unit,z/unit);
    const course={...target,name:route.name,par:route.par,tees:[tee],pins:[pin],aimTarget};
    return {course,mapBounds,onTargetGreen,view:{...view,flags:[],detailBounds:teeDetail,ground(x,z){
        const edge=Math.max(Math.abs(x-tee.x),Math.abs(z-tee.z));
        const blend=ease((edge-12)/6);
        if(blend===1)return view.ground(x,z);
        const exact=course.ground(x,z);
        return blend===0?exact:exact+(view.ground(x,z)-exact)*blend;
    }}};
}

export function openPlayTarget(course,view,number){
    const layer=view.layers.find(item=>item.course.number===number);
    const {pins,shapes,plan}=layer.course;
    const center=pins.find(pin=>pin.id==='center'||pin.id==='middle')??pins[0];
    const pin={...onLayer(view.layers,number,center),id:'hole-'+number};
    const green=geometryPath(shapes.green);
    const {a,b,x,z}=layer.transform,unit=plan.metresPerUnit;
    const projected=green.map(path=>path.map(([px,pz])=>onLayer(view.layers,number,{x:px*unit,z:pz*unit})));
    const points=projected.flat(),xs=points.map(point=>point.x),zs=points.map(point=>point.z);
    const bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
    const outline=projected.flatMap(path=>path.filter((_,i)=>i%3===0||i===path.length-1).map(point=>({
        ...point,y:course.ground(point.x,point.z)+.1
    })));
    const contains=(px,pz)=>{
        const dx=px-x,dz=pz-z;
        return containsPoint(green,(a*dx+b*dz)/unit,(-b*dx+a*dz)/unit);
    };
    return {number,pin,outline,gridRegion:{bounds,contains},onGreen:point=>contains(point.x,point.z)};
}

export function droneCamera(ball,pin,ground,aspect){
    const dx=pin.x-ball.x,dz=pin.z-ball.z,span=Math.hypot(dx,dz);
    const heading=Math.atan2(dz,dx);
    const x=(ball.x+pin.x)/2,z=(ball.z+pin.z)/2;
    const base=Math.max(ground(ball.x,ball.z),ground(x,z),ground(pin.x,pin.z));
    const height=Math.max(34/Math.min(1,aspect),span*1.18+20);
    return {
        eye:[x-Math.cos(heading)*height*.42,base+height,z-Math.sin(heading)*height*.42],
        target:[x,base,z]
    };
}
