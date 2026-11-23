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
