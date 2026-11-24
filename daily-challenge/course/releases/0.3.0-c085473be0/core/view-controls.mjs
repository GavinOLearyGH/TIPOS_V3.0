export function turnHeading(start,dx){const h=start-dx*.006;return Math.atan2(Math.sin(h),Math.cos(h));}
export function powerHeight(power){return Math.max(0,Math.min(1,power))*100;}
