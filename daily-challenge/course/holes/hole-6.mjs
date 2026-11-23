import {clamp,mix,ease} from '../../core/physics.mjs';
const scale=.153,courseWidth=1400*scale,courseDepth=500*scale;
const tees={back:{x:145.5*scale,z:276*scale},middle:{x:247.5*scale,z:271*scale},forward:{x:504*scale,z:262*scale}};
const greenComplex={
    outline:"M1128 179Q1134 164 1147 161L1198 160Q1219 162 1243 179L1272 191Q1298 204 1303 231Q1308 257 1303 282Q1296 306 1273 317Q1253 324 1217 322Q1185 322 1158 311Q1143 301 1143 274Q1141 252 1129 228Q1117 209 1128 179Z",
    frame:{front:[1122,242],back:[1306,242],width:164},
    center:[1215,242],
    pinLocations:{
        frontLeft:[1154,193],front:[1165,243],frontRight:[1169,282],
        middleLeft:[1214,200],middle:[1226,242],middleRight:[1245,279],
        backLeft:[1255,213],back:[1263,244],backRight:[1278,280]
    },
    tiers:{datum:-.18,backRise:.24,rightRise:.035,frontLeftFall:.135,
        ridge:{depth:[.35,.37,.66],rise:.23,width:.22}},
    // A surveyed green can supply elevations in metres instead of estimated tiers.
    // Rows run front to back and columns run left to right across the frame.
    elevations:null
};
const pins=Object.fromEntries(Object.entries(greenComplex.pinLocations)
    .map(([name,[x,z]])=>[name,{x:x*scale,z:z*scale}]));
const greenCenter={x:greenComplex.center[0]*scale,z:greenComplex.center[1]*scale};
const shapes = {"teeArea": "M120 253Q121 229 151 229L224 230Q252 215 291 216L371 216Q410 209 451 212L523 212Q570 212 586 230Q605 245 605 265L605 302Q602 328 558 335Q445 344 327 337Q231 331 150 312Q113 307 120 253Z", "tee": "M139 254L380 243L381 297L141 309Z M459 239L577 235L581 286L464 290Z", "fairway": "M730 271Q734 228 757 211Q778 199 797 188Q814 179 843 178L934 178Q945 185 954 202L981 235Q996 258 997 291Q997 339 984 366Q976 382 958 380Q895 382 827 367Q776 357 747 331Q724 313 730 271Z", "surround": "M1031 191Q1040 148 1102 129Q1167 113 1210 127Q1274 143 1304 185Q1334 211 1321 281Q1313 318 1273 337L1266 344L1264 374Q1240 399 1189 393Q1156 393 1142 371L1135 344Q1119 327 1117 302Q1112 250 1088 228Q1071 208 1039 202Z", "water": "M943 116Q954 111 965 130Q978 148 988 170Q1000 194 1019 218Q1031 224 1062 223Q1100 225 1112 245Q1118 256 1117 279L1119 313Q1119 333 1104 345Q1095 353 1081 359Q1062 338 1047 310Q1030 281 1011 258Q991 234 976 214Q953 193 948 159Z", "wall": "M1021 222Q1047 221 1063 222Q1098 223 1112 242Q1120 253 1118 279L1120 314Q1120 332 1107 344Q1097 354 1082 359", "green": greenComplex.outline, "sand": "M1147 337Q1151 322 1164 325Q1175 326 1186 337Q1193 347 1207 342Q1223 338 1229 351Q1235 367 1221 378Q1209 386 1180 381Q1155 377 1148 366Q1142 355 1147 337Z"};
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
const geometryPaths=Object.fromEntries(Object.entries(shapes).map(([key,value])=>[key,geometryPath(value)]));

const palette={rough:'#4e6c40',teeArea:'#577b46',tee:'#78a66b',fairway:'#7da65c',
    surround:'#668a4f',water:'#356a7e',bridge:'#a69677',green:'#92b864',sand:'#d7be88'};
