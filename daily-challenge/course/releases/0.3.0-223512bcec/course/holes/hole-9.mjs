import {clamp,ease,mix} from '../../core/physics.mjs';
import {geometryPath,containsPoint,sampleGeometryPath} from '../../core/geometry.mjs';

// Coordinates trace the supplied 2048 × 684 aerial markup.
const pin=[1797,380];
const k=176*.9144/Math.hypot(pin[0]-246,pin[1]-395);
const point=(x,z)=>({x:x*k,z:z*k});
const yardsToPlan=.9144/k;
const axisLength=Math.hypot(pin[0]-246,pin[1]-395);
const forwardX=(pin[0]-246)/axisLength,forwardZ=(pin[1]-395)/axisLength;
const survey=(across,forward)=>[
    pin[0]+yardsToPlan*(forward*forwardX-across*forwardZ),
    pin[1]+yardsToPlan*(forward*forwardZ+across*forwardX)
];
const tee=(id,name,yards)=>({id,name,yards,...point(...survey(0,-yards))});

// February 2025 yardage book. Center crosshair is the local origin, the dashed
// 176-tee line is the longitudinal axis, and the grid is five yards per square.
const actualFront=-217*23/429;
const playableFront=[(449-532)*5/99,actualFront];
const onGraph=(col,row)=>[(col-532)*5/99,(407-row)*23/429];
const trace=path=>path.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_,col,row)=>survey(...onGraph(Number(col),Number(row))).map(value=>value.toFixed(3)).join(' '));
const green=trace('M536 624 Q494 625 449 623 Q376 623 333 592 Q310 580 316 551 Q329 511 319 470 Q300 415 296 375 Q285 305 322 260 Q359 219 440 207 Q510 194 568 195 Q645 195 708 245 Q779 301 783 367 Q788 405 749 445 Q710 483 678 523 Q652 559 624 590 Q600 621 536 624 Z');
const leftSand=trace('M105 521 Q145 466 194 446 Q242 426 265 457 Q296 500 285 547 Q280 588 253 616 Q247 628 254 646 Q274 705 271 781 Q275 826 234 839 Q173 861 127 827 Q103 807 114 769 Q127 700 138 644 Q148 603 105 521 Z');
// The right bunker continues below the green graph. Its lower end follows the hole overview.
const rightSand=trace('M806 449 Q844 408 889 457 Q936 500 944 579 Q955 638 929 683 Q904 724 869 766 Q845 802 831 872 Q819 920 784 953 Q708 984 621 989 Q522 992 470 933 Q423 894 433 825 Q445 749 493 705 Q521 678 567 678 Q615 681 641 670 Q653 659 651 639 Q651 617 680 603 Q695 598 683 584 Q672 567 708 551 Q744 533 763 516 Q773 509 771 492 Q777 473 806 449 Z');
const collar=trace('M539 637 Q479 637 430 635 Q358 630 317 600 Q293 580 303 535 Q315 498 302 460 Q272 386 280 333 Q283 271 327 233 Q374 198 463 189 Q528 173 578 178 Q665 181 727 240 Q797 301 800 369 Q805 415 763 456 Q716 504 670 562 Q634 624 584 634 Q557 638 539 637 Z');
const mouth=trace('M273 787 Q286 736 289 675 Q300 615 344 583 L485 598 Q506 622 485 653 Q446 677 427 748 Q409 783 396 821 Q335 840 273 787 Z');
function teePad(front,back,halfWidth){
    const points=[[-halfWidth,front],[halfWidth,front],[halfWidth,back],[-halfWidth,back]];
    return points.map(([side,edge],index)=>(index?'L':'M')+survey(side,actualFront-edge).join(' ')).join(' ')+' Z';
}

// Smooth gradient fit to the arrows on the green graph. Each row contains
// across/forward position, falloff radius (yards), and fitted rise components.
// Hatch markings at the edges supply steepness; their downhill bearings are approximate.
const fittedBreaks=[
    [-3.78788, 8.36364, 3.80000, 0.00447, 0.00739],
    [-7.82828, 5.95105, 3.80000, 0.00071, -0.03909],
    [-7.62626, 2.78788, 3.80000, -0.01821, -0.01317],
    [-3.98990, 4.07459, 3.80000, 0.00338, 0.01362],
    [0.40404, 6.37995, 3.80000, 0.00791, -0.04760],
    [0.85859, 1.34033, 3.80000, 0.00856, 0.01452],
    [-3.93939, -0.96503, 3.80000, -0.00316, 0.00462],
    [-3.88889, -6.27273, 3.80000, 0.05704, -0.05728],
    [0.95960, -4.77156, 3.80000, -0.01886, 0.06271],
    [5.50505, -2.62704, 3.80000, 0.00223, -0.02931],
    [8.78788, 0.10723, 3.80000, -0.02616, -0.03195],
    [5.35354, 2.78788, 3.80000, 0.02670, 0.01478],
    [8.58586, 4.82517, 3.80000, -0.04516, -0.01611],
    [0.80808, 9.97203, 2.70000, -0.02709, -0.09385],
    [5.55556, 7.18415, 3.00000, 0.00504, 0.06445],
    [-8.58586, -3.75291, 2.80000, 0.11485, -0.04131],
    [4.14141, -8.68531, 2.80000, -0.06503, 0.05762],
];
function contour(across,forward){
    let height=-.002026*across+.033232*forward;
    for(const [x,z,width,riseAcross,riseForward] of fittedBreaks){
        const dx=across-x,dz=forward-z;
        height+=(riseAcross*dx+riseForward*dz)*Math.exp(-(dx*dx+dz*dz)/(2*width*width));
    }
    return height;
}

