import {ease} from '../../core/physics.mjs';

// Keep the existing engine scale and register the new overhead to the back tee
// and center of the green. Distances in the yardage book are in yards.
export const metresPerPlanUnit=419*.9144/Math.hypot(1495-195,503-492);
const k=metresPerPlanUnit,yardsToPlan=.9144/k;
const plan=(across,forward)=>[1495+forward*yardsToPlan,503+across*yardsToPlan];
const point=(across,forward)=>{const [x,z]=plan(across,forward);return {x:x*k,z:z*k};};
const aerialScale=419/Math.hypot(1710-228,558-545);
const aerial=(x,y)=>plan((y-558)*aerialScale,(x-1710)*aerialScale);
const graph=(col,row)=>plan((col-510)*5/102,(533-row)*26/489);
const trace=(path,transform)=>path.replace(/(\d+) (\d+)/g,
    (_,x,y)=>transform(Number(x),Number(y)).map(value=>value.toFixed(3)).join(' '));
const tee=(id,name,yards,across)=>({id,name,yards,...point(across,-Math.sqrt(yards*yards-across*across))});

const fairway=trace('M524 481 Q530 445 575 428 Q640 399 721 389 Q807 374 890 377 Q983 378 1055 395 Q1093 406 1110 419 Q1138 431 1170 428 Q1239 426 1320 436 Q1451 448 1555 470 Q1626 481 1675 498 Q1693 506 1690 527 L1690 571 Q1675 601 1633 598 Q1522 599 1427 592 Q1331 589 1228 581 Q1142 574 1042 562 Q946 551 857 548 Q766 541 675 543 Q612 542 559 528 Q530 517 524 495 Z',aerial);
const fairwaySand=trace('M1105 433 Q1103 424 1114 419 Q1122 416 1133 417 Q1140 408 1148 411 Q1156 414 1155 431 Q1156 438 1163 448 Q1170 461 1156 466 Q1142 469 1132 456 Q1124 448 1113 445 Q1106 442 1105 433 Z',aerial);
const green=trace('M509 791 Q392 791 330 729 Q282 669 264 524 Q249 468 276 427 Q314 361 415 321 Q466 303 489 303 Q584 309 683 367 Q751 409 767 470 Q792 570 774 657 Q758 749 670 775 Q599 799 509 791 Z',graph);
const collar=trace('M510 817 Q365 815 308 751 Q252 684 241 531 Q222 465 259 415 Q306 342 410 305 Q461 286 490 287 Q582 291 695 351 Q774 396 786 467 Q817 567 797 664 Q779 771 675 801 Q605 825 510 817 Z',graph);
const greenSand=trace('M85 613 Q109 560 149 555 Q191 554 220 584 Q251 613 243 654 Q243 699 257 743 Q283 812 242 822 Q205 834 142 821 Q101 812 75 802 Q93 766 105 728 Q110 699 90 672 Q62 645 85 613 Z M822 405 Q854 375 901 392 Q954 403 980 454 Q1004 497 995 567 Q991 604 1019 618 Q1042 634 1044 651 Q1048 665 1027 682 Q1000 713 988 737 Q969 752 966 766 Q977 795 948 839 Q929 869 904 854 Q866 835 828 776 Q799 727 813 686 Q824 658 852 638 Q869 626 851 620 Q826 594 811 552 Q798 514 803 481 Q798 433 822 405 Z',graph);

// Aerial tree centers, grouped to match the book's lane side, right rough and
// backdrop. The connected map filters overlaps with adjacent corridors.
const trees=[
    [573,396,9],[625,397,9],[723,367,8],[991,363,9],[1049,371,10],
    [1271,409,9],[1486,423,10],[1636,437,9],[1671,440,10],[1761,446,10],
    [1855,480,11],[1878,513,10],[1883,556,11],[1881,597,10],[1864,638,10],
    [1771,688,10],[1726,692,9],[1446,660,10],[1316,650,9],[1281,611,9],
    [1231,646,10],[1061,643,10],[766,598,9],[725,646,10],
    [610,619,9],[481,634,9],[284,638,9]
].map(([x,y,height])=>{const [px,pz]=aerial(x,y);return {x:px*k,z:pz*k,height};});
const route=[[540,485],[662,475],[810,466],[970,487],[1123,489],[1320,516],[1510,539],[1640,551]]
    .map(([x,y])=>{const [px,pz]=aerial(x,y);return {x:px*k,z:pz*k};});

