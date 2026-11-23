// Choose once per setup. The existing physics applies this vector throughout play.
export function randomWind(random=Math.random){
    return {wind:String(Math.min(7,Math.floor(random()*8))),mph:String(4+Math.min(8,Math.floor(random()*9)))};
}

// Bearings are clockwise relative to Hole 1's playing direction, not true north.
export function relativeWind(direction,mph,bearing=0){
 const angle=direction*Math.PI/4-bearing*Math.PI/180,speed=mph*.44704;
 return {x:Math.cos(angle)*speed,z:Math.sin(angle)*speed};
}
