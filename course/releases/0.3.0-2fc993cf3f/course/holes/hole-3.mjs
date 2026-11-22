// Approximate clockwise bearing relative to Hole 1, traced from the supplied course-wide satellite photo.
// Traced from the supplied Hole 3 overhead. All engine coordinates are metres.
// Posted tees: Springhaven's published 193/151/137/117-yard par three.
const k=193*.9144/Math.hypot(1790-250,563-612);
const tee=(id,name,yards)=>({id,name,yards,z:612*k,
    x:(1790-Math.sqrt((yards*.9144/k)**2-(563-612)**2))*k});
export const hole3={
    id:'springhaven-3',number:3,bearing:157,name:'The Springhaven Club - Hole 3',title:'The protected green',par:3,
    description:'A compact par 3 with a short-mown landing area, a narrow collar and three bunkers protecting the green.',
    about:'Tee yardages follow the published scorecard. The approach, collar, green and three bunkers follow the supplied markup. Green breaks, bunker depths and terrain elevations are provisional. All holes share one engine and renderer.',
    plan:{width:2048,height:1163,metresPerUnit:k},
    bounds:{minX:125*k,maxX:2045*k,minZ:350*k,maxZ:975*k},
    airClearance:16,renderStep:.6,pathWidth:1.8,
    tees:[tee('1896','1896 (Black)',193),tee('rawlins','Rawlins (Blue)',151),
        tee('butler','Butler (Silver)',137),tee('dixon','Dixon (White)',117)],
    pins:[{id:'center',name:'Center',x:1790*k,z:563*k}],
    shapes:{
        tee:'M202 591L310 588L307 636L201 633Z M534 568L879 548L891 626L539 648Z',
        fairway:'M1422 550Q1420 520 1460 497Q1510 475 1572 490L1648 508L1675 543L1675 604L1640 658Q1618 693 1558 686L1491 678Q1454 669 1441 640Z',
        surround:'M1638 519Q1692 477 1765 463Q1848 458 1899 491Q1931 521 1920 584L1906 639Q1888 672 1846 669Q1814 660 1785 642Q1756 622 1725 630L1694 639Q1644 634 1638 592Q1627 548 1638 519Z',
        green:'M1670 518Q1710 486 1770 476Q1857 470 1891 502Q1918 531 1906 581L1892 630Q1882 655 1850 655Q1816 652 1790 633Q1755 610 1724 617L1696 625Q1657 619 1654 584Q1645 546 1670 518Z',
        sand:'M1632 447Q1645 433 1681 439Q1700 410 1731 412Q1787 408 1804 438Q1824 464 1792 470Q1768 479 1742 468L1716 473Q1691 455 1697 485Q1703 501 1675 513Q1653 526 1638 515Q1619 486 1632 447Z M1836 409Q1845 391 1869 401Q1910 411 1928 443Q1949 464 1945 488Q1945 514 1925 511Q1911 510 1907 486Q1881 469 1861 471Q1836 469 1836 448Z M1674 636Q1693 614 1723 626Q1737 640 1742 658Q1755 638 1766 642Q1785 647 1808 657Q1854 655 1854 682Q1860 704 1836 720Q1810 725 1805 754Q1793 780 1807 802Q1812 825 1786 844Q1738 875 1714 909Q1698 927 1681 911Q1664 894 1674 869L1722 772Q1740 739 1717 737Q1691 736 1662 723Q1625 709 1635 687Q1645 654 1674 636Z'
    },
    paths:['M205 862Q430 831 461 668L464 551Q463 479 520 488Q765 527 1110 453Q1473 390 1674 340L2040 282'],
    scenery:{trees:[
        [174,420,9],[719,445,9],[1000,415,10],[1195,390,11],[1300,370,10],[1580,354,10],[2000,640,10],
        [160,865,10],[438,838,9],[1010,744,10],[1230,760,10],[1470,943,9],[1980,871,10]
    ].map(([x,z,height])=>({x:x*k,z:z*k,height})),buildings:[{x:348*k,z:690*k,width:10,height:4,depth:12}]},
    terrain:{baseRipple:.03,rippleLength:90,bunkerDepth:.75,bunkerBlend:1.5},
    green:{front:1648,depth:270,center:[1790,563],blend:[260,190],backToFrontRise:.18,localBreaks:null},
    provisional:['Exact tee marker positions within pads','Green breaks','Bunker depths and lips','Terrain elevations','Tree positions'],
    sources:['User supplied Hole 3 overhead and markup','Springhaven published scorecard and hole guide']
};
