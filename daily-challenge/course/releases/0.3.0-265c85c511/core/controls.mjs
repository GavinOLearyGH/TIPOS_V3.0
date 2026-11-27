import {aimStep,clamp} from './physics.mjs';

export function dragPower(depth,putting){
    return putting?depth:depth<=.42?.8*depth/.42:.8+.2*(depth-.42)/.58;
}
export function dragHeading(start,base,dx){
    const width=Math.abs(dx);
    const turn=clamp(-Math.sign(dx)*(.00025*width+.000014*Math.max(0,width-16)**2),-.48,.48);
    return base+Math.round((start-base+turn)/aimStep)*aimStep;
}
export function shotCamera(ball,ground,heading,putting,following){
    const dx=Math.cos(heading),dz=Math.sin(heading),back=following?5.7:putting?1.8:2.5;
    const x=ball.x-dx*back,z=ball.z-dz*back;
    const y=following?Math.max(ground(x,z)+2.2,ball.y-1.2):ground(ball.x,ball.z)+(putting?1.2:1.62);
    const look=following?6:putting?5.5:14;
    return {eye:[x,y,z],target:[ball.x+dx*look,following?ball.y-.05:ground(ball.x,ball.z)-(putting?1.68:2.30),ball.z+dz*look]};
}

// Screen-space line and handle share one projected shot bearing.
export function pullGuideGeometry(anchor,bearing,depth,width,height,distance){
    const vx=bearing.x-anchor.x,vy=bearing.y-anchor.y,span=Math.hypot(vx,vy);
    if(span<.01)return null;
    const dx=vx/span,dy=vy/span,angle=Math.atan2(dy,dx);
    const room=(dx,dy,inset)=>Math.max(0,Math.min(
        dx>0?(width-inset-anchor.x)/dx:dx<0?(inset-anchor.x)/dx:Infinity,
        dy>0?(height-inset-anchor.y)/dy:dy<0?(inset-anchor.y)/dy:Infinity));
    return {dx,dy,angle,forward:Math.min(span*Math.min(1,distance),room(dx,dy,10)),
        back:Math.min(54*depth,room(-dx,-dy,18))};
}


export function startBallPull(event,rect,point,viewportHeight,heading){
    if(!point||Math.hypot(event.clientX-rect.left-point.x,event.clientY-rect.top-point.y)>55)return null;
    return {id:event.pointerId,x:event.clientX,y:event.clientY,heading,depth:0,
        travel:clamp(viewportHeight-event.clientY-20,110,200)};
}
export const pullDepth=(pull,y)=>clamp((y-pull.y)/pull.travel,0,1);
export const shotPower=value=>Math.round(clamp(value,0,1)*2000)/2000;

export function drawShotPullGuide(get,anchor,drag,renderer,ball,heading,power,putting,canvas){
    for(const id of ['pull-handle','pull-line','pull-aim'])get(id).hidden=true;
    if(!drag||!anchor)return;
    const distance=(putting?12:36)*power**.82;
    const ahead=renderer.project({x:ball.x+Math.cos(heading)*Math.max(1,distance),
        y:ball.y+.022,z:ball.z+Math.sin(heading)*Math.max(1,distance)});
    if(!ahead)return;
    const guide=pullGuideGeometry(anchor,ahead,drag.depth,canvas.clientWidth,canvas.clientHeight,distance);
    if(!guide)return;
    const {dx,dy,angle,forward,back}=guide;
    const position=(id,x,y,length)=>{
        const node=get(id);
        node.hidden=false;node.style.left=x+'px';node.style.top=y+'px';
        if(length!==undefined){node.style.width=length+'px';node.style.transform='translateY(-50%) rotate('+angle+'rad)';}
    };
    if(forward>=13)position('pull-aim',anchor.x+dx*10,anchor.y+dy*10,forward-10);
    if(back>=6)position('pull-handle',anchor.x-dx*back,anchor.y-dy*back);
    if(back>=17)position('pull-line',anchor.x-dx*(back-8),anchor.y-dy*(back-8),back-16);
}
