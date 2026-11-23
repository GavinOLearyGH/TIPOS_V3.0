const ballRadius = 0.02135;
const cupRadius = 0.054;
const stepTime = 1 / 240;
const clubs = {
    '3 Iron':{grassRelease:.81,carry:184,loft:14,apex:70,roll:1.10},
    '4 Iron':{grassRelease:.83,carry:174,loft:15,apex:71,roll:1.08},
    '5 Iron':{grassRelease:.88,carry:161,loft:16.5,apex:73,roll:1.05},
    '6 Iron':{grassRelease:.92,carry:153,loft:18,apex:75,roll:1.02},
    '7 Iron':{grassRelease:.96,carry:145,loft:19.5,apex:76,roll:1.00},
    '8 Iron':{carry:135,loft:22.5,apex:76,roll:.92},
    '9 Iron':{carry:124,loft:25.5,apex:74,roll:.84},
    PW:{carry:110,loft:29,apex:73,roll:.72},
    GW:{carry:94,loft:33,apex:67,roll:.68},
    SW:{carry:77,loft:36,apex:60,roll:.60},
    LW:{carry:64,loft:41,apex:56,roll:.56},
    Putter:{speed:5,loft:0,minimum:.16,roll:1}
};
const bag=Object.keys(clubs);
const surfaces = {
    tee:{bounce:.32,brake:.46,forward:.7736,entry:1},
    fairway:{bounce:.14,brake:1.2,forward:.60,entry:1},
    rough:{bounce:.075,brake:2.8,forward:.42,entry:.74},
    surround:{bounce:.23,brake:.78,forward:.7304,entry:.94},
    green:{bounce:.30,brake:.36,forward:.434,entry:1},
    sand:{bounce:.025,brake:2.75,forward:.15,entry:.63},
    bridge:{bounce:.46,brake:.6,forward:.8408,entry:1},
    path:{bounce:.5,brake:.55,forward:.86,entry:1}
};
const windDirections=['Toward green','Toward green and right','Left to right','Toward tee and right','Toward tee','Toward tee and left','Right to left','Toward green and left'];
const mphToMetresPerSecond=.44704;
function windVector(direction,mph){
    const angle=direction*Math.PI/4,speed=mph*mphToMetresPerSecond;
    return {x:Math.cos(angle)*speed,z:Math.sin(angle)*speed};
}
const windPresets={calm:windVector(0,0)};
const aimStep=.00025,powerStep=.0005;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const mix = (a,b,t) => a+(b-a)*t;
const ease = t => (t=clamp(t,0,1),t*t*(3-2*t));
const newBall = (point, ground) => ({...point,y:ground(point.x,point.z)+ballRadius,
    vx:0,vy:0,vz:0,mode:'rest',wall:false,time:0,cupCooldown:0});

