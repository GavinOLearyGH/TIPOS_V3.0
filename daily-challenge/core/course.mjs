import {geometryPath,containsPoint} from './geometry.mjs';
import {clamp,ease} from './physics.mjs';

export function createCourse(definition){
    const unit=definition.plan.metresPerUnit;
    const paths=Object.fromEntries(Object.entries(definition.shapes).map(([key,path])=>[key,geometryPath(path)]));
    const contains=(key,x,z)=>paths[key]&&containsPoint(paths[key],x/unit,z/unit);
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
    function surface(x,z){
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
            const boundary=paths.sand;
            let edge=Infinity;
            for(const points of boundary)for(let i=1;i<points.length;i++){
                const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
                const t=clamp(((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz),0,1);
                edge=Math.min(edge,Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t)*unit);
            }
            y-=terrain.bunkerDepth*ease(edge/terrain.bunkerBlend);
        }
        return y;
    }
    return {...definition,ground,surface,isOutOfBounds,wall:[],waterHeight:-Infinity};
}
