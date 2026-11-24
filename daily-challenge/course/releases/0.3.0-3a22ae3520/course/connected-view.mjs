import {createCourse} from '../core/course.mjs';
import {geometryPath,containsPoint} from '../core/geometry.mjs';
import {clamp,ease} from '../core/physics.mjs';
import {playableHoles} from './catalog.mjs';
import {coarseWorld} from './world-heights.mjs';

// Tee headings and green anchors traced from the annotated front-nine aerial.
// Registration is rigid. Yardages and individual green contours stay in metres.
const metresPerPixel=.955;
const aerial=[
    [[98,421],[252,49]], [[380,62],[238,569]], [[270,574],[229,700]],
    [[270,855],[556,587]], [[593,511],[305,725]], [[283,674],[322,503]],
    [[286,522],[412,104]], [[312,49],[198,564]], [[199,618],[114,468]]
];
const property=geometryPath('M27 451 L66 322 L186 6 L416 3 L474 162 L448 407 L433 473 L625 487 L625 570 L537 685 L367 850 L280 900 L223 871 L172 737 L121 646 L41 544 Z');
const heading=(from,to)=>Math.atan2(to.z-from.z,to.x-from.x);
const point=([x,z])=>({x:x*metresPerPixel,z:z*metresPerPixel});
const toWorld=({a,b,x:tx,z:tz},x,z)=>({x:a*x-b*z+tx,z:b*x+a*z+tz});
const toLocal=({a,b,x:tx,z:tz},x,z)=>({x:a*(x-tx)+b*(z-tz),z:-b*(x-tx)+a*(z-tz)});
const extent=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
    minZ:Math.min(...points.map(p=>p.z)),maxZ:Math.max(...points.map(p=>p.z))});
const corners=({minX,maxX,minZ,maxZ})=>[[minX,minZ],[minX,maxZ],[maxX,minZ],[maxX,maxZ]];
const distanceFromBounds=(b,x,z)=>Math.hypot(x-clamp(x,b.minX,b.maxX),z-clamp(z,b.minZ,b.maxZ));
const outside=(x,z)=>!containsPoint(property,x/metresPerPixel,z/metresPerPixel);
const playingKinds=['water','green','tee','sand','surround','fairway'];
const propertyPoints=property[0].map(point);
const mapBounds=extent(propertyPoints);
const stakes=propertyPoints.slice(1).flatMap((b,index)=>{
    const a=propertyPoints[index],count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/24);
    return Array.from({length:count},(_,i)=>({x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count}));
});

function distanceToRoute(route,x,z){
    let distance=Infinity;
    for(let index=1;index<route.length;index++){
        const a=route[index-1],b=route[index],dx=b.x-a.x,dz=b.z-a.z;
        const lengthSquared=dx*dx+dz*dz;
        const along=lengthSquared?clamp(((x-a.x)*dx+(z-a.z)*dz)/lengthSquared,0,1):0;
        distance=Math.min(distance,Math.hypot(x-a.x-dx*along,z-a.z-dz*along));
    }
    return distance;
}

const entries=playableHoles.map(definition=>{
    const {road,bridge,wall,...shapes}=definition.shapes;
    if(definition.mainFairway)shapes.fairway=definition.mainFairway;
    const course=createCourse({...definition,shapes,paths:[],pathWidth:0,
        pews:definition.number===8?undefined:definition.pews,
        landforms:definition.number===8?[]:definition.landforms,
        scenery:{trees:definition.scenery?.trees??definition.connectedTrees??[],buildings:[]}});
    const pin=course.pins.find(p=>p.id==='center'||p.id==='middle')??course.pins[0];
    const tee=course.tees.reduce((back,marker)=>marker.yards>back.yards?marker:back);
    const [teeReference,greenReference]=aerial[course.number-1].map(point);
    const angle=heading(teeReference,greenReference)-heading(tee,pin);
    const a=Math.cos(angle),b=Math.sin(angle);
    const transform={a,b,x:greenReference.x-a*pin.x+b*pin.z,z:greenReference.z-b*pin.x-a*pin.z};
    const route=[tee,...(course.aimPoints??[]),pin];
    const unit=course.plan.metresPerUnit;
    const areas=playingKinds.map(kind=>shapes[kind]?geometryPath(shapes[kind]):[]);
    const ground=course.terrainGround??course.ground;
    const bounds=extent(corners(course.bounds).map(([x,z])=>toWorld(transform,x,z)));
    return {course,pin,transform,angle,route,unit,areas,ground,bounds};
});
const pond=entries.find(entry=>entry.course.number===6);
const worldWall=pond.course.wall.map(p=>({...p,...toWorld(pond.transform,p.x,p.z)}));

function areaAt(entry,x,z,kinds=entry.areas.length){
    for(let index=0;index<kinds;index++){
        if(containsPoint(entry.areas[index],x/entry.unit,z/entry.unit))return index;
    }
    return Infinity;
}

