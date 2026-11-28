import {ease,mix} from '../../core/physics.mjs';

// Register the yardage book to the existing tee-to-green aerial axis.
const k=550*.9144/Math.hypot(1780-205,558-560);
const yardsToPlan=.9144/k;
const plan=(across,forward)=>[1780+forward*yardsToPlan,558+across*yardsToPlan];
const point=(across,forward)=>{const [x,z]=plan(across,forward);return {x:x*k,z:z*k};};
const trace=path=>path.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_,across,forward)=>plan(Number(across),Number(forward)).map(value=>value.toFixed(3)).join(' '));
const tee=(id,name,yards,across)=>({id,name,yards,...point(across,-Math.sqrt(yards*yards-across*across))});

// The crosshair is the origin. The front and back on the approach axis are
// 31 yards apart. Across the graph, each grid square is five yards.
const graph=(col,row)=>[(col-485)*5/106,(534-row)*31/606];
const graphTrace=path=>path.replace(/(\d+) (\d+)/g,
    (_,col,row)=>plan(...graph(Number(col),Number(row))).map(value=>value.toFixed(3)).join(' '));
const green=graphTrace('M485 862 L276 862 Q263 858 265 839 Q267 683 256 613 Q245 521 198 460 Q156 418 210 364 Q278 304 371 271 Q418 250 481 257 Q603 261 708 315 Q800 365 778 421 Q749 453 722 492 Q685 548 676 649 L677 786 Q677 851 660 862 Z');
const collar=graphTrace('M485 889 L260 889 Q236 883 238 839 Q241 690 231 615 Q220 530 174 470 Q104 426 142 365 Q207 282 318 220 Q380 191 482 197 Q633 190 734 246 Q827 299 827 355 Q842 408 747 496 Q707 556 699 650 L703 786 Q702 883 667 889 Z');
const leftSand=graphTrace('M87 475 Q133 453 171 484 Q214 514 211 567 Q199 617 222 654 Q253 741 202 731 Q172 727 134 713 Q101 702 63 709 Q15 713 23 659 Q28 623 49 587 Q68 553 70 521 Q74 486 87 475 Z');
// Separate rings leave the small island shown inside the right bunker as grass.
const rightSand=graphTrace('M787 431 Q857 386 905 407 Q922 423 927 469 Q968 590 1035 710 L1069 833 L1071 975 L1040 991 Q987 953 924 962 Q875 977 825 977 Q764 967 722 940 Q682 917 676 881 Q671 854 688 810 Q697 781 688 738 Q683 698 693 632 Q705 532 751 472 Q770 443 787 431 Z');
const sandIsland=graphTrace('M825 650 Q848 636 870 657 Q901 679 881 716 Q867 742 892 774 Q917 820 883 838 Q859 842 821 813 Q788 790 808 755 Q828 726 807 701 Q782 669 825 650 Z');

// Distances along the approach line use the book's 50-yard layup-to-bank
// measurement and 17-yard crossing. The banks fan out into the existing corridor.
const ditch=trace('M-29 -40 Q-16 -43 0 -41 Q16 -39 28 -34 Q37 -31 39 -27 L38 -14 Q30 -16 23 -19 Q12 -23 0 -24 Q-15 -25 -28 -23 L-31 -29 Z');
// The book's lateral markers anchor the yardages. The overhead supplies the
// mow lines: a long, nearly straight drive corridor with a gentle left finish.
const fairway=trace(
    'M6 -393 Q9 -407 20 -403 Q30 -401 33 -386 '+
    'Q37 -363 36 -331 Q37 -301 36 -273 Q36 -241 34 -213 '+
    'Q33 -176 29 -142 Q26 -110 22 -81 Q17 -53 11 -39 '+
    'L10 -24 Q8 -20 5 -16 L-7 -16 Q-13 -28 -14 -42 '+
    'Q-13 -62 -12 -82 Q-10 -111 -7 -143 Q-4 -180 -2 -214 '+
    'Q0 -243 2 -273 Q4 -303 4 -331 Q3 -365 4 -380 Q4 -389 6 -393 Z');
const fairwayRoute=[[19,-390],[20,-344],[20,-310],[19,-273],[17,-240],
    [15,-200],[12,-160],[8,-120],[6,-91],[2,-55],[0,-24]];
const route=fairwayRoute.map(([across,forward])=>point(across,forward));

// Groupings follow the book's tee-side trees, opposite flanks of the
// landing area, the approach-side gaps, and the lone tree short of the green.
const trees=[
    // Left edge, from tee toward the green.
    [-20,-423,9],[-10,-388,10],[-14,-351,9],[-11,-319,10],
    [-9,-281,10],[-13,-256,10],[-18,-227,10],[-20,-193,10],
    [-23,-170,10],[-22,-151,9],[-23,-124,10],
    [-43,-121,10],[-25,-95,9],[-27,-76,9],[-20,-69,10],
    [-31,-40,10],
    // Right edge. Several trees share the mid-fairway station in the book.
    [55,-423,9],[52,-388,10],[53,-350,10],[55,-319,9],
    [54,-286,10],[50,-259,10],[50,-232,10],[54,-213,9],
    [48,-198,10],[52,-190,10],[59,-188,11],[54,-151,9],
    [49,-123,10],[42,-99,11],[49,-88,9],[46,-69,10],
    // Behind the back tee.
    [-28,-562,9],[-19,-566,9],[-10,-568,10],[-1,-569,10],
    [8,-567,9],[21,-565,10],[31,-561,9],[40,-555,9]
].map(([across,forward,height])=>({...point(across,forward),height}));
const gradeStations=[[-550,1],[-468,1],[-320,4],[-274,3],[-229,3],[-206,2],[-137,2],[-114,.8],[-91,.25],[-41,.18],[-24,.13],[-17,0]];
function fairwayGrade(x){
    const forward=(x-1780)/yardsToPlan;
    const upper=gradeStations.findIndex(([at])=>at>forward);
    if(upper===0)return gradeStations[0][1]*.9144;
    if(upper<0)return 0;
    const [from,low]=gradeStations[upper-1],[to,high]=gradeStations[upper];
    return mix(low,high,ease((forward-from)/(to-from)))*.9144;
}