function flightStep(ball,wind,dt){
    const vx=ball.vx,vy=ball.vy,vz=ball.vz;
    const speed=Math.hypot(vx,vy,vz),drag=.0032*speed;
    // Retain the calibrated calm trajectory, including its integration order.
    ball.vx-=vx*drag*dt;
    ball.vz-=vz*drag*dt;
    ball.vy-=(9.81+vy*drag-ball.lift*Math.hypot(ball.vx,ball.vz)**2)*dt;
    if(wind.x||wind.z){
        const dx=vx-wind.x,dz=vz-wind.z,airSpeed=Math.hypot(dx,vy,dz);
        // Add moving-air minus calm aerodynamic forces. Lift responds to airflow
        // and acts perpendicular to it; the horizontal terms matter on ascent
        // and descent. These effective coefficients tune our simplified model,
        // without recalibrating every club or changing ground/putting physics.
        const windDrag=.008,windLift=ball.lift*2.5;
        ball.vx+=(-windDrag*(dx*airSpeed-vx*speed)+windLift*vy*wind.x)*dt;
        ball.vz+=(-windDrag*(dz*airSpeed-vz*speed)+windLift*vy*wind.z)*dt;
        ball.vy+=(-windDrag*vy*(airSpeed-speed)+windLift*(dx*dx+dz*dz-vx*vx-vz*vz))*dt;
    }
    // Rotate horizontal velocity without adding energy. Curvature fades with speed.
    if(ball.curve){
        const turn=ball.curve*Math.hypot(ball.vx,ball.vz)*dt,c=Math.cos(turn),s=Math.sin(turn),vx=ball.vx;
        ball.vx=vx*c-ball.vz*s;ball.vz=vx*s+ball.vz*c;
    }
}
function flightProfile(speed,angle,lift){
    const ball={vx:speed*Math.cos(angle),vy:speed*Math.sin(angle),vz:0,lift};
    const dt=1/120;
    let x=0,y=0,peak=0;
    for(let step=0;step<2400;step++){
        flightStep(ball,windPresets.calm,dt);
        x+=ball.vx*dt;y+=ball.vy*dt;
        peak=Math.max(peak,y);
        if(y<=0)break;
    }
    return {x,peak};
}
function calibrateClub(club){
    club.lift=.0018;
    let low=club.loft,high=club.loft+22;
    for(let pass=0;pass<12;pass++){
        club.launch=(low+high)/2;
        const angle=club.launch*Math.PI/180;
        let slow=12,fast=82;
        for(let trial=0;trial<15;trial++){
            club.speed=(slow+fast)/2;
            if(flightProfile(club.speed,angle,club.lift).x<club.carry*.9144)slow=club.speed;
            else fast=club.speed;
        }
        if(flightProfile(club.speed,angle,club.lift).peak<club.apex*.3048)low=club.launch;
        else high=club.launch;
    }
}
for(const name of bag.slice(0,-1))calibrateClub(clubs[name]);
function putterSpeed(power){
    return mix(clubs.Putter.minimum,clubs.Putter.speed,power**1.12);
}
function strike(point,ground,club,power,heading,lie,lieProfile=null){
    const config=clubs[club],putt=club==='Putter';
    const speed=putt?putterSpeed(power):config.speed*(.12+.88*power**.87);
    const loftedWedge=config.loft>=33;
    const fromSand=lie==='sand',fromRough=lie==='rough';
    const penalty=putt?1:lieProfile?.speed??(fromSand?(loftedWedge?.74:.49):fromRough?.87:1);
    const extraLaunch=(!putt&&fromSand&&loftedWedge?6:0)+(!putt?(lieProfile?.launch??0):0);
    const loft=((config.launch??config.loft)+extraLaunch)*Math.PI/180;
    const spin=putt?0:(.44+.018*config.loft)*(.45+.55*power**.8)*(lieProfile?.spin??(fromRough?.52:fromSand?.63:1));
    return {...newBall(point,ground),vx:Math.cos(heading)*speed*Math.cos(loft)*penalty,
        vy:Math.sin(loft)*speed*penalty,vz:Math.sin(heading)*speed*Math.cos(loft)*penalty,
        putted:putt,lift:(config.lift||0)*(.55+.45*power),spin,roll:config.roll,grassRelease:config.grassRelease??1,mode:putt?'roll':'air'};
}
function flagContact(from,to,pin){
    const dx=to.x-from.x,dz=to.z-from.z;
    const length=dx*dx+dz*dz;
    if(length<1e-12)return null;
    const x=from.x-pin.x,z=from.z-pin.z,radius=ballRadius+.018;
    const dot=x*dx+z*dz,offset=x*x+z*z-radius*radius;
    if(offset<0||dot>=0)return null;
    const discriminant=dot*dot-length*offset;
    if(discriminant<0)return null;
    const t=(-dot-Math.sqrt(discriminant))/length;
    return t>=0&&t<=1?t:null;
}
// Sweep the ball center against the rim. Speed tolerance decreases off center.
function cupContact(from,to,pin,speed){
    const dx=to.x-from.x,dz=to.z-from.z;
    const length=Math.hypot(dx,dz);
    if(length<1e-8)return null;
    const along=((pin.x-from.x)*dx+(pin.z-from.z)*dz)/length;
    const miss=Math.abs((pin.x-from.x)*dz-(pin.z-from.z)*dx)/length;
    const outer=cupRadius+ballRadius*0.55;
    if(miss>=outer)return null;
    const half=Math.sqrt(outer**2-miss**2);
    if(along+half<0||along-half>length)return null;
    // Wait for the closest approach unless the step starts inside the opening.
    if(along>length && (from.x-pin.x)**2+(from.z-pin.z)**2>outer**2)return null;
    const threshold=1.50*Math.sqrt(Math.max(0,1-(miss/(cupRadius*1.12))**2));
    if(miss<cupRadius*.92&&speed<=threshold)return 'capture';
    if(miss>cupRadius*.32&&speed<2.3)return 'lip';
    return 'over';
}
function crossing(a,b,c,d){
    const rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z;
    const cross=rx*sz-rz*sx;
    if(Math.abs(cross)<1e-10)return null;
    const qx=c.x-a.x,qz=c.z-a.z;
    const t=(qx*sz-qz*sx)/cross,u=(qx*rz-qz*rx)/cross;
    return t>0&&t<=1&&u>=0&&u<=1?t:null;
}