const wall=sampleGeometryPath(geometryPaths.wall[0],70).map(p=>({x:p.x*scale,z:p.z*scale}));
const bunkerEdge=sampleGeometryPath(geometryPaths.sand[0],97);
const waterHeight=-3.45;
function terrainSurface(x,z){
    const px=x/scale,pz=z/scale;
    for(const key of ['water','sand','green','tee','fairway','surround']){
        if(containsPoint(geometryPaths[key],px,pz))return key;
    }
    return 'rough';
}
function makeGreenHeight({frame,tiers,elevations}){
    const {front,back,width}=frame;
    const dx=back[0]-front[0],dz=back[1]-front[1],length=Math.hypot(dx,dz);
    const ux=dx/length,uz=dz/length;
    return (x,z)=>{
        const px=x/scale-front[0],pz=z/scale-front[1];
        const depth=clamp((px*ux+pz*uz)/length,0,1);
        const across=clamp(.5+(pz*ux-px*uz)/width,0,1);
        if(elevations){
            const row=depth*(elevations.length-1), column=across*(elevations[0].length-1);
            const i=Math.min(elevations.length-2,Math.floor(row));
            const j=Math.min(elevations[0].length-2,Math.floor(column));
            const low=mix(elevations[i][j],elevations[i][j+1],column-j);
            const high=mix(elevations[i+1][j],elevations[i+1][j+1],column-j);
            return mix(low,high,row-i);
        }
        const {ridge}=tiers,[left,curve,right]=ridge.depth;
        const ridgeDepth=mix(mix(left,curve,across),mix(curve,right,across),across);
        const tierLift=ridge.rise*ease(.5+(depth-ridgeDepth)/ridge.width);
        const cornerFall=tiers.frontLeftFall*(1-depth)**2*(1-across)**3;
        return tiers.datum+tiers.backRise*depth+tiers.rightRise*across+tierLift-cornerFall;
    };
}
const greenHeight=makeGreenHeight(greenComplex);
function bunkerDepth(px,pz){
    let closestSquared=Infinity;
    for(let i=1;i<bunkerEdge.length;i++){
        const a=bunkerEdge[i-1],b=bunkerEdge[i];
        const dx=b.x-a.x,dz=b.z-a.z;
        const distanceSquared=dx*dx+dz*dz;
        if(!distanceSquared)continue;
        const t=clamp(((px-a.x)*dx+(pz-a.z)*dz)/distanceSquared,0,1);
        const offsetX=px-a.x-t*dx,offsetZ=pz-a.z-t*dz;
        closestSquared=Math.min(closestSquared,offsetX**2+offsetZ**2);
    }
    return .55*ease(Math.sqrt(closestSquared)*scale/1.7);
}
function baseGround(x,z){
    const px=x/scale,pz=z/scale;
    if(px<615)return .08*Math.sin(pz*.025)*ease((615-px)/100);
    const lie=terrainSurface(x,z);
    if(lie==='water')return waterHeight-.16;
    if(lie==='green')return greenHeight(x,z);
    let bank=-3.37*ease((px-610)/430);
    if(pz>365)bank=mix(bank,-2.75,ease((pz-365)/70));
    if(pz<155)bank=mix(bank,-1.4,ease((155-pz)/60));
    // Blend the broad approach bank into the steeper rise behind the wall.
    // Fade with distance along the wall so its ends join the surrounding grass.
    const wallBlend=ease((pz-219)/24)*ease((358-pz)/33);
    // The front-left shoulder reaches putting height before the green starts.
    const frontShoulder=ease((pz-148)/20)*ease((247-pz)/13);
    const approachRise=ease((px-1032)/mix(109,90,frontShoulder));
    let rise=approachRise;
    if(wallBlend>0&&px>1020&&px<1141){
        let crest=wall[0].x/scale;
        for(let i=1;i<wall.length;i++){
            const a=wall[i-1],b=wall[i];
            if(a.z>=b.z)continue;
            crest=b.x/scale;
            if(z>b.z)continue;
            crest=mix(a.x,b.x,clamp((z-a.z)/(b.z-a.z),0,1))/scale;
            break;
        }
        rise=mix(approachRise,ease((px-crest)/8),wallBlend);
    }
    const high=greenHeight(x,z);
    return mix(bank,high,rise)-(lie==='sand'?bunkerDepth(px,pz):0);
}
// Fit the stone crest to the grass uphill of the wall, then feather both ends
// into the pond bank. Arc-length samples give the ends independent tapers.
for(let i=0;i<wall.length;i++){
    const p=wall[i],a=wall[Math.max(0,i-1)],b=wall[Math.min(wall.length-1,i+1)];
    const length=Math.hypot(b.x-a.x,b.z-a.z);
    p.nx=(b.z-a.z)/length;
    p.nz=(a.x-b.x)/length;
    p.shoulder=baseGround(p.x+p.nx*1.45,p.z+p.nz*1.45);
    const taper=ease(i/27)*ease((wall.length-1-i)/17);
    const bankTop=waterHeight+.07;
    p.top=mix(bankTop,Math.max(bankTop,p.shoulder),taper);
}
function terrainGround(x,z){
    const height=baseGround(x,z),width=1.45;
    if(x<1019*scale-width||x>1122*scale+width||z<220*scale-width||
        z>360*scale+width||terrainSurface(x,z)==='water')return height;
    let best=width**2,crest,shoulder,side,aroundEnd;
    for(let i=1;i<wall.length;i++){
        const a=wall[i-1],b=wall[i],dx=b.x-a.x,dz=b.z-a.z;
        const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
        const ox=x-mix(a.x,b.x,t),oz=z-mix(a.z,b.z,t);
        const distance=ox*ox+oz*oz;
        if(distance>=best)continue;
        best=distance;
        crest=mix(a.top,b.top,t);
        side=ox*mix(a.nx,b.nx,t)+oz*mix(a.nz,b.nz,t);
        shoulder=mix(a.shoulder,b.shoulder,t);
        aroundEnd=(i===1&&t===0)||(i===wall.length-1&&t===1);
    }
    if(crest===undefined)return height;
    const retainedSide=aroundEnd?ease((side+.45)/.45):side>=-.015?1:0;
    const distance=Math.sqrt(best)/width;
    const grade=mix(crest,shoulder,ease(distance));
    return mix(height,grade,retainedSide*(1-ease((distance-.65)/.35)));
}
const bridge={x:972*scale,z:179*scale,ux:.91,uz:-Math.sqrt(1-.91**2),
    start:-24*scale,end:27*scale,halfWidth:8*scale,crown:.88};
