// Traced from the supplied Hole 2 overhead (2004 × 1133).
// Posted tee yardages: Springhaven's published scorecard. Contours are provisional.
const k=550*.9144/Math.hypot(1780-205,558-560);
const tee=(id,name,yards,z)=>({id,name,yards,z:z*k,x:(1780-Math.sqrt((yards*.9144/k)**2-(558-z)**2))*k});
export const hole2={
    id:'springhaven-2',number:2,name:'The Springhaven Club - Hole 2',title:'The barranca',par:5,
    description:'A long par 5. Position your approach to carry the playable barranca and reach a two-tier green guarded by two bunkers.',
    about:'The barranca is playable, approximately 5 ft deep, with fixed patches of smooth, heavy and tight lies. Its banks and the green tiers are provisional. All holes share one engine and renderer.',
    plan:{width:2004,height:1133,metresPerUnit:k},
    bounds:{minX:125*k,maxX:1930*k,minZ:460*k,maxZ:745*k},
    airClearance:16,renderStep:.9,pathWidth:1.8,
    tees:[tee('1896','1896 (Black)',550,560),tee('rawlins','Rawlins (Blue)',540,560),
        tee('butler','Butler (Silver)',467,574),tee('dixon','Dixon (White)',458,574)],
    pins:[{id:'center',name:'Center',x:1780*k,z:558*k}],
    aimPoints:[{x:1000*k,z:618*k},{x:1510*k,z:608*k}],
    shapes:{
        tee:'M182 537L264 543L260 585L180 578Z M409 553L475 557L477 592L408 589Z',
        fairway:'M632 569Q643 548 697 554Q845 557 942 568Q1163 579 1375 568Q1537 570 1644 551L1656 564Q1659 611 1637 639Q1518 669 1372 672L1040 676Q809 674 704 643Q645 627 636 609Z',
        surround:'M1708 530Q1727 501 1767 511Q1823 516 1837 551Q1846 587 1813 613Q1768 636 1721 604L1709 576Z',
        green:'M1743 541Q1754 527 1780 529Q1806 529 1817 546Q1826 574 1805 584Q1776 594 1751 581Q1742 569 1743 541Z',
        sand:'M1742 505Q1751 494 1764 501Q1780 494 1783 507Q1789 520 1773 527L1747 534Q1737 523 1742 505Z M1727 595Q1747 585 1776 592Q1800 594 1812 606Q1814 620 1790 626L1744 652Q1728 658 1725 638Q1720 613 1727 595Z'
    },
    landforms:[{
        id:'barranca',name:'Barranca',shape:'M1683 493Q1704 485 1704 514Q1702 536 1713 553L1715 606Q1727 644 1724 662L1706 680Q1687 672 1684 649L1667 607Q1658 576 1654 554L1657 531Q1667 500 1683 493Z',
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
    scenery:{trees:[
        [325,498,9],[450,497,10],[582,495,9],[722,503,10],[863,518,11],[1027,535,11],[1193,528,10],[1351,531,9],[1450,524,9],[1572,518,10],
        [285,685,9],[432,707,10],[603,716,11],[758,704,10],[991,703,10],[1142,719,11],[1291,703,9],[1454,690,11],[1588,695,10],[1878,511,9],[1889,609,10]
    ].map(([x,z,height])=>({x:x*k,z:z*k,height})),buildings:[{x:109*k,z:676*k,width:15,height:5,depth:10}]},
    terrain:{baseRipple:.08,rippleLength:80,bunkerDepth:.65,bunkerBlend:2},
    green:{front:1740,depth:84,center:[1780,558],blend:[103,85],backToFrontRise:.25,
        tiers:{at:.68,width:.18,rise:.22},localBreaks:null},
    provisional:['Exact tee marker positions','Green tier position and breaks','Barranca bank profiles and lie patch locations','Tree positions','Bunker contours'],
    sources:['User supplied Hole 2 overhead and playable 5 ft barranca description','Springhaven published scorecard and hole guide']
};
