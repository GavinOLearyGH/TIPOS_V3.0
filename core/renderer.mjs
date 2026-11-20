import {ballRadius,clamp,mix} from './physics.mjs';

export const surfaceColors={rough:'#4e6c40',tee:'#81a969',fairway:'#7fa65e',
    surround:'#6c8f50',green:'#a0bc73',sand:'#dcc794',path:'#98998a'};

export function makeAtlas(course){
    const map=document.createElement('canvas');
    map.width=2048;map.height=512;
    const c=map.getContext('2d'),b=course.bounds,unit=course.plan.metresPerUnit;
    c.scale(map.width/(b.maxX-b.minX),map.height/(b.maxZ-b.minZ));
    c.translate(-b.minX,-b.minZ);
    c.fillStyle=surfaceColors.rough;c.fillRect(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);
    c.save();c.scale(unit,unit);
    for(const kind of ['tee','fairway','surround','green','sand']){
        if(!course.shapes[kind])continue;
        c.fillStyle=surfaceColors[kind];c.fill(new Path2D(course.shapes[kind]));
    }
    c.save();c.clip(new Path2D(course.shapes.fairway));
    c.fillStyle='#efffc016';
    for(let x=b.minX/unit;x<b.maxX/unit;x+=38)c.fillRect(x,b.minZ/unit,19,(b.maxZ-b.minZ)/unit);
    c.restore();
    c.save();c.clip(new Path2D(course.shapes.green));
    c.fillStyle='#ebffd314';
    for(let x=b.minX/unit;x<b.maxX/unit;x+=12)c.fillRect(x,b.minZ/unit,6,(b.maxZ-b.minZ)/unit);
    c.restore();
    c.strokeStyle=surfaceColors.path;c.lineWidth=course.pathWidth/unit;
    for(const path of course.paths)c.stroke(new Path2D(path));
    c.restore();
    return map;
}