function bridgePoint(t,width){
    const d=mix(bridge.start,bridge.end,t);
    return {x:bridge.x+bridge.ux*d-bridge.uz*width,z:bridge.z+bridge.uz*d+bridge.ux*width};
}
const bridgeCorners=[bridgePoint(0,-bridge.halfWidth),bridgePoint(1,-bridge.halfWidth),
    bridgePoint(1,bridge.halfWidth),bridgePoint(0,bridge.halfWidth)];
const bridgeBank=bridgeCorners.map(p=>terrainGround(p.x,p.z));
function bridgeDeck(t,width){
    const side=(width/bridge.halfWidth+1)/2;
    const near=mix(bridgeBank[0],bridgeBank[3],side);
    const far=mix(bridgeBank[1],bridgeBank[2],side);
    return mix(near,far,t)+bridge.crown*Math.sin(Math.PI*t)**2;
}
function bridgeHeight(x,z){
    const dx=x-bridge.x,dz=z-bridge.z;
    const d=dx*bridge.ux+dz*bridge.uz,width=-dx*bridge.uz+dz*bridge.ux;
    const tolerance=1e-7;
    if(d<bridge.start-tolerance||d>bridge.end+tolerance||Math.abs(width)>bridge.halfWidth+tolerance)return;
    return bridgeDeck(clamp((d-bridge.start)/(bridge.end-bridge.start),0,1),
        clamp(width,-bridge.halfWidth,bridge.halfWidth));
}
function ground(x,z){return bridgeHeight(x,z)??terrainGround(x,z);}
function surface(x,z){return bridgeHeight(x,z)===undefined?terrainSurface(x,z):'bridge';}

