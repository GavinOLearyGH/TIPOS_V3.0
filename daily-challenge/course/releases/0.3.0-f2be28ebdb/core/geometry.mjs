import {mix} from './physics.mjs';
function geometryPath(data){
    const tokens=data.match(/[MLQZ]|-?\d+(?:\.\d+)?/g),paths=[];
    let i=0,points;
    const point=()=>[Number(tokens[i++]),Number(tokens[i++])];
    while(i<tokens.length){
        const command=tokens[i++];
        if(command==='M'){points=[point()];paths.push(points);}
        if(command==='L')points.push(point());
        if(command==='Q'){
            const a=points.at(-1),b=point(),c=point();
            for(let step=1;step<=60;step++){
                const t=step/60,k=1-t;
                points.push([k*k*a[0]+2*k*t*b[0]+t*t*c[0],k*k*a[1]+2*k*t*b[1]+t*t*c[1]]);
            }
        }
        if(command==='Z')points.push(points[0]);
    }
    for(const points of paths){
        points.minX=Math.min(...points.map(p=>p[0]));
        points.maxX=Math.max(...points.map(p=>p[0]));
        points.minZ=Math.min(...points.map(p=>p[1]));
        points.maxZ=Math.max(...points.map(p=>p[1]));
    }
    return paths;
}
function containsPoint(paths,x,z){
    for(const points of paths){
        if(x<points.minX||x>points.maxX||z<points.minZ||z>points.maxZ)continue;
        let inside=false;
        for(let i=0,j=points.length-1;i<points.length;j=i++){
            const a=points[i],b=points[j];
            if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
        }
        if(inside)return true;
    }
    return false;
}
function sampleGeometryPath(points,count){
    const lengths=[0];
    for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i];
        lengths.push(lengths.at(-1)+Math.hypot(b[0]-a[0],b[1]-a[1]));
    }
    let i=1;
    return Array.from({length:count},(_,index)=>{
        const distance=lengths.at(-1)*index/(count-1);
        while(i<lengths.length-1&&lengths[i]<distance)i++;
        const t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]);
        return {x:mix(points[i-1][0],points[i][0],t),z:mix(points[i-1][1],points[i][1],t)};
    });
}
export {geometryPath,containsPoint,sampleGeometryPath};
