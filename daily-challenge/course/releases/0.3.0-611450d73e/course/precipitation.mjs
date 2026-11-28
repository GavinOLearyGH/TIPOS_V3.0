export function precipitationOverlay(canvas,sky){
    if(sky!=='rain'&&sky!=='snow')return null;
    const context=canvas.getContext('2d');
    if(!context)return null;
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const rain=sky==='rain',count=rain?64:34;
    const flakes=Array.from({length:count},(_,i)=>({
        x:((i*71+11)%103)/103,y:((i*53+31)%101)/101,rate:.66+(i%7)/14,size:1+(i%5)/5
    }));
    return (now,overhead)=>{
        canvas.hidden=overhead||Boolean(reduced?.matches);
        if(canvas.hidden)return;
        const width=canvas.clientWidth,height=canvas.clientHeight;
        if(canvas.width!==width)canvas.width=width;
        if(canvas.height!==height)canvas.height=height;
        context.clearRect(0,0,width,height);
        const seconds=now/1000;
        context.strokeStyle='rgba(224,237,249,.38)';
        context.fillStyle='rgba(250,252,255,.82)';
        context.beginPath();
        for(const flake of flakes){
            const y=(flake.y*height+seconds*flake.rate*(rain?430:34))%height;
            const drift=rain?y*.28:Math.sin(seconds+flake.y*7)*12;
            const x=(flake.x*width+drift+width)%width;
            if(rain){
                context.moveTo(x,y);
                context.lineTo(x+4*flake.size,y+14*flake.size);
            }else{
                context.moveTo(x+flake.size,y);
                context.arc(x,y,flake.size,0,Math.PI*2);
            }
        }
        if(rain)context.stroke();
        else context.fill();
    };
}