shapes.bridge=bridgeCorners.map((p,i)=>(i?'L':'M')+p.x/scale+' '+p.z/scale).join('')+'Z';
function meshes({triangle,quad,disk,ellipsoid,post}){
    const white=[1,1,1];
    const mesh=[], lake=[], solid=[], bank=[], shoreline=[];
    const unit=scale*4,nx=350,nz=125,heights=[];
    for(let i=0;i<=nx;i++){
        heights[i]=[];
        for(let j=0;j<=nz;j++)heights[i][j]=ground(i*unit,j*unit);
    }
    const point=(i,j)=>[i*unit,heights[i][j],j*unit];
    const grassEdge=wall.map(p=>[p.x+p.nx*.82,0,p.z+p.nz*.82]);
    const wetEdge=wall.map(p=>[p.x-p.nx*.62,waterHeight,p.z-p.nz*.62]);
    const edgeSide=(a,b,p)=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]);
    const interpolate=(a,b,t)=>a.map((value,i)=>mix(value,b[i],t));
    const cutCells=new Map();
    for(let i=1;i<wall.length;i++){
        const cut=[wetEdge[i-1],wetEdge[i],grassEdge[i],grassEdge[i-1]];
        if(edgeSide(cut[0],cut[1],cut[2])<0)cut.reverse();
        const bounds=axis=>cut.map(p=>Math.floor(p[axis]/unit));
        const xs=bounds(0),zs=bounds(2);
        for(let x=Math.min(...xs);x<=Math.max(...xs);x++)for(let z=Math.min(...zs);z<=Math.max(...zs);z++){
            const key=x*nz+z;
            if(!cutCells.has(key))cutCells.set(key,[]);
            cutCells.get(key).push(cut);
        }
    }
    // Split a triangle against the narrow strip around each wall segment.
    // Keep its outside pieces, with heights interpolated along the cut edges.
    function outsideCut(polygon,cut){
        const outside=[];
        for(let i=0;polygon.length>=3&&i<cut.length;i++){
            const a=cut[i],b=cut[(i+1)%cut.length],inside=[],piece=[];
            let p=polygon.at(-1),distance=edgeSide(a,b,p);
            for(const q of polygon){
                const next=edgeSide(a,b,q);
                if((distance>=0)!==(next>=0)){
                    const joint=interpolate(p,q,distance/(distance-next));
                    inside.push(joint);piece.push(joint);
                }
                (next>=0?inside:piece).push(q);
                p=q;distance=next;
            }
            if(piece.length>=3)outside.push(piece);
            polygon=inside;
        }
        return outside;
    }
    function gridHeight(x,z){
        const i=Math.floor(x/unit),j=Math.floor(z/unit),u=x/unit-i,v=z/unit-j;
        const a=heights[i][j],b=heights[i+1][j],c=heights[i+1][j+1],d=heights[i][j+1];
        return u>=v?a+(b-a)*u+(c-b)*v:a+(c-d)*u+(d-a)*v;
    }
    // Include each grid edge and diagonal along the grass seam so both meshes
    // have the same straight edges and heights at their join.
    function gridCuts(a,b){
        const cuts=[0,1];
        for(const [start,end] of [[a[0],b[0]],[a[2],b[2]],[a[0]-a[2],b[0]-b[2]]]){
            for(let grid=Math.floor(Math.min(start,end)/unit)+1;grid*unit<Math.max(start,end);grid++){
                const t=(grid*unit-start)/(end-start);
                if(t>1e-7&&t<1-1e-7)cuts.push(t);
            }
        }
        return cuts.sort((a,b)=>a-b);
    }
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
        const front=heights[i][j]+heights[i][j+1],back=heights[i+1][j]+heights[i+1][j+1];
        const left=heights[i][j]+heights[i+1][j],right=heights[i][j+1]+heights[i+1][j+1];
        const light=clamp(1-(.85*(back-front)+.45*(right-left))/(2*unit),.74,1.12);
        const corners=[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)];
        const shade=[light,light,light],cuts=cutCells.get(i*nz+j);
        if(!cuts){
            quad(mesh,...corners,shade);
            continue;
        }
        let pieces=[[corners[0],corners[1],corners[2]],[corners[0],corners[2],corners[3]]];
        for(const cut of cuts)pieces=pieces.flatMap(piece=>outsideCut(piece,cut));
        for(const piece of pieces)for(let k=1;k<piece.length-1;k++){
            triangle(mesh,piece[0],piece[k],piece[k+1],shade);
        }
    }
    quad(lake,[0,waterHeight,0],[courseWidth,waterHeight,0],[courseWidth,waterHeight,courseDepth],[0,waterHeight,courseDepth],white);
    for(let i=1;i<wall.length;i++){
        const a=wall[i-1],b=wall[i];
        for(let j=0;j<5;j++){
            const c=.30+.075*((i*7+j*11)%5)/4;
            const bottom=waterHeight+j*(a.top-waterHeight)/5;
            const top=waterHeight+(j+1)*(a.top-waterHeight)/5;
            quad(solid,[a.x,bottom,a.z],[b.x,waterHeight+j*(b.top-waterHeight)/5,b.z],
                [b.x,waterHeight+(j+1)*(b.top-waterHeight)/5,b.z],[a.x,top,a.z],[c+.055,c+.025,c]);
        }
    }
    for(let i=1;i<wall.length;i++){
        const a=wall[i-1],b=wall[i],start=grassEdge[i-1],end=grassEdge[i];
        const cuts=gridCuts(start,end);
        const crest=t=>[mix(a.x,b.x,t),mix(a.top,b.top,t),mix(a.z,b.z,t)];
        const grass=t=>{
            const p=interpolate(start,end,t);
            p[1]=gridHeight(p[0],p[2]);
            return p;
        };
        for(let j=1;j<cuts.length;j++){
            const from=cuts[j-1],to=cuts[j];
            quad(bank,crest(from),crest(to),grass(to),grass(from),[.97,.97,.97]);
        }
        quad(shoreline,[a.x,waterHeight,a.z],[b.x,waterHeight,b.z],wetEdge[i],wetEdge[i-1],white);
    }
    const bridgeStone=[.68,.66,.61],bridgeEdge=[.78,.76,.70];
    const deckPoint=(t,w,dy)=>{
        const p=bridgePoint(t,w);
        return [p.x,bridgeDeck(t,w)+dy,p.z];
    };
    const across=bridge.halfWidth,edge=.16;
    for(let i=0;i<24;i++){
        const a=i/24,b=(i+1)/24;
        const shade=bridgeStone.map(c=>c*(i%2?.97:1));
        quad(solid,deckPoint(a,-across,0),deckPoint(b,-across,0),
            deckPoint(b,across,0),deckPoint(a,across,0),shade);
        quad(solid,deckPoint(a,-across,-.29),deckPoint(b,-across,-.29),
            deckPoint(b,across,-.29),deckPoint(a,across,-.29),[.48,.47,.43]);
        for(const side of [-1,1]){
            const w=side*across,inner=side*(across-edge);
            quad(solid,deckPoint(a,w,-.29),deckPoint(b,w,-.29),deckPoint(b,w,.045),deckPoint(a,w,.045),shade);
            quad(solid,deckPoint(a,w,.045),deckPoint(b,w,.045),
                deckPoint(b,inner,.045),deckPoint(a,inner,.045),bridgeEdge);
            quad(solid,deckPoint(a,inner,0),deckPoint(b,inner,0),
                deckPoint(b,inner,.045),deckPoint(a,inner,.045),bridgeEdge);
        }
    }
    for(const t of [0,1]){
        quad(solid,deckPoint(t,-across,-.29),deckPoint(t,across,-.29),
            deckPoint(t,across,0),deckPoint(t,-across,0),bridgeStone);
    }
    for(const {x,z,height:h} of trees){
        const y=ground(x,z);
        disk(solid,x,y+.035,z,1.2,[.28,.39,.24]);
        post(solid,x,z,y,h*.55,.17,[.28,.21,.14]);
        ellipsoid(solid,x,y+h*.69,z,h*.29,h*.41,h*.27,[.29,.46,.26],9,5);
        ellipsoid(solid,x+.75,y+h*.58,z+.55,h*.22,h*.25,h*.25,[.27,.43,.24],8,4);
    }

    return [{vertices:mesh,kind:1},{vertices:bank,kind:4},{vertices:lake,kind:2},{vertices:shoreline,kind:3},{vertices:solid,kind:0}];
}
const trees=[[19,15,7],[31,18,8],[51,13,10],[76,16,8],[88,11,9],[102,14,8],[118,14,8],
        [145,13,10],[148,20,11],[154,30,10],[153,41,10],[143,47,8],[129,49,8],[116,50,6],
        [101,47,7],[83,48,8],[65,46,8],[42,49,7],[25,45,8],[15,45,7]].map(([x,z,height])=>({x:x*scale/.115,z:z*scale/.115,height}));