function candidates(x,z){
    const local=[];
    for(const entry of entries){
        if(distanceFromBounds(entry.bounds,x,z)>34)continue;
        const p=toLocal(entry.transform,x,z);
        const edge=distanceFromBounds(entry.course.bounds,p.x,p.z);
        if(edge>=34)continue;
        const route=distanceToRoute(entry.route,p.x,p.z);
        local.push({...p,entry,edge,route});
    }
    return local;
}

function materialAt(x,z){
    let best=null,hazard=null;
    for(const p of candidates(x,z)){
        if(p.edge)continue;
        const area=areaAt(p.entry,p.x,p.z);
        if(area<Infinity&&(!best||area<best.area||area===best.area&&p.route<best.route))best={...p,area};
        const lie=p.entry.course.lieAt?.(p.x,p.z);
        if(lie&&(!hazard||p.route<hazard.route))hazard={...p,lie};
    }
    if(best?.area<4)return {surface:playingKinds[best.area],lie:null};
    if(hazard)return {surface:hazard.lie.material,lie:hazard.lie};
    return {surface:best?playingKinds[best.area]:'rough',lie:null};
}

function worldGround(x,z){
    const nearby=candidates(x,z);
    let total=0,weight=0,coverage=0,featureHeight=0,featureWeight=0,featureCoverage=0;
    for(const p of nearby){
        // Soft weighting leaves a continuous slope between corridors.
        const inside=1-ease(p.edge/34);
        const influence=inside/(1+(p.route/19)**6);
        const height=p.entry.ground(p.x,p.z);
        weight+=influence;
        total+=height*influence;
        coverage=Math.max(coverage,inside);
        let protection=0;
        for(const footprint of p.entry.protectedAreas){
            const distance=distanceFromBounds(footprint.bounds,p.x,p.z);
            if(distance>=footprint.fade)continue;
            const edge=footprint.edge?footprint.edge(p.x,p.z):distance;
            const strength=(1-ease(edge/footprint.fade))*footprint.strength;
            protection=Math.max(protection,strength);
        }
        if(protection){
            const localWeight=protection**4/(1+(p.route/14)**4);
            featureWeight+=localWeight;
            featureHeight+=height*localWeight;
            featureCoverage=Math.max(featureCoverage,protection);
        }
    }
    const blended=weight?total/weight*coverage:0;
    return featureWeight?blended+(featureHeight/featureWeight-blended)*featureCoverage:blended;
}

for(const entry of entries){
    const {course,unit,areas}=entry;
    const footprint=(outline,fade,strength)=>{
        const points=outline.filter((_,index)=>index%10===0||index===outline.length-1).map(([x,z])=>({x:x*unit,z:z*unit}));
        return {bounds:extent(points),fade,strength,edge:(x,z)=>{
            if(containsPoint([outline],x/unit,z/unit))return 0;
            return distanceToRoute(points,x,z);
        }};
    };
    entry.protectedAreas=areas.flatMap((outlines,index)=>outlines.map(outline=>footprint(outline,index===0?7:5,
        index<4?1:index===4?.9:.78)));
    for(const feature of course.landforms??[]){
        for(const outline of geometryPath(feature.shape))entry.protectedAreas.push(footprint(outline,5,1));
    }
    if(course.pews){
        const {x,z,spacing,count,width,length}=course.pews;
        entry.protectedAreas.push({bounds:{minX:(x-width*3)*unit,maxX:(x+spacing*(count-1)+width*3)*unit,
            minZ:(z-length/2)*unit,maxZ:(z+length/2)*unit},fade:5,strength:1});
    }
}

// Only distant render vertices use the baked height grid. Shot physics keeps
// the exact same terrain sampler in the browser and in official replay.
const coarseData=coarseWorld&&Uint8Array.from(atob(coarseWorld.data),char=>char.charCodeAt(0));
function coarseGround(x,z){
    if(!coarseData)return worldGround(x,z);
    const {minX,minZ,step,width,depth}=coarseWorld;
    const dx=(x-minX)/step,dz=(z-minZ)/step,i=Math.floor(dx),j=Math.floor(dz);
    if(i<0||j<0||i>=width-1||j>=depth-1)return 0;
    const read=(col,row)=>{
        const at=(row*width+col)*2;
        return ((coarseData[at]+coarseData[at+1]*256)-32768)/100;
    };
    const a=read(i,j),b=read(i+1,j),c=read(i,j+1),d=read(i+1,j+1);
    const near=a+(b-a)*(dx-i),far=c+(d-c)*(dx-i);
    return near+(far-near)*(dz-j);
}

const sharedTrees=[];
for(const source of entries){
    for(const tree of source.course.scenery.trees){
        const p=toWorld(source.transform,tree.x,tree.z);
        const crossesPlay=candidates(p.x,p.z).some(other=>{
            const area=areaAt(other.entry,other.x,other.z);
            return area<=2||other.entry!==source&&area<=5;
        });
        if(crossesPlay||sharedTrees.some(other=>Math.hypot(p.x-other.x,p.z-other.z)<4))continue;
        sharedTrees.push({...tree,...p,y:worldGround(p.x,p.z)});
    }
}

