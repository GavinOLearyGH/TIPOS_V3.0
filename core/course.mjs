import {geometryPath,containsPoint} from './geometry.mjs';
import {clamp,ease} from './physics.mjs';

export function createCourse(definition){
    const unit=definition.plan.metresPerUnit;
    const paths=Object.fromEntries(Object.entries(definition.shapes).map(([key,path])=>[key,geometryPath(path)]));
    const contains=(key,x,z)=>paths[key]&&containsPoint(paths[key],x/unit,z/unit);
    const greenBounds={minX:Math.min(...paths.green.map(p=>p.minX))*unit,maxX:Math.max(...paths.green.map(p=>p.maxX))*unit,
        minZ:Math.min(...paths.green.map(p=>p.minZ))*unit,maxZ:Math.max(...paths.green.map(p=>p.maxZ))*unit};
    const boundary=geometryPath(definition.outOfBounds)[0];
    function isOutOfBounds(x,z){
        const px=x/unit,pz=z/unit;
        for(let i=1;i<boundary.length;i++){
            const a=boundary[i-1],b=boundary[i];
            if(px>=a[0]&&px<=b[0]){
                const line=a[1]+(b[1]-a[1])*(px-a[0])/(b[0]-a[0]);
                return pz<line;
            }
        }
        return pz<definition.bounds.minZ/unit;
    }
    const pathLines=(definition.paths??[]).flatMap(path=>geometryPath(path));
    function distanceToLines(lines,px,pz){
        let closest=Infinity;
        for(const points of lines)for(let i=1;i<points.length;i++){
            const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
            const lengthSquared=dx*dx+dz*dz;
            const t=lengthSquared?clamp(((px-a[0])*dx+(pz-a[1])*dz)/lengthSquared,0,1):0;
            closest=Math.min(closest,Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t)*unit);
        }
        return closest;
    }
    function surface(x,z){
        if(definition.pathWidth&&distanceToLines(pathLines,x/unit,z/unit)<definition.pathWidth/2)return 'path';
        for(const kind of ['sand','green','tee','surround','fairway']){
            if(contains(kind,x,z))return kind;
        }
        return 'rough';
    }
    function ground(x,z){
        const px=x/unit,pz=z/unit;
        // Provisional elevation model, replaceable with surveyed samples.
        const {terrain,green}=definition;
        let y=terrain.baseRipple*Math.sin(x/terrain.rippleLength);
        const nearGreen=Math.exp(-(((px-green.center[0])/green.blend[0])**4+((pz-green.center[1])/green.blend[1])**4));
        y+=green.backToFrontRise*clamp((px-green.front)/green.depth,0,1)*nearGreen;
        const {pews}=definition;
        const ends=pews?ease((pz-pews.z+pews.length/2)/pews.width)*ease((pews.z+pews.length/2-pz)/pews.width):0;
        for(let i=0;i<(pews?.count??0);i++){
            y+=pews.height*Math.exp(-(((px-pews.x-i*pews.spacing)/pews.width)**2))*ends;
        }
        if(surface(x,z)==='sand'){
            const edge=distanceToLines(paths.sand,px,pz);
            y-=terrain.bunkerDepth*ease(edge/terrain.bunkerBlend);
        }
        return y;
    }
    const obstacles=(definition.scenery?.trees??[]).flatMap(tree=>{
        const base=ground(tree.x,tree.z),h=tree.height;
        return [
            {kind:'tree trunk',center:{x:tree.x,y:base+h*.275,z:tree.z},
                radii:{x:.25,y:h*.275,z:.25},restitution:.35,retention:.65},
            {kind:'tree canopy',center:{x:tree.x,y:base+h*.69,z:tree.z},
                radii:{x:h*.28,y:h*.4,z:h*.26},restitution:.05,retention:.48}
        ];
    });
    return {...definition,greenBounds,ground,surface,isOutOfBounds,obstacles,wall:[],waterHeight:-Infinity};
}
