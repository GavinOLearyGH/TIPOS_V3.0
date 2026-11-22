import {geometryPath,containsPoint} from './geometry.mjs';
import {clamp,ease} from './physics.mjs';

export function createCourse(definition){
    const unit=definition.plan.metresPerUnit;
    const paths=Object.fromEntries(Object.entries(definition.shapes).map(([key,path])=>[key,geometryPath(path)]));
    const contains=(key,x,z)=>paths[key]&&containsPoint(paths[key],x/unit,z/unit);
    const greenBounds={minX:Math.min(...paths.green.map(p=>p.minX))*unit,maxX:Math.max(...paths.green.map(p=>p.maxX))*unit,
        minZ:Math.min(...paths.green.map(p=>p.minZ))*unit,maxZ:Math.max(...paths.green.map(p=>p.maxZ))*unit};
    const boundary=definition.outOfBounds?geometryPath(definition.outOfBounds)[0]:null;
    const landforms=(definition.landforms??[]).map(feature=>({...feature,outline:geometryPath(feature.shape)}));
    function isOutOfBounds(x,z){
        if(!boundary)return false;
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
    function featureAt(x,z){return landforms.find(feature=>containsPoint(feature.outline,x/unit,z/unit));}
    function lieAt(x,z){
        const feature=featureAt(x,z);if(!feature?.lies)return null;
        const {cellSize,seed,profiles}=feature.lies;
        const col=Math.floor(x/cellSize),row=Math.floor(z/cellSize);
        // Spatially fixed patches: choosing another club never rerolls a lie.
        const hash=(Math.imul(col,73856093)^Math.imul(row,19349663)^seed)>>>0;
        return {...profiles[hash%profiles.length],feature:feature.id,featureName:feature.name};
    }
    function aimTarget(point){
        return definition.aimPoints?.find(target=>target.x>point.x+30)??definition.pins[0];
    }
    function surface(x,z){
        const lie=lieAt(x,z);if(lie)return lie.material;
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
        const depth=clamp((px-green.front)/green.depth,0,1);
        y+=green.backToFrontRise*depth*nearGreen;
        if(green.tiers)y+=green.tiers.rise*ease(.5+(depth-green.tiers.at)/green.tiers.width)*nearGreen;
        for(const feature of landforms){
            if(!containsPoint(feature.outline,px,pz))continue;
            const edge=distanceToLines(feature.outline,px,pz);
            y-=feature.depth*ease(edge/feature.bankWidth);
        }
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
    return {...definition,greenBounds,ground,surface,lieAt,aimTarget,isOutOfBounds,obstacles,wall:[],waterHeight:-Infinity};
}