export function createRenderer(canvas,course,atlas){
    const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
    if(!gl)throw Error('This browser could not start 3D graphics. Enable graphics acceleration and reload.');
    const b=course.bounds;
    const vertex=`
        attribute vec3 a,c;uniform vec3 eye,right,up,forward;
        uniform float ratio;varying vec3 world,color;varying float depth;
        void main(){
            vec3 d=a-eye;float z=dot(d,forward);
            gl_Position=vec4(dot(d,right)*1.72/ratio,dot(d,up)*1.72,z*1.00015-.14,z);
            world=a;color=c;depth=z;
        }`;
    const fragment=`
        precision highp float;varying vec3 world,color;varying float depth;
        uniform sampler2D atlas;uniform float textured;
        void main(){
            vec3 ink=color;
            if(textured>.5){
                vec2 uv=(world.xz-vec2(${b.minX.toFixed(5)},${b.minZ.toFixed(5)}))/vec2(${(b.maxX-b.minX).toFixed(5)},${(b.maxZ-b.minZ).toFixed(5)});
                float grain=fract(sin(dot(floor(world.xz*40.),vec2(12.9898,78.233)))*43758.5453)*.035;
                ink=texture2D(atlas,uv).rgb*color*(.98+grain);
            }
            gl_FragColor=vec4(mix(ink,vec3(.65,.78,.78),clamp((depth-155.)/400.,0.,.32)),1.);
        }`;
    const program=gl.createProgram();
    for(const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
        const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
    const uniforms=Object.fromEntries(['eye','right','up','forward','ratio','textured'].map(name=>[name,gl.getUniformLocation(program,name)]));
    const attributes=['a','c'].map(name=>gl.getAttribLocation(program,name));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
    for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const triangle=(mesh,a,b,c,color)=>{for(const p of [a,b,c])mesh.push(...p,...color);};
    function quad(mesh,a,b,c,d,color){triangle(mesh,a,b,c,color);triangle(mesh,a,c,d,color);}
    function box(mesh,x,y,z,w,h,d,color){
        const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
        const top=p=>[p[0],p[1]+h,p[2]];
        quad(mesh,a,b,top(b),top(a),color);quad(mesh,b,c,top(c),top(b),color.map(v=>v*.88));
        quad(mesh,c,e,top(e),top(c),color.map(v=>v*.94));quad(mesh,e,a,top(a),top(e),color);
        quad(mesh,top(a),top(b),top(c),top(e),color.map(v=>v*1.08));
    }
    function sphere(mesh,x,y,z,rx,ry,rz,color,slices=9,rings=5){
        const point=(i,j)=>{
            const a=i*Math.PI*2/slices,b=(j/rings-.5)*Math.PI;
            return [x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz];
        };
        for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){
            const shade=color.map(v=>v*(.80+.14*Math.cos(i*Math.PI*2/slices)+j/rings*.17));
            quad(mesh,point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),shade);
        }
    }
    function disk(mesh,x,y,z,r,color){
        for(let i=0;i<24;i++){
            const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
            triangle(mesh,[x,y,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],color);
        }
    }
    function line(mesh,a,b,width,color){
        const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz)||1;
        const sx=-dz/length*width,sz=dx/length*width;
        quad(mesh,[a[0]-sx,a[1],a[2]-sz],[a[0]+sx,a[1],a[2]+sz],
            [b[0]+sx,b[1],b[2]+sz],[b[0]-sx,b[1],b[2]-sz],color);
    }
    function upload(vertices){
        const handle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,handle);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        return {handle,count:vertices.length/6};
    }
    const terrain=[],scenery=[];
    const unit=course.renderStep??1.15;
    for(let x=b.minX;x<b.maxX;x+=unit)for(let z=b.minZ;z<b.maxZ;z+=unit){
        const nx=Math.min(x+unit,b.maxX),nz=Math.min(z+unit,b.maxZ);
        const p=(x,z)=>[x,course.ground(x,z),z];
        const slope=(course.ground(nx,z)-course.ground(x,z))/unit;
        const shade=clamp(1-slope*.22,.72,1.13);
        quad(terrain,p(x,z),p(nx,z),p(nx,nz),p(x,nz),[shade,shade,shade]);
    }
    for(const tree of course.scenery?.trees??[]){
        const y=course.ground(tree.x,tree.z),h=tree.height;
        box(scenery,tree.x,y,tree.z,.38,h*.55,.38,[.31,.24,.15]);
        sphere(scenery,tree.x,y+h*.69,tree.z,h*.28,h*.4,h*.26,[.31,.46,.25]);
    }
    for(const building of course.scenery?.buildings??[]){
        const y=course.ground(building.x,building.z),{x,z,width,height,depth}=building;
        box(scenery,x,y,z,width,height,depth,[.55,.51,.42]);
        const base=y+height;
        const corners=[[x-width/2,base,z-depth/2],[x+width/2,base,z-depth/2],
            [x+width/2,base,z+depth/2],[x-width/2,base,z+depth/2]];
        const left=[x-width/2,base+height*.36,z],right=[x+width/2,base+height*.36,z];
        quad(scenery,corners[0],corners[1],right,left,[.31,.32,.29]);
        quad(scenery,left,right,corners[2],corners[3],[.39,.39,.34]);
    }
    for(const stake of course.boundaryStakes??[])box(scenery,stake.x,course.ground(stake.x,stake.z),stake.z,.1,.7,.1,[.94,.94,.84]);
    const groundBuffer=upload(terrain),sceneryBuffer=upload(scenery),mobile=gl.createBuffer();
    const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const normalize=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
    let camera;
    function draw(buffer,textured){
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer.handle);
        for(let i=0;i<2;i++){
            gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],3,gl.FLOAT,false,24,i*12);
        }
        gl.uniform1f(uniforms.textured,textured);gl.drawArrays(gl.TRIANGLES,0,buffer.count);
    }
    function greenRead(mesh,time){
        const sample=.12;
        const center=course.pins[0],radius=course.green.readRadius??22;
        for(let x=center.x-radius;x<center.x+radius;x+=2)for(let z=center.z-radius;z<center.z+radius;z+=2){
            if(course.surface(x,z)!=='green')continue;
            const gx=(course.ground(x+sample,z)-course.ground(x-sample,z))/(2*sample);
            const gz=(course.ground(x,z+sample)-course.ground(x,z-sample))/(2*sample);
            const grade=Math.hypot(gx,gz);if(grade<.0015)continue;
            const dx=-gx/grade,dz=-gz/grade;
            const phase=(time*.0003+x*.17+z*.11)%1,span=(phase-.5)*.9;
            const px=x+span*dx,pz=z+span*dz;
            if(course.surface(px,pz)!=='green')continue;
            const a=[px,course.ground(px,pz)+.06,pz];
            for(const side of [-1,1]){
                const bx=px-dx*.34-dz*.2*side,bz=pz-dz*.34+dx*.2*side;
                if(course.surface(bx,bz)==='green')line(mesh,a,[bx,course.ground(bx,bz)+.06,bz],.035,[.96,.89,.57]);
            }
        }
    }
    function frame({eye,target,ball,pin,aim,trail=[],greenGrid=false,time=0,flying=false}){
        const ratio=Math.min(devicePixelRatio||1,1.5);
        const width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
        const forward=normalize(target.map((n,i)=>n-eye[i])),right=normalize(cross(forward,[0,1,0])),up=cross(right,forward);
        camera={eye,forward,right,up,ratio:width/height};
        gl.viewport(0,0,width,height);
        for(const name of ['eye','forward','right','up'])gl.uniform3fv(uniforms[name],camera[name]);
        gl.uniform1f(uniforms.ratio,camera.ratio);
        gl.clearColor(.58,.76,.83,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        draw(groundBuffer,1);draw(sceneryBuffer,0);
        const dynamic=[],base=course.ground(pin.x,pin.z);
        if(greenGrid)greenRead(dynamic,time);
        disk(dynamic,pin.x,base+.012,pin.z,.054,[.07,.11,.07]);
        box(dynamic,pin.x,base,pin.z,.025,1.95,.025,[.98,.96,.85]);
        triangle(dynamic,[pin.x,base+1.94,pin.z],[pin.x,base+1.43,pin.z],[pin.x,base+1.67,pin.z+.65],[.96,.44,.25]);
        if(ball.mode!=='holed'){
            const r=flying?.09:.046;
            sphere(dynamic,ball.x,ball.y+(ball.mode==='rest'?.022:0),ball.z,r,r,r,[1,1,.97],10,5);
            if(ball.mode!=='drop')disk(dynamic,ball.x,course.ground(ball.x,ball.z)+.012,ball.z,.09,[.31,.43,.23]);
        }
        if(aim){
            for(let d=1;d<aim.length;d+=1){
                const x=ball.x+Math.cos(aim.heading)*d,z=ball.z+Math.sin(aim.heading)*d;
                const nx=x+Math.cos(aim.heading)*.45,nz=z+Math.sin(aim.heading)*.45;
                line(dynamic,[x,course.ground(x,z)+.035,z],[nx,course.ground(nx,nz)+.035,nz],.035,[.96,.84,.53]);
            }
        }
        for(let i=1;i<trail.length;i++){
            const a=trail[i-1],b=trail[i];
            quad(dynamic,[a.x,a.y-.025,a.z],[a.x,a.y+.025,a.z],[b.x,b.y+.025,b.z],[b.x,b.y-.025,b.z],[.98,.86,.5]);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER,mobile);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dynamic),gl.DYNAMIC_DRAW);
        draw({handle:mobile,count:dynamic.length/6},0);
    }
    function project(point){
        if(!camera)return null;
        const d=[point.x-camera.eye[0],point.y-camera.eye[1],point.z-camera.eye[2]];
        const depth=dot(d,camera.forward);if(depth<=.1)return null;
        return {x:(.5+.86*dot(d,camera.right)/depth/camera.ratio)*canvas.clientWidth,
            y:(.5-.86*dot(d,camera.up)/depth)*canvas.clientHeight};
    }
    return {frame,project};
}
