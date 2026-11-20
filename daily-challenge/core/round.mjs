import {clubs,calibrateClub,newBall,strike,advance,stepTime,windVector} from './physics.mjs';

// Carry targets for the first course prototype. Existing iron calibration is reused.
for(const [name,carry,loft,apex,roll] of [
    ['Driver',230,10,85,.72],['3 Wood',210,12,80,.77],['4 Hybrid',190,15,78,.8]
]){
    const config={carry,loft,apex,roll,lift:.0018};
    calibrateClub(config);
    clubs[name]=config;
}
export const fullBag=['Driver','3 Wood','4 Hybrid','4 Iron','5 Iron','6 Iron','7 Iron','8 Iron','9 Iron','PW','GW','SW','LW','Putter'];

export function createRound(course,{tee=course.tees[0].id,pin=course.pins[0].id,
    windDirection=0,windMph=0,greenSpeed=1}={}){
    const startingTee=course.tees.find(item=>item.id===tee);
    const startingPin=course.pins.find(item=>item.id===pin);
    if(!startingTee||!startingPin)throw Error('Unknown tee or pin');
    const settings={pin:{...startingPin},wind:windVector(windDirection,windMph),greenSpeed};
    const state={ball:newBall(startingTee,course.ground),strokes:0,penalties:0,history:[],complete:false};
    let from;
    function hit(club,power,heading){
        if(state.complete||!['rest'].includes(state.ball.mode))return false;
        if(!fullBag.includes(club)||!Number.isFinite(power)||power<.025||power>1||!Number.isFinite(heading))return false;
        from={x:state.ball.x,z:state.ball.z};
        state.ball=strike(from,course.ground,club,power,heading,course.surface(from.x,from.z));
        state.strokes++;
        return true;
    }
    function step(){
        if(!['air','roll','drop'].includes(state.ball.mode))return;
        advance(state.ball,course,settings,stepTime);
        if(['air','roll','drop'].includes(state.ball.mode))return;
        if(state.ball.mode==='rest'&&course.isOutOfBounds?.(state.ball.x,state.ball.z))state.ball.mode='out';
        const outcome=state.ball.mode;
        state.history.push({from,to:{x:state.ball.x,z:state.ball.z},outcome});
        if(outcome==='holed')state.complete=true;
        if(['out','water'].includes(outcome)){
            // Stroke and distance for OB. Water relief can be supplied by a hole.
            const relief=outcome==='water'&&course.waterRelief?course.waterRelief(from,state.ball):from;
            state.penalties++;state.strokes++;
            state.ball=newBall(relief,course.ground);
        }
    }
    return {state,settings,hit,step};
}
