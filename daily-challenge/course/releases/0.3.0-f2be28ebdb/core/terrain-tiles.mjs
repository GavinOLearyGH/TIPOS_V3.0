import {clamp} from './physics.mjs';

function axis(outerMin,min,max,outerMax,step,outerStep,detailMin,detailMax){
    const samples=[];
    const stops=[...new Set([outerMin,min,max,detailMin??min,detailMax??max,outerMax]
        .map(point=>clamp(point,outerMin,outerMax)))].sort((a,b)=>a-b);
    for(let i=1;i<stops.length;i++){
        const start=stops[i-1],end=stops[i],middle=(start+end)/2;
        const spacing=(middle>=min&&middle<=max)||(middle>=detailMin&&middle<=detailMax)?step:outerStep;
        const count=Math.ceil((end-start)/spacing);
        for(let i=0;i<count;i++)samples.push(start+i*(end-start)/count);
    }
    samples.push(outerMax);
    return samples;
}

function bracket(values,point){
    let low=0,high=values.length-1;
    while(high-low>1){
        const mid=(low+high)>>1;
        if(values[mid]<=point)low=mid;
        else high=mid;
    }
    return low;
}

export function sampleTerrain(viewBounds,playBounds,step,ground,outerStep=3.6,detail){
    const xs=axis(viewBounds.minX,playBounds.minX,playBounds.maxX,viewBounds.maxX,step,outerStep,detail?.minX,detail?.maxX);
    const zs=axis(viewBounds.minZ,playBounds.minZ,playBounds.maxZ,viewBounds.maxZ,step,outerStep,detail?.minZ,detail?.maxZ);
    const heights=xs.map(x=>Float32Array.from(zs,z=>ground(x,z)));
    const height=(x,z)=>{
        const i=bracket(xs,x),j=bracket(zs,z);
        const tx=clamp((x-xs[i])/(xs[i+1]-xs[i]),0,1);
        const tz=clamp((z-zs[j])/(zs[j+1]-zs[j]),0,1);
        const a=heights[i][j],b=heights[i+1][j],c=heights[i][j+1],d=heights[i+1][j+1];
        // Match the diagonal used by the rendered triangles.
        return tx>=tz?a+(b-a)*tx+(d-b)*tz:a+(d-c)*tx+(c-a)*tz;
    };
    return {xs,zs,heights,height};
}

export function terrainTiles(viewBounds,playBounds,step,ground,outerStep=3.6,detail){
    return meshTerrain(sampleTerrain(viewBounds,playBounds,step,ground,outerStep,detail));
}

export function* meshTerrain({xs,zs,heights}){
    const tileSize=48;
    for(let firstX=0;firstX<xs.length-1;firstX+=tileSize)for(let firstZ=0;firstZ<zs.length-1;firstZ+=tileSize){
        const lastX=Math.min(firstX+tileSize,xs.length-1),lastZ=Math.min(firstZ+tileSize,zs.length-1);
        const columns=lastZ-firstZ+1;
        const vertices=new Float32Array((lastX-firstX+1)*columns*6);
        const indices=new Uint16Array((lastX-firstX)*(lastZ-firstZ)*6);
        let v=0,t=0,minY=Infinity,maxY=-Infinity;
        for(let i=firstX;i<=lastX;i++)for(let j=firstZ;j<=lastZ;j++){
            const x=xs[i],z=zs[j],y=heights[i][j];
            const x0=Math.max(0,i-1),x1=Math.min(xs.length-1,i+1);
            const z0=Math.max(0,j-1),z1=Math.min(zs.length-1,j+1);
            const gx=(heights[x1][j]-heights[x0][j])/(xs[x1]-xs[x0]);
            const gz=(heights[i][z1]-heights[i][z0])/(zs[z1]-zs[z0]);
            const shade=clamp(1+1.6*(gx*.84+gz*.54)/Math.hypot(1,gx,gz),.69,1.18);
            vertices[v++]=x;vertices[v++]=y;vertices[v++]=z;
            vertices[v++]=shade;vertices[v++]=shade;vertices[v++]=shade;
            minY=Math.min(minY,y);maxY=Math.max(maxY,y);
            if(i===lastX||j===lastZ)continue;
            const a=(i-firstX)*columns+j-firstZ,b=a+columns;
            indices[t++]=a;indices[t++]=b;indices[t++]=b+1;
            indices[t++]=a;indices[t++]=b+1;indices[t++]=a+1;
        }
        const dx=xs[lastX]-xs[firstX],dz=zs[lastZ]-zs[firstZ],dy=maxY-minY;
        yield {vertices,indices,center:[xs[firstX]+dx/2,minY+dy/2,zs[firstZ]+dz/2],radius:Math.hypot(dx,dy,dz)/2+.01};
    }
}

export function terrainVisible({center,radius},{eye,forward,right,up,ratio,far=700}){
    const x=center[0]-eye[0],y=center[1]-eye[1],z=center[2]-eye[2];
    const depth=x*forward[0]+y*forward[1]+z*forward[2],horizontal=ratio/1.72,vertical=1/1.72;
    if(depth+radius<.07||depth-radius>far)return false;
    return Math.abs(x*right[0]+y*right[1]+z*right[2])<=depth*horizontal+radius*Math.hypot(1,horizontal)&&
        Math.abs(x*up[0]+y*up[1]+z*up[2])<=depth*vertical+radius*Math.hypot(1,vertical);
}
