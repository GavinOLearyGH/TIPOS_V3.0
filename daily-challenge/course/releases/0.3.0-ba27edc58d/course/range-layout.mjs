const yard=.9144,foot=.3048;
export const rangeLength=240*yard;
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
// Run from the left side of the tee, around the back, and down the taller right side.
const poles=[
    [0,-45,60],[48,-47,60],[90,-46,60],[132,-43,61],[167,-39,61],
    [193,-32,60],[211,-25,61],[rangeLength,-16,60],
    [rangeLength,-6,60],[rangeLength,4,60],[210,10,61],[194,15,63],
    [175,18,65],[155,20,68],[135,22,71],[115,23,73],[94,23,75],
    [72,22,78],[51,20,80],[31,17,80],[12,16,77],[0,16,73]
].map(([x,z,heightFt])=>({x,z,height:heightFt*foot}));
const spans=poles.slice(1).map((end,index)=>{
    const start=poles[index];
    return {start,end,sag:Math.min(1.1,Math.hypot(end.x-start.x,end.z-start.z)*.037)};
});
const top=point=>ground(point.x,point.z)+point.height;
const netTop=({start,end,sag},t)=>top(start)+(top(end)-top(start))*t-sag*4*t*(1-t);
export function netContact(from,to){
    let earliest=null;
    const dx=to.x-from.x,dz=to.z-from.z;
    for(const span of spans){
        const {start:a,end:b}=span;
        const sx=b.x-a.x,sz=b.z-a.z,det=dx*sz-dz*sx;
        if(Math.abs(det)<1e-9)continue;
        const x=a.x-from.x,z=a.z-from.z;
        const t=(x*sz-z*sx)/det,u=(x*dz-z*dx)/det;
        if(t<=0||t>1||u<0||u>1||earliest&&t>=earliest.t)continue;
        const hit={t,x:from.x+t*dx,y:from.y+t*(to.y-from.y),z:from.z+t*dz};
        if(hit.y<=netTop(span,u))earliest=hit;
    }
    return earliest;
}
const targetYards=[[25,-9.5],[50,11],[75,-3],[100,-18],[125,14],[150,0],[175,-13],[200,11],[225,0]];
export const rangeTargets=targetYards.map(([yards,z])=>({yards,x:Math.sqrt((yards*yard)**2-z*z),z,radius:3}));
const foliage=[[.27,.40,.21],[.32,.45,.23],[.33,.48,.25],[.38,.49,.25],[.26,.39,.24]];
function grove(count,position,seed){
    return Array.from({length:count},(_,i)=>{
        const {x,z}=position(i);
        const variant=(i*17+seed*13)%31;
        return {x,z,height:7.5+variant*.28,conifer:variant%5===0,
            color:foliage[variant%foliage.length]};
    });
}
const trees=[
    ...grove(32,i=>({x:i*7.15-10+(i*13%7)*.34,z:-44-(i*11%9)*.78}),1),
    ...grove(30,i=>({x:i*7.5-8+(i*17%9)*.33,z:-57-(i*13%10)*.9}),2),
    ...grove(34,i=>{
        const x=i*6.8-12+(i*7%8)*.37;
        return {x,z:Math.max(14,29-Math.max(0,x-145)*.21)+(i*13%11)*.83};
    },3),
    ...grove(31,i=>({x:i*7.5-9+(i*13%8)*.4,z:57+(i*17%11)*.9}),4),
    ...grove(18,i=>({x:rangeLength+6+(i*17%12)*1.25,z:-48+i*5.45}),5),
    ...grove(15,i=>({x:rangeLength+21+(i*11%10)*1.2,z:-53+i*7.3}),6),
    ...[[11,-8,10],[25,-11.4,12],[48,-19,14],[86,-21,14],[151,-31,15],[201,-22,14]]
        .map(([x,z,height])=>({x,z,height,conifer:true,color:foliage[2],shadowLength:.88}))
];
// The mown range follows the net as it tapers into the far end.
const mowingLine=[[4,-27,14],[35,-29,15],[82,-31,19],[135,-31,18],[175,-29,15],[202,-23,9],[rangeLength,-14,2]];
const fairway='M'+[...mowingLine.map(([x,left])=>[x,left]),
    ...mowingLine.toReversed().map(([x,,right])=>[x,right])].map(point=>point.join(' ')).join(' L')+' Z';
function surface(x,z){
    if(x<3)return 'tee';
    const next=mowingLine.findIndex(([station])=>x<=station);
    if(next<0)return 'rough';
    const [end,leftEnd,rightEnd]=mowingLine[next];
    const [start,leftStart,rightStart]=mowingLine[Math.max(0,next-1)];
    const t=start===end?0:(x-start)/(end-start);
    return z>=leftStart+(leftEnd-leftStart)*t&&z<=rightStart+(rightEnd-rightStart)*t?'fairway':'rough';
}
export const rangeCourse={
    bounds:{minX:-10,maxX:rangeLength+34,minZ:-57,maxZ:57},
    atlasBounds:{minX:-19,maxX:rangeLength+37,minZ:-73,maxZ:73},
    plan:{metresPerUnit:1},pathWidth:0,paths:[],
    shapes:{fairway},
    ground,renderGround:turfHeight,surface,
    scenery:{trees},
    decorate({box,quad,disk,ellipsoid}){
        const solid=[],mesh=[],metal=[.105,.13,.12],stone=[.66,.62,.53];
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
        const highlights=new Map();
        for(const target of rangeTargets){
            const {x,z}=target,y=ground(x,z),outline=[];
            const gold=[1,.84,.36];
            highlights.set(target,outline);
            disk(solid,x,y+.025,z,1.7,[.61,.66,.35]);
            for(let i=0;i<16;i++){
                const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
                const rim=(angle,radius,height=.45)=>[x+Math.cos(angle)*radius,y+height,z+Math.sin(angle)*radius];
                quad(solid,rim(a,1.61),rim(b,1.61),rim(b,1.74),rim(a,1.74),metal);
                quad(outline,rim(a,1.51,.55),rim(b,1.51,.55),rim(b,1.79,.55),rim(a,1.79,.55),gold);
                quad(outline,rim(a,1.79,.42),rim(b,1.79,.42),rim(b,1.79,.55),rim(a,1.79,.55),gold);
                if(i%4===0)box(solid,x+Math.cos(a)*1.65,y,z+Math.sin(a)*1.65,.055,.45,.055,metal);
            }
            box(solid,x,y,z-2.3,.07,.86,.07,metal);
            box(solid,x,y+.68,z-2.3,.10,.34,.88,[.90,.80,.49]);
        }
        for(const pole of poles){
            box(solid,pole.x,ground(pole.x,pole.z),pole.z,.34,pole.height,.34,metal);
        }
        const netColor=[.32,.42,.42];
        for(const span of spans){
            const {start:a,end:b}=span;
            const sections=12;
            const sample=t=>{
                const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
                return [x,ground(x,z),z,netTop(span,t)];
            };
            for(let i=0;i<sections;i++){
                const [x,y,z,h]=sample(i/sections),[nx,ny,nz,nh]=sample((i+1)/sections);
                quad(solid,[x,h-.105,z],[nx,nh-.105,nz],[nx,nh,nz],[x,h,z],metal);
                quad(mesh,[x,y,z],[nx,ny,nz],[nx,nh,nz],[x,h,z],netColor);
                quad(solid,[x,y,z],[nx,ny,nz],[nx,ny+.055,nz],[x,y+.055,z],metal);
            }
        }
        return {solid,mesh,highlights};
    }
};
