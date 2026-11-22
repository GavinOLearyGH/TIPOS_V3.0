// Choose once per setup. The existing physics applies this vector throughout play.
export function randomWind(random=Math.random){
    return {wind:String(Math.min(7,Math.floor(random()*8))),mph:String(4+Math.min(8,Math.floor(random()*9)))};
}
