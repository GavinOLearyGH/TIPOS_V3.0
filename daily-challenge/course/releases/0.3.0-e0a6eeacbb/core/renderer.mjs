import {clamp} from './physics.mjs';
import {createVisuals} from './visuals.mjs';

export const surfaceColors={rough:'#4e6c40',tee:'#78a66b',fairway:'#7da65c',
    bridge:'#a69677',water:'#356a7e',teeArea:'#577b46',surround:'#668a4f',green:'#92b864',sand:'#d7be88',path:'#98998a'};

export function makeAtlas(course){
    const map=document.createElement('canvas');
    map.width=2048;map.height=512;
    const c=map.getContext('2d'),b=course.atlasBounds??course.bounds,unit=course.plan.metresPerUnit;
    c.scale(map.width/(b.maxX-b.minX),map.height/(b.maxZ-b.minZ));
    c.translate(-b.minX,-b.minZ);
    c.fillStyle=surfaceColors.rough;c.fillRect(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);
    c.save();c.scale(unit,unit);
    for(const kind of ['teeArea','tee','fairway','surround','water','green','sand']){
        if(!course.shapes[kind])continue;
        c.fillStyle=surfaceColors[kind];c.fill(new Path2D(course.shapes[kind]));
    }
    for(const feature of course.landforms??[]){
        c.save();c.clip(new Path2D(feature.shape));
        const step=feature.lies.cellSize/unit;
        const bounds=course.bounds;
        for(let x=Math.floor(bounds.minX/feature.lies.cellSize)*step;x<bounds.maxX/unit;x+=step)for(let z=Math.floor(bounds.minZ/feature.lies.cellSize)*step;z<bounds.maxZ/unit;z+=step){
            const profile=course.lieAt((x+step/2)*unit,(z+step/2)*unit);
            if(profile?.feature===feature.id){c.fillStyle=profile.color;c.fillRect(x,z,step+.3,step+.3);}
        }
        c.restore();
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
    if(course.shapes.sand){
        const sand=new Path2D(course.shapes.sand);
        c.save();c.clip(sand);c.lineJoin='round';
        c.save();
        // Offset the shaded face into the bunker along the fixed light axis.
        c.translate(1.65/unit,1.05/unit);
        c.strokeStyle='rgba(74,50,30,.065)';
        for(const width of [4.8,4.2,3.6,3,2.4,1.8,1.2]){
            c.lineWidth=width/unit;c.stroke(sand);
        }
        c.restore();
        c.translate(-.8/unit,-.5/unit);
        c.strokeStyle='rgba(255,233,174,.24)';
        c.lineWidth=.85/unit;c.stroke(sand);
        c.restore();
    }
    for(const tree of course.scenery?.trees??[]){
        const x=(tree.x+tree.height*.055)/unit,z=(tree.z+tree.height*.04)/unit;
        const radius=tree.height*.24/unit;
        const shadow=c.createRadialGradient(x,z,0,x,z,radius);
        shadow.addColorStop(0,'rgba(24,37,25,.29)');
        shadow.addColorStop(.5,'rgba(24,37,25,.15)');
        shadow.addColorStop(1,'rgba(24,37,25,0)');
        c.fillStyle=shadow;c.fillRect(x-radius,z-radius,2*radius,2*radius);
    }
    c.restore();
    return map;
}

export function createRenderer(canvas,course,atlas){
    const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
    if(!gl)throw Error('This browser could not start 3D graphics. Enable graphics acceleration and reload.');
    const b=course.atlasBounds??course.bounds;
    const vertex=`
        attribute vec3 a,c;uniform vec3 eye,right,up,forward;
        uniform float ratio;varying vec3 world,color;varying float depth;
        void main(){
            vec3 d=a-eye;float z=dot(d,forward);
            gl_Position=vec4(dot(d,right)*1.72/ratio,dot(d,up)*1.72,z*1.0003-.14,z);
            world=a;color=c;depth=z;
        }`;
    const fragment=`
        precision highp float;varying vec3 world,color;varying float depth;
        uniform sampler2D atlas;uniform float kind,opacity;
        void main(){
            vec3 ink=color;
            if(kind>.5){
                vec2 uv=(world.xz-vec2(${b.minX.toFixed(5)},${b.minZ.toFixed(5)}))/vec2(${(b.maxX-b.minX).toFixed(5)},${(b.maxZ-b.minZ).toFixed(5)});
                float grain=fract(sin(dot(floor(world.xz*42.),vec2(12.9898,78.233)))*43758.5453)*.055;
                vec3 sampleColor=texture2D(atlas,uv).rgb;
                bool pond=sampleColor.b>sampleColor.g+.035&&sampleColor.b>sampleColor.r+.12;
                if(kind>1.5&&kind<3.5){if(kind<2.5&&!pond)discard;float ripple=sin(world.x*5.4+sin(world.z*3.6))*sin(world.z*5.4)*.035;ink=vec3(.22,.45,.53)+ripple;}
                else{if(${course.meshes?'true':'false'}&&kind<1.5&&pond)discard;if(pond)sampleColor=vec3(.36,.49,.30);ink=sampleColor*color*(.95+grain);}
            }
            gl_FragColor=vec4(mix(ink,vec3(.73,.82,.84),clamp((depth-115.)/180.,0.,.48)),opacity);
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
    const uniforms=Object.fromEntries(['eye','right','up','forward','ratio','kind','opacity'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(uniforms.opacity,1);
    const attributes=['a','c'].map(name=>gl.getAttribLocation(program,name));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
    for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const visuals=createVisuals({gl,uniform:uniforms,draw,buffer:upload,mobile:()=>mobile,
        ground:course.ground,surface:course.surface,greenBounds:course.greenBounds??course.bounds});
    const {triangle,quad,disk,ellipsoid:sphere}=visuals;
    function box(mesh,x,y,z,w,h,d,color){
        const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
        const top=p=>[p[0],p[1]+h,p[2]];
        quad(mesh,a,b,top(b),top(a),color);quad(mesh,b,c,top(c),top(b),color.map(v=>v*.88));
        quad(mesh,c,e,top(e),top(c),color.map(v=>v*.94));quad(mesh,e,a,top(a),top(e),color);
        quad(mesh,top(a),top(b),top(c),top(e),color.map(v=>v*1.08));
    }
    function upload(vertices){
        const handle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,handle);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        return {handle,count:vertices.length/6};
    }
    const terrain=[],scenery=[];
    const custom=course.meshes?.({...visuals,post:visuals.post});
    const unit=course.renderStep??1.15;
    // Sample each terrain vertex once, including the finer church-pew relief.
    const nx=Math.ceil((b.maxX-b.minX)/unit),nz=Math.ceil((b.maxZ-b.minZ)/unit);
    const xs=Array.from({length:nx+1},(_,i)=>Math.min(b.minX+i*unit,b.maxX));
    const zs=Array.from({length:nz+1},(_,i)=>Math.min(b.minZ+i*unit,b.maxZ));
    const renderGround=course.renderGround??course.ground;
    const heights=xs.map(x=>zs.map(z=>renderGround(x,z)));
    const point=(i,j)=>[xs[i],heights[i][j],zs[j]];
    if(!custom)for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
        quad(terrain,point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),[1,1,1]);
    }
    const lightSamples=new Map();
    const sample=1.15, ground=course.terrainGround??renderGround;
    function lightTerrain(vertices){
        for(let i=0;i<vertices.length;i+=6){
            const x=vertices[i],z=vertices[i+2],key=x+':'+z;
            let shade=lightSamples.get(key);
            if(shade===undefined){
                const riseX=(ground(x+sample,z)-ground(x-sample,z))/(2*sample);
                const riseZ=(ground(x,z+sample)-ground(x,z-sample))/(2*sample);
                // Lighting stays fixed in course coordinates when the camera turns.
                const facing=(riseX*.84+riseZ*.54)/Math.hypot(1,riseX,riseZ);
                shade=clamp(1+facing*1.6,.69,1.18);
                lightSamples.set(key,shade);
            }
            vertices[i+3]=shade;
            vertices[i+4]=shade;
            vertices[i+5]=shade;
        }
        return vertices;
    }
    for(const tree of course.scenery?.trees??[]){
        const y=course.ground(tree.x,tree.z),h=tree.height;
        box(scenery,tree.x,y,tree.z,.38,h*.55,.38,[.31,.24,.15]);
        if(tree.conifer){
            for(let tier=0;tier<4;tier++){
                const radius=h*(.235-tier*.045),base=y+h*(.29+tier*.15),tip=base+h*.34;
                for(let side=0;side<8;side++){
                    const a=side*Math.PI/4,b=(side+1)*Math.PI/4;
                    triangle(scenery,[tree.x+radius*Math.cos(a),base,tree.z+radius*Math.sin(a)],
                        [tree.x+radius*Math.cos(b),base,tree.z+radius*Math.sin(b)],
                        [tree.x,tip,tree.z],[.25,.39,.22].map(c=>c*(.89+.13*Math.cos(a))));
                }
            }
        }else sphere(scenery,tree.x,y+h*.69,tree.z,h*.28,h*.4,h*.26,[.31,.46,.25]);
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
    const customBuffers=custom?.map(mesh=>({buffer:upload(mesh.kind===1?lightTerrain(mesh.vertices):mesh.vertices),kind:mesh.kind}));
    const decoration=course.decorate?.({box,quad,disk,ellipsoid:sphere});
    const features=decoration&&upload(decoration.solid), net=decoration&&upload(decoration.mesh);
    const groundBuffer=upload(lightTerrain(terrain)),sceneryBuffer=upload(scenery),mobile=gl.createBuffer();
    lightSamples.clear();
    const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const normalize=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
    let camera;
    function draw(buffer,kind){
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer.handle);
        for(let i=0;i<2;i++){
            gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],3,gl.FLOAT,false,24,i*12);
        }
        gl.uniform1f(uniforms.kind,kind);gl.drawArrays(gl.TRIANGLES,0,buffer.count);
    }
    function frame({eye,target,ball,pin,aim,trail=[],greenGrid=false,time=0,flying=false,readOpacity=null}){
        const ratio=Math.min(devicePixelRatio||1,1.5);
        const width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
        const forward=normalize(target.map((n,i)=>n-eye[i])),right=normalize(cross(forward,[0,1,0])),up=cross(right,forward);
        camera={eye,forward,right,up,ratio:width/height};
        gl.viewport(0,0,width,height);
        for(const name of ['eye','forward','right','up'])gl.uniform3fv(uniforms[name],camera[name]);
        gl.uniform1f(uniforms.ratio,camera.ratio);
        gl.clearColor(.58,.76,.83,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        if(customBuffers){for(const item of customBuffers)draw(item.buffer,item.kind);}else draw(groundBuffer,1);draw(sceneryBuffer,0);
        if(features)draw(features,0);
        if(net){
            gl.enable(gl.BLEND);gl.depthMask(false);gl.uniform1f(uniforms.opacity,.105);
            draw(net,0);
            gl.uniform1f(uniforms.opacity,1);gl.depthMask(true);gl.disable(gl.BLEND);
        }
        visuals.drawFrame({pin,ball,aim,trail,flying,right,
            gridTick:greenGrid?Math.floor(time/50):null,readOpacity});
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