// Smooth local gradient fit to the printed slope arrows, in yards from the
// green's crosshair. Both rolling physics and Green View sample this surface.
const breaks=[
    [-3.87255, 8.34765, 0.01019, -0.00526],
    [0.68627, 7.86912, 0.01375, 0.01879],
    [4.55882, 7.28425, 0.01207, 0.00718],
    [-6.42157, 5.84867, -0.01105, -0.00764],
    [-3.87255, 3.61554, 0.01872, -0.00729],
    [6.07843, 3.24335, 0.00167, -0.00001],
    [-7.84314, 1.64826, -0.01429, 0.00220],
    [0.88235, 1.64826, 0.01119, 0.01855],
    [8.97059, 1.70143, 0.02464, 0.02900],
    [-3.82353, -1.38241, -0.00648, 0.00357],
    [-7.05882, -3.50920, -0.01096, -0.00218],
    [0.73529, -3.40286, -0.00876, 0.02042],
    [6.07843, -1.96728, -0.00600, 0.02802],
    [8.97059, -3.08384, 0.00918, 0.02699],
    [-4.01961, -7.01840, -0.02154, 0.00194],
    [0.88235, -8.45399, -0.00183, 0.01984],
    [6.17647, -7.49693, 0.00855, 0.02925],
];
function greenContour(x,z){
    const across=(z-503)/yardsToPlan,forward=(x-1495)/yardsToPlan;
    const edge=1-ease((Math.max(Math.abs(across),Math.abs(forward))-16)/12);
    if(!edge)return 0;
    let height=.68+.023*forward+.004*across;
    for(const [side,along,riseAcross,riseForward] of breaks){
        const dx=across-side,dz=forward-along;
        height+=(riseAcross*dx+riseForward*dz)*Math.exp(-(dx*dx+dz*dz)/21.125);
    }
    return height*edge*.9144;
}

function fairwayGrade(x){
    const forward=(x-1495)/yardsToPlan;
    return .9144*(-.32+.28*ease((forward+390)/140)+.11*ease((forward+210)/140));
}
export const hole1={
    id:'springhaven-1',number:1,bearing:0,name:'The Springhaven Club - Hole 1',title:'The opening hole',par:4,
    description:'A long fairway, a bunker on the left and church pews on the right. Finish on a green that slopes back to front.',
    plan:{width:1696,height:983,metresPerUnit:k},
    bounds:{minX:120*k,maxX:1630*k,minZ:350*k,maxZ:670*k},
    airClearance:16,renderStep:.8,pathWidth:1.8,
    scenery:{trees,buildings:[{x:218*k,z:413*k,width:31,height:7,depth:17}]},
    boundaryStakes:Array.from({length:22},(_,i)=>({x:(315+i*60)*k,z:(350+Math.max(0,i-7)*2.4)*k})),
    tees:[
        tee('1896','1896 (Black)',419,-3.65),
        tee('rawlins','Rawlins (Blue)',401,-4),
        tee('butler','Butler (Silver)',353,-12),
        tee('dixon','Dixon (White)',349,-12)
    ],
    pins:[{id:'center',name:'Center',x:1495*k,z:503*k}],
    aimPoints:[route[3],route[5]],
    flyoverPoints:route,
    shapes:{
        tee:trace('M174 526 L298 523 L297 559 L176 565 Z M416 503 L495 497 L496 524 L418 534 Z',aerial),
        fairway,green,surround:collar,sand:fairwaySand+' '+greenSand
    },
    paths:[
        'M310 414L299 507Q291 534 251 540Q205 546 204 518',
        'M298 522Q602 513 921 546Q1114 563 1376 570L1459 632',
        'M159 653Q458 623 698 603Q995 582 1223 621L1459 632L1604 626'
    ],
    outOfBounds:'M294 350Q514 349 638 361Q949 364 1204 385L1612 387',
    pews:{count:7,x:727,z:558,spacing:18,length:48,width:6,height:1.15},
    terrain:{baseRipple:.018,rippleLength:65,elevation:fairwayGrade,bunkerDepth:.6,bunkerBlend:1.8},
    green:{front:1495-26*259/489*yardsToPlan,depth:26*yardsToPlan,center:[1495,503],
        blend:[104,96],backToFrontRise:0,contour:greenContour},
    about:'The fairway and trees follow the overhead and yardage book. The 26-yard green uses a surface fitted to the printed slope arrows. Bunker depths, fairway grades and the ground between slope readings are estimated.',
    provisional:['Fairway elevations between survey references','Bunker depth and lips','Exact OB boundary','Tee marker positions within pads'],
    sources:['February 2025 Springhaven yardage book','User supplied Hole 1 overhead','Springhaven club hole guide']
};