export const hole6={id:'springhaven-6',number:6,name:'The Springhaven Club - Hole 6',par:3,title:'The pond green',
 description:'The original Hole 6, with its pond, stone wall, bridge and two-tier green.',
 plan:{width:1400,height:500,metresPerUnit:scale},shapes,connectedTrees:trees,
 tees:Object.entries(tees).map(([id,p])=>({id,name:id[0].toUpperCase()+id.slice(1),...p,yards:Math.round(Math.hypot(p.x-greenCenter.x,p.z-greenCenter.z)/.9144)})),
 bounds:{minX:60*scale,maxX:1345*scale,minZ:59*scale,maxZ:470*scale},
 create(){return {...this,ground,surface,terrainGround,terrainSurface,waterHeight,wall,bridgeHeight,
 wallBounds:{top:1,minX:1019*scale,maxX:1122*scale,minZ:220*scale,maxZ:360*scale},
 mapFeatures:[{points:bridgeCorners,color:'#b6ad95'}],
 atlasBounds:{minX:0,minZ:0,maxX:courseWidth,maxZ:courseDepth},meshes,
 pins:Object.entries(pins).map(([id,p])=>({id,...p})),paths:[],pathWidth:1.8,
 green:{readRadius:greenComplex.frame.width*scale/2},
 greenBounds:{minX:1120*scale,maxX:1310*scale,minZ:155*scale,maxZ:325*scale},
 aimTarget:(_point,pin)=>pin??pins.middle};}
};