const greenOutline=geometryPath(green);
const greenEdge=sampleGeometryPath(greenOutline[0],65);
function distanceFromGreen(x,z){
    if(containsPoint(greenOutline,x,z))return 0;
    let closest=Infinity;
    for(let i=1;i<greenEdge.length;i++){
        const a=greenEdge[i-1],b=greenEdge[i],dx=b.x-a.x,dz=b.z-a.z;
        const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
        closest=Math.min(closest,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));
    }
    return closest/yardsToPlan;
}

const greenHeight=2.05;
const centerContour=contour(0,0);
const frontHeight=greenHeight+contour(0,actualFront)-centerContour;
const teeHeight=frontHeight-1;

function greenComplex(x,z){
    const dx=(x-pin[0])/yardsToPlan,dz=(z-pin[1])/yardsToPlan;
    const across=forwardX*dz-forwardZ*dx,forward=forwardX*dx+forwardZ*dz;
    const teeGrade=teeHeight*ease((-forward-62)/60);
    if(Math.abs(across)>30||Math.abs(forward)>41)return teeGrade*.9144;
    const distance=distanceFromGreen(x,z);
    const entranceCenter=playableFront[0]-4*ease((actualFront-forward)/11);
    const entrance=Math.exp(-(((across-entranceCenter)/3.8)**4))*ease((actualFront+3-forward)/3);
    const skirt=6+8*entrance;
    const lowGround=.08*ease((25-distance)/6);
    const platform=greenHeight+contour(across,forward)-centerContour;
    // Continue the grass bank down to the surrounding ground, with a gentler
    // transition on the approach through the gap between the two bunkers.
    const blend=1-ease((distance-.18)/skirt);
    return (teeGrade+mix(lowGround,platform,blend))*.9144;
}

export const hole9={
    id:'springhaven-9',number:9,name:'The Springhaven Club - Hole 9',
    title:'The elevated green',par:3,
    description:'A raised par 3 with a narrow run-up between two bunkers. The putting surface falls toward several edges, with a steep front-right shoulder.',
    about:'Green outline, tee distances and slope readings follow the February 2025 yardage book. The green surface is fitted between the printed readings. Bunker floor depths and surrounding grades are estimated.',
    plan:{width:2048,height:684,metresPerUnit:k},
    bounds:{minX:0,maxX:2048*k,minZ:0,maxZ:684*k},
    airClearance:18,renderStep:.45,pathWidth:1.8,
    tees:[
        tee('1896','1896 (Black)',176),tee('rawlins','Rawlins (Blue)',156),
        tee('butler','Butler (Silver)',145),tee('dixon','Dixon (White)',130)
    ],
    pins:[{id:'center',name:'Center',...point(...pin)}],
    shapes:{
        tee:[teePad(156,169,3.7),teePad(114,152,3.7)].join(' '),
        fairway:'M1338 377Q1358 311 1385 291Q1427 259 1508 252Q1558 249 1583 271Q1618 297 1658 279Q1681 265 1708 283Q1742 303 1788 294L1730 350Q1713 362 1681 361Q1663 356 1630 341Q1595 332 1579 343Q1552 358 1544 378Q1536 404 1517 431Q1506 446 1467 462Q1430 483 1392 465Q1344 446 1338 394Z',
        surround:[collar,mouth].join(' '),
        green,
        sand:[rightSand,leftSand].join(' ')
    },
    paths:[
        'M1784 0Q1744 14 1689 18Q1528 40 1420 130Q1318 212 1208 259Q1121 295 1018 300Q828 327 691 329L545 329Q497 253 470 267Q428 274 442 308Q455 342 534 329',
        'M804 327Q858 354 904 400Q983 474 1098 525L1191 568Q1249 593 1330 603Q1410 615 1485 684'
    ],
    scenery:{trees:[
        [98,217,10],[396,207,12],[721,254,9],[867,158,11],[1009,155,12],[1202,107,13],
        [1453,162,12],[1843,77,10],[101,538,12],[472,503,11],[1293,570,10]
    ].map(([x,z,height])=>({...point(x,z),height}))},
    terrain:{baseRipple:0,rippleLength:65,bunkerDepth:.12,bunkerBlend:1.45,elevation:greenComplex},
    survey:{depthYards:23,actualFront:point(...survey(0,actualFront)),
        playableFront:point(...survey(...playableFront))},
    green:{front:survey(0,actualFront)[0],depth:23*yardsToPlan,center:pin,blend:[136,118],backToFrontRise:0}
};