function tier(across,forward){
    // Height is in yards. The right side of the transition is steeper.
    const rise=mix(.19,.30,ease((across+8)/15));
    return rise*(1+Math.tanh((forward-3.4)/1.55))*.5;
}

// Fitted local gradients add the survey arrows to the two-tier surface.
const breaks=[
    [-6.08491, 9.92409, 0.00552, 0.00821],
    [-1.03774, 9.97525, -0.00028, 0.02518],
    [3.86792, 10.89604, 0.00203, -0.01087],
    [8.82075, 9.82178, 0.00700, 0.04191],
    [-9.76415, 6.44554, -0.03536, 0.02392],
    [-5.99057, 6.59901, -0.00492, -0.02788],
    [-0.99057, 6.24092, -0.00721, 0.03338],
    [4.19811, 5.52475, 0.01154, 0.00036],
    [10.00000, 7.57096, 0.02057, -0.03158],
    [-1.32075, -0.86964, 0.02774, 0.03460],
    [-6.27358, -2.50660, 0.02355, 0.02292],
    [4.48113, -2.45545, 0.00158, 0.00079],
    [-1.13208, -5.42244, -0.00686, -0.00977],
    [-5.80189, -8.59406, -0.02512, 0.01024],
    [4.71698, -9.15677, 0.00605, 0.01257],
    [-5.28302, 3.06931, -0.01598, 0.01118],
    [6.32075, 3.06931, -0.01013, 0.01683],
];
function greenContour(x,z){
    const across=(z-558)/yardsToPlan,forward=(x-1780)/yardsToPlan;
    if(Math.abs(across)>34||Math.abs(forward)>38)return 0;
    const edge=1-ease((Math.max(Math.abs(across),Math.abs(forward))-21)/12);
    let height=.024*forward+.009*across+tier(across,forward);
    for(const [side,along,riseAcross,riseForward] of breaks){
        const dx=across-side,dz=forward-along;
        height+=(riseAcross*dx+riseForward*dz)*Math.exp(-(dx*dx+dz*dz)/24.5);
    }
    return (.43+height)*edge*.9144;
}
export const hole2={
    id:'springhaven-2',number:2,bearing:177,name:'The Springhaven Club - Hole 2',title:'The barranca',par:5,
    description:'A long par 5. Position your approach to carry the playable barranca and reach a two-tier green guarded by two bunkers.',
    about:'The barranca is playable, approximately 5 ft deep, with fixed patches of smooth, heavy and tight lies. Tee distances, fairway grades, ditch crossing and green contours use the February 2025 yardage book. Bank profiles, bunker depths and grades between survey points are estimated.',
    plan:{width:2004,height:1133,metresPerUnit:k},
    bounds:{minX:125*k,maxX:1930*k,minZ:460*k,maxZ:745*k},
    airClearance:16,renderStep:.9,pathWidth:1.8,
    tees:[tee('1896','1896 (Black)',550,.7),tee('rawlins','Rawlins (Blue)',540,-16.87),
        tee('butler','Butler (Silver)',467,.68),tee('dixon','Dixon (White)',458,18.6)],
    pins:[{id:'center',name:'Center',x:1780*k,z:558*k}],
    aimPoints:[route[4],route[8]],
    flyoverPoints:route,
    shapes:{
        tee:trace('M-7 -557 L8 -557 L8 -546 L-7 -546 Z M-23 -547 L-11 -547 L-11 -525 L-23 -525 Z M-6 -474 L25 -474 L25 -451 L-6 -451 Z'),
        fairway,surround:collar,green,sand:leftSand+' '+rightSand,sandIsland
    },
    landforms:[{
        id:'barranca',name:'Barranca',shape:ditch,
        depth:1.524,bankWidth:4.2,
        lies:{cellSize:2.4,seed:202,profiles:[
            {id:'smooth',label:'Smooth lie',material:'fairway',speed:.95,spin:.90,launch:0,color:'#6b7950'},
            {id:'heavy',label:'Heavy lie',material:'rough',speed:.74,spin:.55,launch:1.5,color:'#4c613d'},
            {id:'tight',label:'Tight lie',material:'fairway',speed:.98,spin:.80,launch:-2,color:'#928360'}
        ]}
    }],
    paths:[
        'M172 519Q157 567 191 595Q286 607 396 552Q440 538 556 544Q797 527 1057 558L1454 565Q1574 556 1640 540',
        'M1698 489Q1718 462 1755 455',
        'M1826 654Q1898 602 1931 588'
    ],
    scenery:{trees,buildings:[{x:109*k,z:676*k,width:15,height:5,depth:10}]},
    terrain:{baseRipple:0,rippleLength:80,elevation:fairwayGrade,bunkerDepth:.65,bunkerBlend:2},
    green:{front:1780-31*328/606*yardsToPlan,depth:31*yardsToPlan,center:[1780,558],blend:[110,103],
        backToFrontRise:0,contour:greenContour},
    provisional:['Tee offsets and fairway widths between survey references','Barranca bank profiles and lie patch locations','Tree heights and bunker depths'],
    sources:['February 2025 Springhaven yardage book','Supplied Hole 2 aerial, PARennial overhead and playable five-foot barranca description']
};