const views=new Map();
function makeWorldCourse(number){
    const current=entries.find(entry=>entry.course.number===number);
    if(!current)throw Error('This hole is not available yet.');
    const source=current.course;
    const local=(x,z)=>toLocal(current.transform,x,z);
    const world=(x,z)=>toWorld(current.transform,x,z);
    const ground=(x,z)=>{const p=world(x,z);return worldGround(p.x,p.z);};
    const material=(x,z)=>{const p=world(x,z);return materialAt(p.x,p.z);};
    const propertyBounds=extent(propertyPoints.map(p=>local(p.x,p.z)));
    const bounds={minX:propertyBounds.minX-80,maxX:propertyBounds.maxX+80,minZ:propertyBounds.minZ-80,maxZ:propertyBounds.maxZ+80};
    const trees=sharedTrees.map(tree=>({...tree,...local(tree.x,tree.z)}));
    const scenery={trees,buildings:[]};
    const obstacles=trees.flatMap(({x,z,y,height:h})=>[
        {kind:'tree trunk',center:{x,y:y+h*.275,z},radii:{x:.25,y:h*.275,z:.25},restitution:.35,retention:.65},
        {kind:'tree canopy',center:{x,y:y+h*.69,z},radii:{x:h*.28,y:h*.4,z:h*.26},restitution:.05,retention:.48}
    ]);
    const cells=new Map(),cellSize=16,cell=value=>Math.floor(value/cellSize);
    for(const obstacle of obstacles){
        const {center,radii}=obstacle;
        for(let i=cell(center.x-radii.x-.1);i<=cell(center.x+radii.x+.1);i++){
            for(let j=cell(center.z-radii.z-.1);j<=cell(center.z+radii.z+.1);j++){
                const key=i+':'+j;
                if(!cells.has(key))cells.set(key,[]);
                cells.get(key).push(obstacle);
            }
        }
    }
    const noObstacles=[];
    function obstaclesBetween(from,to){
        const x=cell(from.x),z=cell(from.z),endX=cell(to.x),endZ=cell(to.z);
        if(x===endX&&z===endZ)return cells.get(x+':'+z)??noObstacles;
        const nearby=new Set();
        for(let i=Math.min(x,endX);i<=Math.max(x,endX);i++){
            for(let j=Math.min(z,endZ);j<=Math.max(z,endZ);j++){
                for(const obstacle of cells.get(i+':'+j)??noObstacles)nearby.add(obstacle);
            }
        }
        return nearby;
    }
    const wall=worldWall.map(p=>({...p,...local(p.x,p.z)}));
    const layers=[...entries.filter(entry=>entry!==current),current].map(entry=>{
        const origin=local(entry.transform.x,entry.transform.z),angle=entry.angle-current.angle;
        return {course:entry.course,foreground:entry===current,transform:{a:Math.cos(angle),b:Math.sin(angle),...origin}};
    });
    const course={...source,bounds,playBounds:source.bounds,atlasBounds:bounds,scenery,ground,obstacles,obstaclesBetween,wall,
        wallBounds:{...extent(wall),top:Math.max(...wall.map(p=>p.top))},waterHeight:pond.course.waterHeight,
        bearing:(current.angle-entries[0].angle)*180/Math.PI,
        surface:(x,z)=>material(x,z).surface,lieAt:(x,z)=>material(x,z).lie,
        isOutOfBounds:(x,z)=>{const p=world(x,z);return outside(p.x,p.z);},
        meshes:undefined,terrainGround:undefined,bridgeHeight:undefined,mapFeatures:[],boundaryStakes:stakes.map(p=>local(p.x,p.z))};
    const flags=entries.filter(entry=>entry!==current).map(entry=>{
        const p=toWorld(entry.transform,entry.pin.x,entry.pin.z);
        return local(p.x,p.z);
    });
    const pondLayer=layers.find(layer=>layer.course.number===6);
    const renderHeight=(x,z)=>{
        const blend=ease(distanceFromBounds(source.bounds,x,z)/24);
        if(!blend)return ground(x,z);
        const p=world(x,z),coarse=coarseGround(p.x,p.z);
        return blend===1?coarse:ground(x,z)*(1-blend)+coarse*blend;
    };
    return {course,view:{bounds,ground:renderHeight,layers,scenery,flags,wall,pond:pondLayer,world}};
}

function getWorldCourse(number){
    if(!views.has(number))views.set(number,makeWorldCourse(number));
    return views.get(number);
}
export function createConnectedCourse(number){return {...getWorldCourse(number).course};}
export function makeConnectedView(course){return getWorldCourse(course.number).view;}
export {worldGround,mapBounds};
