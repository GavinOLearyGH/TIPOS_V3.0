import {ballRadius,cupRadius,clamp,mix} from './physics.mjs';

// Canonical Hole 6 ball, cup, flag, putting grid and flyover green read.
export function createVisuals({gl,uniform,draw,buffer,mobile,ground,surface,greenBounds}){
    function triangle(mesh,a,b,c,color){
        for(const p of [a,b,c])mesh.push(...p,...color);
    }
    function quad(mesh,a,b,c,d,color){
        triangle(mesh,a,b,c,color);triangle(mesh,a,c,d,color);
    }
    function disk(mesh,x,y,z,r,shade){
        for(let i=0;i<24;i++){
            const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
            triangle(mesh,[x,y,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],shade);
        }
    }
    function ellipsoid(mesh,x,y,z,rx,ry,rz,shade,slices=12,rings=7){
        const p=(i,j)=>{
            const a=i*2*Math.PI/slices,b=(j/rings-.5)*Math.PI;
            return [x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz];
        };
        for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){
            const light=.78+.17*Math.cos(i*2*Math.PI/slices)+j/rings*.17;
            quad(mesh,p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1),shade.map(x=>x*light));
        }
    }
    function post(mesh,x,z,bottom,height,width,shade){
        quad(mesh,[x-width,bottom,z],[x+width,bottom,z],[x+width,bottom+height,z],[x-width,bottom+height,z],shade);
        quad(mesh,[x,bottom,z-width],[x,bottom,z+width],[x,bottom+height,z+width],[x,bottom+height,z-width],shade);
    }
    function greenLine(mesh,x,z,dx,dz,halfWidth,height,shade){
        const size=Math.hypot(dx,dz),sideX=-dz/size*halfWidth,sideZ=dx/size*halfWidth;
        const point=(t,side)=>{
            const px=x+t*dx+side*sideX,pz=z+t*dz+side*sideZ;
            return [px,ground(px,pz)+height,pz];
        };
        quad(mesh,point(0,-1),point(0,1),point(1,1),point(1,-1),shade);
    }
    function makePuttingGrid(){
        const {minX,maxX,minZ,maxZ}=greenBounds;
        const spacing=.5,cells=4,mesh=[],streams=[],sample=.07;
        const x0=Math.floor(minX/spacing);
        const x1=Math.ceil(maxX/spacing);
        const z0=Math.floor(minZ/spacing);
        const z1=Math.ceil(maxZ/spacing);
        const onGreen=(x,z)=>surface(x,z)==='green';
        const lineColor=[.50,.64,.35];
        for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++){
            const row=i%cells===0,col=j%cells===0;
            if(!row&&!col)continue;
            const x=i*spacing,z=j*spacing;
            if(!onGreen(x,z))continue;
            if(col&&onGreen(x+spacing,z))greenLine(mesh,x,z,spacing,0,.018,.018,lineColor);
            if(row&&onGreen(x,z+spacing))greenLine(mesh,x,z,0,spacing,.018,.018,lineColor);
            if(!row||!col)continue;
            const gx=(ground(x+sample,z)-ground(x-sample,z))/(2*sample);
            const gz=(ground(x,z+sample)-ground(x,z-sample))/(2*sample);
            const grade=Math.hypot(gx,gz);
            if(grade<.0015)continue;
            const dx=-gx/grade,dz=-gz/grade;
            if(onGreen(x-dx*.6,z-dz*.6)&&onGreen(x+dx*.6,z+dz*.6)){
                const preview=i%(cells*2)===0&&j%(cells*2)===0&&
                    onGreen(x-dx*.9,z-dz*.9)&&onGreen(x+dx*.9,z+dz*.9);
                streams.push({x,z,dx,dz,preview,period:mix(54,19,clamp(grade/.06,0,1)),phase:(i*17+j*11)%37/37});
            }
        }
        return {mesh:buffer(mesh),streams};
    }
    function drawGreenRead(tick,opacity){
        const arrows=[];
        puttingGrid??=makePuttingGrid();
        for(const {x,z,dx,dz,preview,period,phase} of puttingGrid.streams){
            if(!preview)continue;
            const t=(tick/period+phase)%1,span=(t-.5)*.9;
            const ax=x+span*dx,az=z+span*dz;
            const light=Math.sin(Math.PI*t);
            const shade=[mix(.65,1,light),mix(.71,.92,light),mix(.38,.65,light)];
            for(const side of [-1,1]){
                const wingX=-dx*.42-dz*.25*side,wingZ=-dz*.42+dx*.25*side;
                greenLine(arrows,ax,az,wingX,wingZ,.055,.08,shade);
            }
        }
        gl.enable(gl.BLEND);
        gl.uniform1f(uniform.opacity,opacity);
        gl.bindBuffer(gl.ARRAY_BUFFER,mobile());
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arrows),gl.DYNAMIC_DRAW);
        draw({handle:mobile(),count:arrows.length/6},0);
        gl.uniform1f(uniform.opacity,1);
        gl.disable(gl.BLEND);
    }
    let puttingGrid;
    function drawFrame({pin,ball,aim,trail=[],flying=false,gridTick=null,readOpacity=null}){
        const moving=[],base=ground(pin.x,pin.z);
        if(gridTick!==null&&readOpacity===null){
            puttingGrid??=makePuttingGrid();
            draw(puttingGrid.mesh,0);
            for(const {x,z,dx,dz,period,phase} of puttingGrid.streams){
                const t=(gridTick/period+phase)%1;
                const span=(t-.5)*1.03,light=Math.sin(Math.PI*t);
                const shade=[mix(.54,.98,light),mix(.67,1,light),mix(.37,.76,light)];
                greenLine(moving,x+span*dx,z+span*dz,dx*.13,dz*.13,.025,.026,shade);
            }
        }
        disk(moving,pin.x,base+.012,pin.z,cupRadius,[.09,.13,.08]);
        post(moving,pin.x,pin.z,base,1.95,.018,[.97,.95,.83]);
        triangle(moving,[pin.x,base+1.94,pin.z],[pin.x,base+1.45,pin.z],[pin.x,base+1.69,pin.z+.63],[.94,.45,.28]);
        if(aim)disk(moving,aim.x,aim.y+.035,aim.z,aim.near?.095:.20,[.95,.79,.41]);
        if(ball.mode!=='holed'){
            const size=flying?.076:ball.mode==='drop'?ballRadius:.046;
            const y=ball.y+(ball.mode==='rest'?.023:0);
            ellipsoid(moving,ball.x,y,ball.z,size,size,size,[1,1,.98],10,5);
            if(ball.mode==='rest'||ball.mode==='roll'||ball.mode==='air'){
                const flat=ground(ball.x,ball.z);
                if(surface(ball.x,ball.z)!=='water')disk(moving,ball.x,flat+.012,ball.z,.063,[.35,.48,.25]);
            }
        }
        for(let i=1;i<trail.length;i++){
            const a=trail[i-1],b=trail[i],w=.023;
            quad(moving,[a.x,a.y-w,a.z],[a.x,a.y+w,a.z],[b.x,b.y+w,b.z],[b.x,b.y-w,b.z],[.98,.87,.52]);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER,mobile());
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(moving),gl.DYNAMIC_DRAW);
        draw({handle:mobile(),count:moving.length/6},0);
        if(readOpacity>0)drawGreenRead(gridTick,readOpacity);
    }
    return {triangle,quad,disk,ellipsoid,post,drawFrame};
}
