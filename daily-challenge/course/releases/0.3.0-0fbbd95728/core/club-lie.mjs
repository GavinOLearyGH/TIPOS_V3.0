import {clubs} from './physics.mjs';

// A teed ball is round state, not a terrain material. Landing on tee grass
// never gives a player a tee; stroke-and-distance can restore the original tee.
export function shotLie(course,state,startingTee){
    const ball=state.ball,surface=course.surface(ball.x,ball.z),profile=course.lieAt?.(ball.x,ball.z)??null;
    const teed=state.teed===true&&Math.hypot(ball.x-startingTee.x,ball.z-startingTee.z)<.05;
    return {id:teed?'teed':profile?.id??surface,surface,profile,teed};
}
export function clubLie(club,lie){
    const id=typeof lie==='string'?lie:lie.id;
    const normal={window:1,miss:1,speed:1,launch:0,lift:1,note:''};
    if(club==='Putter'||id==='teed')return normal;
    const rough=id==='rough'||id==='heavy',awkward=rough||id==='tight'||id==='sand';
    if(club==='Driver')return {window:rough?.35:.5,miss:rough?1.55:1.3,speed:rough?.88:.97,launch:rough?-4:-2,lift:.92,
        note:'Driver off the deck · Difficult contact'};
    if(club==='3 Wood'&&awkward)return {...normal,window:id==='heavy'?.6:.75,miss:1.2,speed:.95,
        note:'3 Wood · Difficult contact from this lie'};
    return normal;
}
export function recommendClub(yards,lie,bag){
    if(lie.surface==='green')return 'Putter';
    if(lie.surface==='sand')return 'SW';
    const recovery=['rough','heavy','tight'].includes(lie.id);
    const choices=bag.filter(name=>name!=='Putter'&&(lie.teed||name!=='Driver')&&(!recovery||name!=='3 Wood'));
    return [...choices].reverse().find(name=>clubs[name].carry>=yards-4)||choices[0];
}
// Compose suitability with the existing lie penalty once, retaining barranca
// speed/spin/launch rather than replacing it with a generic rough penalty.
export function contactProfile(club,lie){
    const suitability=clubLie(club,lie);
    if(suitability.speed===1&&suitability.launch===0)return lie.profile;
    const config=clubs[club],sand=lie.surface==='sand',rough=lie.surface==='rough';
    return {...lie.profile,speed:(lie.profile?.speed??(sand?(config.loft>=33?.74:.49):rough?.87:1))*suitability.speed,
        spin:lie.profile?.spin??(rough?.52:sand?.63:1),launch:(lie.profile?.launch??0)+suitability.launch};
}
