import {ease,mix} from '../../core/physics.mjs';

// Coordinates trace the supplied 2048 × 684 aerial markup.
const pin=[1797,380];
const k=176*.9144/Math.hypot(pin[0]-246,pin[1]-395);
const point=(x,z)=>({x:x*k,z:z*k});
const tee=(id,name,yards)=>({id,name,yards,...point(pin[0]-Math.sqrt((yards*.9144/k)**2-(395-pin[1])**2),395)});

function greenComplex(x,z){
    const radius=Math.hypot((x-1795)/128,(z-382)/117);
    // The lower terrace carries both bunker floors. The upper bank forms the faces toward the green.
    const base=.27*ease((2.40-radius)/.85);
    const bank=2.4732*ease((1.51-radius)/.51);
    const mound=base+bank;

    // The short-grass run-up joins the green mound and fades into it at the mouth.
    const runUp=2.7432*ease((x-1390)/315)*(1-ease((x-1705)/55));
    const mouthZ=350-43*Math.exp(-(((x-1575)/100)**2));
    const alongMouth=Math.exp(-(((z-mouthZ)/45)**4));
    // The tees sit above a shallow fairway valley that meets the bunker entry.
    const teeGrade=.98*(1-ease((x-690)/660));
    const approach=mound+Math.max(0,runUp-mound)*alongMouth;
    // Blend the right side of the landing area into the nearly level bunker entry.
    const landingGrade=.035+.00075*(x-1390);
    const landingBlend=ease((x-1350)/70)*(1-ease((x-1522)/52))
        *ease((z-365)/30)*(1-ease((z-451)/24));
    // Keep the upper face pitched into the large bunker as it curves around the green.
    const faceX=1638+1.10*Math.max(0,z-415);
    const faceBlend=ease((z-365)/21)*(1-ease((z-483)/28));
    const frontBunkerFace=-.58*faceBlend*Math.exp(-(((x-faceX)/30)**2));
    return teeGrade+mix(approach,landingGrade,landingBlend)+frontBunkerFace;
}

function greenContour(x,z){
    const ridge=1833+4*ease((z-310)/44)-11*ease((z-402)/59);
    const frontDistance=Math.max(0,ridge-x);
    const frontFall=-.022*k*(frontDistance<8?frontDistance**2/16:frontDistance-4);
    const feedsMouth=-.10*Math.exp(-(((x-1704)/32)**2+((z-374)/25)**2));

    // Leave a level shelf past the crest, then taper near the curved rear edge.
    const rearEdge=1896-.0031*(z-380)**2;
    const taperStart=Math.max(ridge+12,rearEdge-15);
    const rearTaper=-.16*ease((x-taperStart)/46);
    return frontFall-.009*k*(z-380)+feedsMouth+rearTaper;
}

export const hole9={
    id:'springhaven-9',number:9,name:'The Springhaven Club - Hole 9',
    title:'The elevated green',par:3,
    description:'A raised par 3 with a narrow run-up between two bunkers. A ridge near the back feeds the front portion toward the entrance.',
    about:'The small green is about nine feet above the short landing area. Bunker depths, tee marker placements and contour grades are provisional.',
    plan:{width:2048,height:684,metresPerUnit:k},
    bounds:{minX:0,maxX:2048*k,minZ:0,maxZ:684*k},
    airClearance:18,renderStep:.45,pathWidth:1.8,
    tees:[
        tee('1896','1896 (Black)',176),tee('rawlins','Rawlins (Blue)',156),
        tee('butler','Butler (Silver)',145),tee('dixon','Dixon (White)',130)
    ],
    pins:[{id:'center',name:'Center',...point(...pin)}],
    shapes:{
        tee:'M190 356L303 350Q314 397 307 438L190 439Q195 402 190 356Z M341 355Q501 357 678 351Q686 386 678 416L343 426Z',
        fairway:'M1338 377Q1358 311 1385 291Q1427 259 1508 252Q1558 249 1583 271Q1618 297 1658 279Q1681 265 1708 283Q1742 303 1788 294L1730 350Q1713 362 1681 361Q1663 356 1630 341Q1595 332 1579 343Q1552 358 1544 378Q1536 404 1517 431Q1506 446 1467 462Q1430 483 1392 465Q1344 446 1338 394Z',
        surround:[
            'M1668 321Q1672 303 1710 298Q1768 299 1804 274Q1827 265 1850 278Q1884 283 1897 320Q1913 366 1908 412Q1904 473 1865 490Q1815 511 1779 494Q1733 479 1701 433Q1682 407 1680 368Q1666 349 1668 321Z',
            'M1626 343Q1662 347 1675 370Q1687 394 1684 417Q1707 445 1725 458Q1748 480 1771 492Q1788 508 1785 533Q1761 508 1736 497Q1708 475 1688 447Q1666 431 1650 419Q1657 394 1643 376Q1640 354 1626 343Z',
            'M1607 267Q1628 279 1651 272Q1679 260 1694 259Q1713 260 1724 267Q1750 274 1767 268Q1784 259 1787 248Q1789 269 1767 279Q1747 289 1722 281Q1705 272 1693 270Q1675 274 1650 282Q1622 292 1607 267Z'
        ].join(' '),
        green:'M1684 334Q1681 307 1713 306Q1767 309 1808 285Q1835 277 1860 292Q1883 304 1890 338Q1900 374 1893 418Q1886 465 1860 477Q1828 492 1801 482Q1763 467 1734 439Q1704 411 1699 376Q1684 356 1684 334Z',
        // The sand stops low on the green-facing banks, leaving the upper slopes grassed.
        sand:[
            'M1546 391Q1547 367 1567 353Q1600 332 1626 343Q1650 354 1659 375Q1669 396 1667 423Q1694 450 1711 466Q1736 490 1758 502Q1779 518 1782 534Q1779 560 1738 571Q1716 581 1690 566Q1661 556 1640 533Q1613 518 1590 508Q1558 493 1552 458Q1541 429 1546 391Z',
            'M1592 246Q1595 222 1618 213Q1634 207 1652 217Q1680 227 1704 214Q1727 196 1753 205Q1779 209 1786 235Q1791 254 1766 264Q1750 272 1725 265Q1704 257 1694 255Q1674 258 1650 269Q1622 279 1607 269Q1591 260 1592 246Z'
        ].join(' ')
    },
    paths:[
        'M1784 0Q1744 14 1689 18Q1528 40 1420 130Q1318 212 1208 259Q1121 295 1018 300Q828 327 691 329L545 329Q497 253 470 267Q428 274 442 308Q455 342 534 329',
        'M804 327Q858 354 904 400Q983 474 1098 525L1191 568Q1249 593 1330 603Q1410 615 1485 684'
    ],
    scenery:{trees:[
        [98,217,10],[396,207,12],[721,254,9],[867,158,11],[1009,155,12],[1202,107,13],
        [1453,162,12],[1843,77,10],[101,538,12],[472,503,11],[1293,570,10]
    ].map(([x,z,height])=>({...point(x,z),height}))},
    terrain:{baseRipple:.025,rippleLength:65,bunkerDepth:.12,bunkerBlend:1.45,elevation:greenComplex},
    green:{front:1680,depth:218,center:pin,blend:[136,118],backToFrontRise:0,contour:greenContour}
};
