const yard=.9144,foot=.3048;
export const rangeLength=240*yard;
const halfWidth=41;
export const rangeLies={
    Tee:{x:0,z:0,surface:'tee',id:'teed'},
    Mat:{x:0,z:0,surface:'tee',id:'tee'},
    Fairway:{x:10,z:-6,surface:'fairway',id:'fairway'},
    Rough:{x:10,z:37,surface:'rough',id:'rough'}
};
const ground=(x,z)=>.42*Math.sin(Math.max(0,x)/45)*Math.cos(z/45);
const heights=[60,62,68,74,80,76,70,64,60];
const netPoints=heights.map((height,i)=>({x:i*rangeLength/(heights.length-1),height:height*foot}));
const segments=[];
for(const side of [-1,1]){
    const points=netPoints.map(point=>({...point,z:side*halfWidth,height:side===1?point.height:(60+(point.height/foot-60)*.45)*foot}));
    for(let i=1;i<points.length;i++)segments.push([points[i-1],points[i]]);
}
for(let i=0;i<4;i++)segments.push([i,i+1].map(n=>({x:rangeLength,z:-halfWidth+n*halfWidth/2,height:60*foot})));
const top=point=>ground(point.x,point.z)+point.height;
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
        if(hit.y<=top(a)+(top(b)-top(a))*u)earliest=hit;
    }
    return earliest;
}
const targets=[[30,-13],[50,11],[75,-3],[100,-18],[125,14],[150,0],[175,-13],[200,11],[225,0]];
const trees=Array.from({length:30},(_,i)=>({x:Math.floor(i/2)*16-5,z:(i%2?1:-1)*(44+i%5*2),height:7+i%6}));
export const rangeCourse={
    bounds:{minX:-10,maxX:rangeLength+34,minZ:-57,maxZ:57},
    plan:{metresPerUnit:1},pathWidth:0,paths:[],
    shapes:{fairway:`M4 -32 L${rangeLength} -32 L${rangeLength} 32 L4 32 Z`},
    ground,surface:(x,z)=>x<3?'tee':Math.abs(z)<32?'fairway':'rough',
    scenery:{trees},
    decorate({box,quad,disk}){
        const solid=[],mesh=[],poles=new Set(),metal=[.12,.16,.14],sandstone=[.67,.63,.52];
        box(solid,-.9,-.04,0,7,.035,28,sandstone);
        for(let z=-10;z<=10;z+=4){
            box(solid,-.7,-.015,z,3.7,.03,3,[.24,.34,.22]);
            box(solid,-1,.015,z+1.75,1,.13,.55,metal);
            for(let i=0;i<4;i++)disk(solid,-1.3+i*.18,.15,z+1.75,.06,[.94,.94,.88]);
        }
        // Fence runs front-to-back at the two outside edges of the bay row.
        for(const z of [-14,14]){
            for(let x=-4;x<=2.5;x+=.5)box(solid,x,0,z,.07,.95,.07,metal);
            for(const y of [.2,.87])box(solid,-.75,y,z,6.5,.07,.08,metal);
        }
        for(const [yards,z] of targets){
            const x=yards*yard,y=ground(x,z);
            disk(solid,x,y+.025,z,1.7,[.61,.66,.35]);
            for(let i=0;i<16;i++){
                const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
                const rim=(angle,radius)=>[x+Math.cos(angle)*radius,y+.45,z+Math.sin(angle)*radius];
                quad(solid,rim(a,1.65),rim(b,1.65),rim(b,1.72),rim(a,1.72),metal);
                if(i%4===0)box(solid,x+Math.cos(a)*1.65,y,z+Math.sin(a)*1.65,.055,.45,.055,metal);
            }
            box(solid,x,y,z-2.3,.06,.7,.06,metal);
            box(solid,x,y+.58,z-2.3,.08,.26,.65,[.83,.75,.49]);
        }
        for(const [a,b] of segments){
            const at=top(a),bt=top(b),ag=ground(a.x,a.z),bg=ground(b.x,b.z);
            for(const point of [a,b]){
                const key=point.x+':'+point.z;
                if(poles.has(key))continue;
                poles.add(key);
                box(solid,point.x,ground(point.x,point.z),point.z,.18,point.height,.18,metal);
            }
            quad(solid,[a.x,at-.055,a.z],[b.x,bt-.055,b.z],[b.x,bt,b.z],[a.x,at,a.z],metal);
            quad(mesh,[a.x,ag,a.z],[b.x,bg,b.z],[b.x,bt,b.z],[a.x,at,a.z],[.25,.32,.27]);
        }
        return {solid,mesh};
    }
};