function surfaceGrade(surface,ground,x,z,floor,dx,dz,lie){
    const sample=.045;
    const ahead=surface(x+dx*sample,z+dz*sample)===lie;
    const behind=surface(x-dx*sample,z-dz*sample)===lie;
    if(!ahead&&!behind)return 0;
    const high=ahead?ground(x+dx*sample,z+dz*sample):floor;
    const low=behind?ground(x-dx*sample,z-dz*sample):floor;
    return clamp((high-low)/(sample*(Number(ahead)+Number(behind))),-4,4);
}
function landOnGrass(ball,lie,surface,ground,floor){
    const {x,z,vx,vy,vz}=ball;
    const gx=surfaceGrade(surface,ground,x,z,floor,1,0,lie);
    const gz=surfaceGrade(surface,ground,x,z,floor,0,1,lie);
    const normalLength=Math.hypot(gx,1,gz);
    const nx=-gx/normalLength,ny=1/normalLength,nz=-gz/normalLength;
    const approach=vx*nx+vy*ny+vz*nz;
    // The tangent carries the shot along the slope. The normal gives it clearance.
    const tx=vx-approach*nx,ty=vy-approach*ny,tz=vz-approach*nz;
    const impact=Math.max(0,-approach);
    const spin=ball.spin||0;
    const steep=ease((impact/Math.max(.01,Math.hypot(tx,ty,tz))-.20)/.8);
    const check=steep*clamp(.42+.45*spin,0,1);
    const material=surfaces[lie];
    // Iron release is calibrated separately from carry and green checking.
    const release=lie==='fairway'?(ball.grassRelease??1):1;
    const retained=Math.min(1,material.forward*(ball.roll||1)*mix(.90,.49,check)*release);
    const rebound=impact*material.bounce*mix(1,.76,check);
    ball.vx=tx*retained+nx*rebound;
    ball.vz=tz*retained+nz*rebound;
    ball.vy=ty*retained+ny*rebound;
    ball.firstLie??=lie;
    ball.y=floor+ballRadius;
    ball.spin=spin*.60;
    if(rebound*normalLength<.48){ball.mode='roll';ball.vy=0;}
}
function land(ball,lie,surface,ground,from,floor){
    ball.firstContact??={x:ball.x,y:floor,z:ball.z,vx:ball.vx,vy:ball.vy,vz:ball.vz};
    const material=surfaces[lie]||surfaces.rough;
    const horizontal=Math.hypot(ball.vx,ball.vz);
    const descent=clamp(-ball.vy/Math.max(.01,horizontal),0,1.5);
    let bounce=material.bounce,forward=material.forward;
    if(lie==='sand'){
        const shallow=1-ease(descent/.65);
        forward=mix(forward,.47,shallow);
        bounce=mix(bounce,.17,shallow);
    }else if(lie==='fairway'||lie==='tee'){
        forward*=mix(1.04,.94,ease(descent));
    }else if(lie==='green'){
        const firstGreen=!ball.greenContact;
        const ux=horizontal>.001?ball.vx/horizontal:0,uz=horizontal>.001?ball.vz/horizontal:0;
        const sample=.15;
        const x=ball.x+ux*sample,z=ball.z+uz*sample;
        const grade=surface(x,z)==='green'?clamp((ground(x,z)-floor)/sample,-.12,.12):0;
        const impactDescent=Math.max(0,-ball.vy/Math.max(.01,horizontal)+grade);
        const spin=ball.spin||0;
        if(firstGreen){
            ball.greenContact={x:ball.x,z:ball.z,ux,uz,angle:Math.atan2(-ball.vy,horizontal)*180/Math.PI};
        }
        const steep=ease((impactDescent-.34)/.68);
        const shallow=1-ease(impactDescent/.36);
        const check=steep*clamp(.20+.75*spin,0,1);
        forward*=1+.16*shallow-.57*check;
        bounce*=1-.30*check;
        if(firstGreen&&spin>.98&&impactDescent>.90&&horizontal>=2&&horizontal<20){
            // A steep, high-spin wedge may grip enough to come back a short distance.
            const grip=ease((spin-.98)/.18)*ease((impactDescent-.90)/.24);
            forward=mix(forward,-.10*Math.min(1,12/horizontal),grip);
        }
    }
    const fromSand=surface(from.x,from.z)==='sand';
    let hitBunkerLip=false;
    if(fromSand||lie==='sand'){
        const span=Math.hypot(ball.x-from.x,ball.z-from.z);
        hitBunkerLip=span>.001&&(floor-ground(from.x,from.z))/span>.23;
        if(hitBunkerLip){
            ball.bunkerLip=true;
            forward=-Math.min(forward,.16);
            bounce=Math.min(bounce,.12);
        }
    }
    if(['tee','fairway','rough','surround'].includes(lie)&&!hitBunkerLip){
        landOnGrass(ball,lie,surface,ground,floor);
        return;
    }
    const retained=Math.min(1,forward*(ball.roll||1));
    ball.firstLie??=fromSand&&ball.bunkerLip?'sand':lie;
    ball.y=floor+ballRadius;
    ball.vx*=retained;
    ball.vz*=retained;
    ball.vy=Math.max(0,-ball.vy*bounce);
    ball.spin=(ball.spin||0)*(lie==='green'?.46:.60);
    if(ball.vy<.62){ball.mode='roll';ball.vy=0;}
}
function estimatePutt(power,greenSpeed){
    if(power<.025)return 0;
    return Math.max(0,putterSpeed(power)**2-.023**2)/(2*surfaces.green.brake)*greenSpeed;
}
function followCupRim(ball,pin,ground,dt){
    const rim=ball.cupRim;
    const turn=Math.min(rim.remaining,dt*rim.speed/rim.radius);
    rim.angle+=rim.side*turn;
    rim.remaining-=turn;
    ball.x=pin.x+Math.cos(rim.angle)*rim.radius;
    ball.z=pin.z+Math.sin(rim.angle)*rim.radius;
    ball.y=ground(ball.x,ball.z)+ballRadius-.008*Math.sin(Math.PI*rim.remaining/rim.sweep);
    const speed=mix(rim.exitSpeed,rim.speed,rim.remaining/rim.sweep);
    ball.vx=-Math.sin(rim.angle)*rim.side*speed;
    ball.vz=Math.cos(rim.angle)*rim.side*speed;
    if(rim.remaining<=0)delete ball.cupRim;
}
function resolveFastPutt(ball,from,pin,speed){
    const miss=Math.abs((pin.x-from.x)*ball.vz-(pin.z-from.z)*ball.vx)/speed;
    const center=1-clamp(miss/.024,0,1);
    // A central putt just over capture pace loses energy and rolls through.
    const through=mix(.42,.60,clamp((speed-1.5)/.65,0,1));
    // A harder, direct strike on the stick can send the ball back.
    const firm=ease(clamp((speed-2.1)/.85,0,1));
    const retain=mix(.82,mix(through,-.23,firm),center);
    ball.vx*=retain;
    ball.vz*=retain;
    if(retain<0){
        ball.flag=true;
        ball.cupResult='Hit the flagstick. ';
        ball.cupCooldown=.32;
    }
}
function obstacleContact(ball,from,obstacle){
    const {center,radii}=obstacle;
    const p=[(from.x-center.x)/radii.x,(from.y-center.y)/radii.y,(from.z-center.z)/radii.z];
    const d=[(ball.x-from.x)/radii.x,(ball.y-from.y)/radii.y,(ball.z-from.z)/radii.z];
    const a=d.reduce((sum,n)=>sum+n*n,0),b=2*d.reduce((sum,n,i)=>sum+n*p[i],0);
    const c=p.reduce((sum,n)=>sum+n*n,0)-1,disc=b*b-4*a*c;
    if(a<1e-12||disc<0||c<0)return;
    const t=(-b-Math.sqrt(disc))/(2*a);
    if(t<0||t>1)return;
    const x=mix(from.x,ball.x,t),y=mix(from.y,ball.y,t),z=mix(from.z,ball.z,t);
    let nx=(x-center.x)/radii.x**2,ny=(y-center.y)/radii.y**2,nz=(z-center.z)/radii.z**2;
    const length=Math.hypot(nx,ny,nz);
    nx/=length;ny/=length;nz/=length;
    const velocity=ball.vx*nx+ball.vy*ny+ball.vz*nz;
    if(velocity>=0)return;
    const rebound=1+(obstacle.restitution??.2),drag=obstacle.retention??.55;
    ball.vx=(ball.vx-rebound*velocity*nx)*drag;
    ball.vy=(ball.vy-rebound*velocity*ny)*drag;
    ball.vz=(ball.vz-rebound*velocity*nz)*drag;
    ball.x=x+nx*.025;ball.y=y+ny*.025;ball.z=z+nz*.025;
    ball.obstacle=obstacle.kind;
}
function advance(ball, course, settings, dt=stepTime){
    ball.time+=dt;
    if(ball.putted)dt*=1.14;
    const {ground,surface,wall=[],waterHeight=-Infinity,bridgeHeight,terrainGround,terrainSurface}=course;
    const bounds=course.bounds;
    const insideBounds=(x,z)=>x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ;
    const {pin,wind,greenSpeed}=settings;
    const from={x:ball.x,y:ball.y,z:ball.z};
    const deckBefore=bridgeHeight?.(from.x,from.z);
    const rollsUnderDeck=ball.mode==='roll'&&deckBefore!==undefined&&from.y-ballRadius<deckBefore-.025;
    const rollingGround=rollsUnderDeck?terrainGround:ground;
    let rollingLie;
    if(ball.cupRim){
        followCupRim(ball,pin,ground,dt);
        return;
    }
    if(ball.mode==='drop'){
        ball.y-=dt*.55;
        if(ball.y<ground(pin.x,pin.z)-.13)ball.mode='holed';
        return;
    }
    if(ball.mode==='air'){
        flightStep(ball,wind,dt);
    } else if(ball.mode==='roll'){
        const sample=.07;
        const gradeX=(rollingGround(ball.x+sample,ball.z)-rollingGround(ball.x-sample,ball.z))/(sample*2);
        const gradeZ=(rollingGround(ball.x,ball.z+sample)-rollingGround(ball.x,ball.z-sample))/(sample*2);
        ball.vx-=7*clamp(gradeX,-.55,.55)*dt;
        ball.vz-=7*clamp(gradeZ,-.55,.55)*dt;
        const pace=Math.hypot(ball.vx,ball.vz);
        rollingLie=(rollsUnderDeck?terrainSurface:surface)(ball.x,ball.z);
        const base=(surfaces[rollingLie]||surfaces.rough).brake;
        const remaining=Math.max(0,pace-(rollingLie==='green'?base/greenSpeed:base)*dt);
        if(remaining<.023){ball.mode='rest';return;}
        ball.vx*=remaining/pace;
        ball.vz*=remaining/pace;
    } else return;
    ball.x+=ball.vx*dt;
    ball.z+=ball.vz*dt;
    const deckAhead=bridgeHeight?.(ball.x,ball.z);
    if(rollingLie==='bridge'&&deckAhead===undefined&&ground(ball.x,ball.z)<from.y-ballRadius-.09){
        ball.mode='air';
        ball.vy=0;
    }
    ball.y=ball.mode==='air'?ball.y+ball.vy*dt:rollingGround(ball.x,ball.z)+ballRadius;

    for(const obstacle of course.obstacles??[])obstacleContact(ball,from,obstacle);
    const wallArea=course.wallBounds;
    if(wall.length>1&&(!wallArea||Math.min(from.y,ball.y)<wallArea.top&&
        Math.max(from.x,ball.x)>=wallArea.minX&&Math.min(from.x,ball.x)<=wallArea.maxX&&
        Math.max(from.z,ball.z)>=wallArea.minZ&&Math.min(from.z,ball.z)<=wallArea.maxZ)){
        for(let i=1;i<wall.length;i++){
            const a=wall[i-1],b=wall[i];
            const t=crossing(from,ball,a,b);
            if(t===null)continue;
            const dx=b.x-a.x,dz=b.z-a.z;
            const x=mix(from.x,ball.x,t),z=mix(from.z,ball.z,t);
            const at=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
            const y=mix(from.y,ball.y,t);
            if(y-ballRadius>mix(a.top,b.top,at)||y+ballRadius<waterHeight)continue;
            let nx=b.z-a.z,nz=a.x-b.x;
            const size=Math.hypot(nx,nz);
            nx/=size;nz/=size;
            const normal=ball.vx*nx+ball.vz*nz;
            ball.vx=(ball.vx-1.32*normal*nx)*.64;
            ball.vz=(ball.vz-1.32*normal*nz)*.64;
            ball.x=from.x;ball.y=from.y;ball.z=from.z;
            ball.vy=Math.min(ball.vy,1);
            ball.wall=true;
            break;
        }
    }
    if(ball.mode==='air'&&ball.y>(course.airClearance??3)&&insideBounds(ball.x,ball.z)&&ball.time<=45)return;
    const cupFloor=pin&&(pin.floor??(pin.floor=ground(pin.x,pin.z))),rim=cupFloor+ballRadius;
    if(pin&&ball.mode==='air'&&from.y>rim&&ball.y<=rim){
        const t=(from.y-rim)/(from.y-ball.y);
        const x=mix(from.x,ball.x,t),z=mix(from.z,ball.z,t);
        if(Math.hypot(x-pin.x,z-pin.z)<=cupRadius-ballRadius&&Math.hypot(ball.vx,ball.vz)<6){
            ball.mode='drop';ball.x=pin.x;ball.y=rim;ball.z=pin.z;
            return;
        }
    }
    if(ball.flagCooldown>0)ball.flagCooldown-=dt;
    const flagT=!pin||ball.putted||ball.flagCooldown>0||Math.min(from.y,ball.y)>cupFloor+2 ? null : flagContact(from,ball,pin);
    if(flagT!==null){
        const y=mix(from.y,ball.y,flagT);
        const speed=Math.hypot(ball.vx,ball.vz);
        if(y>=rim-.005&&y<=cupFloor+1.95+ballRadius&&(ball.mode==='air'||speed>1.5)){
            const x=mix(from.x,ball.x,flagT),z=mix(from.z,ball.z,flagT);
            const normalLength=Math.hypot(x-pin.x,z-pin.z);
            const nx=(x-pin.x)/normalLength,nz=(z-pin.z)/normalLength;
            const normal=ball.vx*nx+ball.vz*nz;
            ball.x=x+nx*.001;ball.y=y;ball.z=z+nz*.001;
            ball.vx=(ball.vx-1.48*normal*nx)*.86;
            ball.vz=(ball.vz-1.48*normal*nz)*.86;
            ball.vy*=.82;
            ball.flagCooldown=.06;
            ball.flag=true;
        }
    }
    const deck=bridgeHeight?.(ball.x,ball.z);
    const underDeck=deck!==undefined&&(rollsUnderDeck||
        (ball.mode==='air'&&from.y-ballRadius<(deckBefore??deck)-.015));
    const lieAt=underDeck?terrainSurface:surface;
    const groundAt=underDeck?terrainGround:ground;
    const lie=lieAt(ball.x,ball.z);
    const floor=groundAt(ball.x,ball.z);
    if(lie==='water'&&ball.y-ballRadius<=waterHeight){
        ball.mode='water';
        return;
    }
    if(rollingLie&&rollingLie!==lie&&surfaces[lie]){
        ball.vx*=surfaces[lie].entry;
        ball.vz*=surfaces[lie].entry;
    }
    if(ball.mode==='air'&&ball.y<=floor+ballRadius){
        land(ball,lie,lieAt,groundAt,from,floor);
    }
    ball.cupCooldown-=dt;
    if(pin&&ball.putted&&ball.cupExitPending&&
        Math.hypot(from.x-pin.x,from.z-pin.z)>cupRadius+ballRadius*.55){
        ball.cupExitPending=false;
    }
    if(pin&&ball.mode==='roll'&&lie==='green'&&ball.cupCooldown<=0&&!ball.cupExitPending){
        const speed=Math.hypot(ball.vx,ball.vz);
        const hit=cupContact(from,ball,pin,speed);
        if(hit&&ball.putted)ball.cupExitPending=true;
        if(hit==='capture'){
            ball.mode='drop';ball.x=pin.x;ball.z=pin.z;
        } else if(hit==='lip'&&ball.putted){
            const dx=ball.vx/speed,dz=ball.vz/speed;
            const along=(pin.x-from.x)*dx+(pin.z-from.z)*dz;
            const x=from.x+along*dx-pin.x,z=from.z+along*dz-pin.z;
            const radius=Math.hypot(x,z);
            const bite=1-clamp((radius-cupRadius*.55)/(cupRadius*.65),0,1);
            const sweep=mix(.07,Math.PI,bite**1.5)*mix(1,.45,ease(clamp((speed-1.25)/1.05,0,1)));
            const rimSpeed=clamp(speed*.62,.16,.8);
            ball.cupRim={radius,angle:Math.atan2(z,x),side:Math.sign(x*dz-z*dx),
                sweep,remaining:sweep,speed:rimSpeed,exitSpeed:speed*mix(.88,.38,bite)};
            ball.cupResult='Lipped out. ';
            followCupRim(ball,pin,ground,0);
        } else if(hit==='lip'){
            const side=Math.sign((pin.x-from.x)*(ball.z-from.z)-(pin.z-from.z)*(ball.x-from.x))||1;
            const vx=ball.vx,vz=ball.vz;
            ball.vx=(vx*.78-vz*.52*side)*.72;
            ball.vz=(vz*.78+vx*.52*side)*.72;
            ball.cupCooldown=.22;
            ball.cupResult='Lipped out. ';
        } else if(hit==='over'){
            ball.cupCooldown=.16;
            ball.cupResult='Ran over the cup. ';
            if(ball.putted)resolveFastPutt(ball,from,pin,speed);
        }
    }
    if(ball.time>45||!insideBounds(ball.x,ball.z)||ball.mode!=='air'&&course.isOutOfBounds?.(ball.x,ball.z))ball.mode='out';
}
export {calibrateClub,ballRadius,cupRadius,stepTime,clubs,bag,surfaces,windDirections,windVector,aimStep,powerStep,clamp,mix,ease,newBall,strike,advance,estimatePutt,flightProfile};
