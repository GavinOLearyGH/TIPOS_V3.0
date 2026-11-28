import {groundGradient,mix} from '../core/physics.mjs';

export function puttingRead(ball,pin,ground){
    const span=Math.hypot(pin.x-ball.x,pin.z-ball.z);
    const elevation=Math.round((ground(pin.x,pin.z)-ground(ball.x,ball.z))/.0254);
    const elevationLabel=elevation===0?'Cup level':
        'Cup '+Math.abs(elevation)+' in '+(elevation>0?'uphill':'downhill');
    const point=progress=>{
        const x=mix(ball.x,pin.x,progress),z=mix(ball.z,pin.z,progress);
        return {x,y:ground(x,z),z};
    };
    const stations=span<=.9144?[['Mid-putt',.5]]:[['Near the ball',.08],['Mid-putt',.5],['Near the cup',.92]];
    const slopes=stations.map(([label,progress])=>{
        const at=point(progress);
        const grade=groundGradient(ground,at.x,at.z),size=Math.hypot(grade.x,grade.z);
        const degrees=(Math.atan(size)*180/Math.PI).toFixed(1);
        if(degrees==='0.0')return {label,at,degrees};
        const x=at.x-grade.x/size*.25,z=at.z-grade.z/size*.25;
        return {label,at,degrees,downhill:{x,y:ground(x,z),z}};
    });
    const reference=Array.from({length:17},(_,i)=>point(mix(.05,.95,i/16)));
    return {summary:(span/.3048).toFixed(1)+' ft · '+elevationLabel,slopes,reference};
}
