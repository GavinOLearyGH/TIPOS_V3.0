// Plan coordinates are traced from the supplied marked overhead.
// All engine coordinates and elevations are metres.
export const metresPerPlanUnit=419*.9144/Math.hypot(1495-195,503-492);
const k=metresPerPlanUnit;
const tee=(id,name,yards,z)=>({id,name,yards,z:z*k,
    x:(1495-Math.sqrt((yards*.9144/k)**2-(503-z)**2))*k});
export const hole1={
    id:'springhaven-1',number:1,bearing:0,name:'The Springhaven Club - Hole 1',title:'The opening hole',par:4,
    description:'A long fairway, a bunker on the left and church pews on the right. Finish on a green that slopes back to front.',
    plan:{width:1696,height:983,metresPerUnit:k},
    bounds:{minX:120*k,maxX:1630*k,minZ:350*k,maxZ:670*k},
    airClearance:16,renderStep:.8,pathWidth:1.8,
    scenery:{
        trees:[
            [335,585,9],[440,578,10],[545,590,9],[650,610,11],[887,593,10],[1040,605,10],[1180,613,11],[1330,625,9],[1565,593,9],
            [450,358,9],[585,363,8],[715,365,10],[830,370,9],[945,373,9],[1080,390,11],[1210,390,10],[1360,390,11],[1545,394,9],[1610,470,11],[1605,570,10]
        ].map(([x,z,height])=>({x:x*k,z:z*k,height})),
        buildings:[{x:218*k,z:413*k,width:31,height:7,depth:17}]
    },
    boundaryStakes:Array.from({length:22},(_,i)=>({x:(315+i*60)*k,z:(350+Math.max(0,i-7)*2.4)*k})),
    tees:[
        tee('1896','1896 (Black)',419,492),
        tee('rawlins','Rawlins (Blue)',401,490),
        tee('butler','Butler (Silver)',353,470),
        tee('dixon','Dixon (White)',349,466)
    ],
    pins:[{id:'center',name:'Center',x:1495*k,z:503*k}],
    shapes:{
        tee:'M166 478L264 472L266 505L170 509Z M374 459L416 453L423 475L376 481Z',
        fairway:'M488 428Q514 382 598 371Q733 355 899 380L955 384Q1087 403 1200 420L1445 462L1460 482L1456 530L1433 550Q1320 541 1166 526Q1052 522 930 507Q809 493 677 495L551 490Q503 491 496 471Z',
        surround:'M1420 466Q1440 455 1473 458Q1532 445 1559 477Q1576 515 1539 543Q1497 556 1451 538L1425 529Z',
        green:'M1457 480Q1469 465 1506 466Q1535 470 1543 494Q1545 519 1520 537Q1484 544 1461 529Q1450 510 1457 480Z',
        sand:'M973 384Q986 380 998 372Q1012 366 1015 385L1015 402Q1038 416 1021 428Q1010 437 997 418L980 407Q958 397 973 384Z M1456 432Q1468 422 1482 429Q1504 423 1509 441Q1510 457 1490 461L1464 463Q1444 459 1456 432Z M1438 548Q1451 536 1468 543Q1479 550 1490 544Q1516 539 1521 555Q1523 573 1505 577Q1483 569 1475 582Q1456 588 1449 569Q1430 560 1438 548Z'
    },
    paths:[
        'M310 414L299 507Q291 534 251 540Q205 546 204 518',
        'M298 522Q602 513 921 546Q1114 563 1376 570L1459 632',
        'M159 653Q458 623 698 603Q995 582 1223 621L1459 632L1604 626'
    ],
    outOfBounds:'M294 350Q514 349 638 361Q949 364 1204 385L1612 387',
    pews:{count:7,x:727,z:558,spacing:18,length:48,width:6,height:1.15},
    terrain:{baseRipple:.08,rippleLength:65,bunkerDepth:.6,bunkerBlend:1.8},
    green:{front:1448,depth:96,center:[1495,503],blend:[95,82],backToFrontRise:.4,localBreaks:null},
    provisional:['Terrain elevations','Bunker depth and lips','Exact OB boundary','Green contours','Tee marker positions within pads'],
    sources:['User supplied overhead and markup','Confirmed tee names and yardages','Springhaven club hole guide']
};
