const yard=.9144,foot=.3048;
export const rangeLength=240*yard;
const halfWidth=41;
export const rangeStart={x:0,z:0};
export const rangeLies={
    Tee:{surface:'tee',id:'teed'},
    Mat:{surface:'tee',id:'tee'},
    Fairway:{surface:'fairway',id:'fairway'},
    Rough:{surface:'rough',id:'rough'}
};
const turfHeight=(x,z)=>.42*Math.sin(Math.max(0,x)/45)*Math.cos(z/45);
const ground=(x,z)=>x>=-2.55&&x<=1.15&&Math.abs(z)<=13.5&&Math.abs(z-4*Math.round(z/4))<=1.5
    ?.039:turfHeight(x,z);
const heights=[60,62,68,74,80,76,70,64,60];
const netPoints=heights.map((height,i)=>({x:i*rangeLength/(heights.length-1),height:height*foot}));
const segments=[];
for(const side of [-1,1]){
    const points=netPoints.map(point=>({...point,z:side*halfWidth,height:side===1?point.height:(60+(point.height/foot-60)*.45)*foot}));
    for(let i=1;i<points.length;i++)segments.push([points[i-1],points[i]]);
}
for(let i=0;i<4;i++)segments.push([i,i+1].map(n=>({x:rangeLength,z:-halfWidth+n*halfWidth/2,height:60*foot})));
const top=point=>ground(point.x,point.z)+point.height;
const netTop=(a,b,t)=>top(a)+(top(b)-top(a))*t-.46*4*t*(1-t);
export function netContact(from,to){
    let earliest=null;
    const dx=to.x-from.x,dz=to.z-from.z;
    for(const [a,b] of segments){
        const sx=b.x-a.x,sz=b.z-a.z,det=dx*sz-dz*sx;
        if(Math.abs(det)<1e-9)continue;
        const x=a.x-from.x,z=a.z-from.z;
        const t=(x*sz-z*sx)/det,u=(x*dz-z*dx)/det;
        if(t<=0||t>1||u<0||u>1||earliest&&t>=earliest.t)continue;
        const hit={t,x:from.x+t*dx,y:from.y+t*(to.y-from.y),z:from.z+t*dz};
        if(hit.y<=netTop(a,b,u))earliest=hit;
    }
    return earliest;
}
const targetYards=[[30,-13],[50,11],[75,-3],[100,-18],[125,14],[150,0],[175,-13],[200,11],[225,0]];
export const rangeTargets=targetYards.map(([distance,z])=>({x:distance*yard,z,radius:3}));
const trees=Array.from({length:49},(_,i)=>{
    const side=i%2?1:-1;
    return {x:Math.floor(i/2)*10-4+(i%4)*1.7,z:side*(43+(i*7)%13),
        height:6+(i*7)%10,conifer:i%5===0||i%7===0};
});
export const rangeCourse={
    bounds:{minX:-10,maxX:rangeLength+34,minZ:-57,maxZ:57},
    plan:{metresPerUnit:1},pathWidth:0,paths:[],
    shapes:{fairway:`M4 -32 L${rangeLength} -32 L${rangeLength} 32 L4 32 Z`},
    ground,renderGround:turfHeight,surface:(x,z)=>x<3?'tee':Math.abs(z)<32?'fairway':'rough',
    scenery:{trees},
    decorate({box,quad,disk,ellipsoid}){
        const solid=[],mesh=[],poles=new Set(),metal=[.105,.13,.12],stone=[.66,.62,.53];
        const rear=-4.3,front=2.5,edge=14;
        box(solid,(rear+front)/2,-.045,0,front-rear,.073,edge*2,[.42,.40,.34]);
        const tileWidth=(front-rear)/8,tileDepth=edge*2/28;
        for(let row=0;row<8;row++)for(let col=0;col<28;col++){
            const shade=.93+((row*11+col*7)%9)*.014;
            box(solid,rear+(row+.5)*tileWidth,.027,-edge+(col+.5)*tileDepth,
                tileWidth-.021,.007,tileDepth-.021,stone.map(channel=>channel*shade));
        }
        for(let z=-12;z<=12;z+=4){
            box(solid,-.7,.034,z,3.7,.005,3,[.31,.42,.26]);
            box(solid,.66,.036,z+1.23,.73,.032,.43,metal);
            for(const x of [.30,1.02])box(solid,x,.068,z+1.23,.029,.068,.43,metal);
            for(const side of [1.03,1.43])box(solid,.66,.068,z+side,.73,.061,.03,metal);
            for(let i=0;i<7;i++)ellipsoid(solid,.42+i*.075,.096,z+1.15+i%2*.13,.028,.028,.028,[.94,.94,.88],6,4);
        }
        function fenceRun(x,z,length,across){
            const bar=(offset,y,span,height,thickness)=>{
                box(solid,x+(across?0:offset),y,z+(across?offset:0),
                    across?thickness:span,height,across?span:thickness,metal);
            };
            for(const y of [.20,.87])bar(length/2,y,length,.065,.085);
            const pickets=Math.ceil(length/.19);
            for(let i=1;i<pickets;i++)bar(i*length/pickets,.12,.042,.81,.042);
            const posts=Math.ceil(length/2.3);
            for(let i=0;i<=posts;i++){
                if(across&&(i===0||i===posts))continue;
                const offset=i*length/posts;
                bar(offset,0,.13,1.04,.13);
                bar(offset,1.04,.19,.042,.19);
            }
        }
        for(const z of [-edge,edge])fenceRun(rear,z,front-rear,false);
        fenceRun(rear,-edge,edge*2,true);
        for(const {x,z} of rangeTargets){
            const y=ground(x,z);
            disk(solid,x,y+.025,z,1.7,[.61,.66,.35]);
            for(let i=0;i<16;i++){
                const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
                const rim=(angle,radius)=>[x+Math.cos(angle)*radius,y+.45,z+Math.sin(angle)*radius];
                quad(solid,rim(a,1.61),rim(b,1.61),rim(b,1.74),rim(a,1.74),metal);
                if(i%4===0)box(solid,x+Math.cos(a)*1.65,y,z+Math.sin(a)*1.65,.055,.45,.055,metal);
            }
            box(solid,x,y,z-2.3,.07,.86,.07,metal);
            box(solid,x,y+.68,z-2.3,.10,.34,.88,[.90,.80,.49]);
        }
        for(const [a,b] of segments){
            const ag=ground(a.x,a.z),bg=ground(b.x,b.z);
            for(const point of [a,b]){
                const key=point.x+':'+point.z;
                if(poles.has(key))continue;
                poles.add(key);
                box(solid,point.x,ground(point.x,point.z),point.z,.18,point.height,.18,metal);
            }
            const sections=12;
            const sample=t=>[a.x+(b.x-a.x)*t,ag+(bg-ag)*t,a.z+(b.z-a.z)*t,netTop(a,b,t)];
            for(let i=0;i<sections;i++){
                const [x,y,z,h]=sample(i/sections),[nx,ny,nz,nh]=sample((i+1)/sections);
                quad(solid,[x,h-.035,z],[nx,nh-.035,nz],[nx,nh,nz],[x,h,z],metal);
                const netColor=[.37,.44,.39];
                quad(mesh,[x,y,z],[nx,ny,nz],[nx,nh,nz],[x,h,z],netColor);
            }
        }
        return {solid,mesh};
    }
};
