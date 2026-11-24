import {ease} from '../../core/physics.mjs';

// Coordinates are traced from the supplied 2048 × 655 aerial markup.
const k=.224;
const point=(x,z)=>({x:x*k,z:z*k});
const tee=(id,name,yards,x,z)=>({id,name,yards,...point(x,z)});
const greenCenter=[1808,189];
const fairwayRise=25*.3048;
const approachStart=1220;
const approachRise=2.5*.9144;

export const hole5={
    id:'springhaven-5',number:5,name:'The Springhaven Club - Hole 5',
    title:'The uphill dogleg',par:4,
    description:'Climb to a dogleg left. Take the open line toward the outside of the bend or carry the inside trees for a shorter approach.',
    about:'The tee pads, fairway, bunkers and key trees follow the supplied markup. Tree heights, intermediate elevations and green breaks are provisional.',
    plan:{width:2048,height:655,metresPerUnit:k},
    bounds:{minX:110*k,maxX:2044*k,minZ:0,maxZ:650*k},
    airClearance:20,renderStep:.75,pathWidth:1.8,
    tees:[
        tee('1896','1896 (Black)',395,281,221),
        tee('rawlins','Rawlins (Blue)',368,389,242),
        tee('butler','Butler (Silver)',285,630,438),
        tee('dixon','Dixon (White)',228,863,448)
    ],
    pins:[{id:'center',name:'Center',...point(...greenCenter)}],
    aimPoints:[point(approachStart,437)],
    shapes:{
        tee:[
            'M265 198L310 209L305 243L257 233Z',
            'M326 211L469 239L461 278L318 250Z',
            'M605 425L653 419L656 456L611 458Z',
            'M837 434L885 423L883 462L842 473Z'
        ].join(' '),
        fairway:'M770 328Q772 305 791 287Q815 269 850 281Q930 313 1011 336Q1080 358 1121 359Q1142 369 1177 367Q1227 368 1258 354Q1328 335 1364 310Q1408 276 1443 271Q1464 278 1485 285Q1520 292 1534 268Q1543 254 1545 224Q1549 206 1570 197Q1624 183 1672 175Q1694 189 1710 184Q1726 181 1745 173L1745 211L1869 221Q1882 232 1860 272Q1851 257 1832 251Q1804 244 1794 264Q1778 286 1764 283Q1736 277 1711 276Q1679 280 1656 260Q1629 261 1602 287Q1581 308 1557 326Q1539 339 1513 347Q1494 359 1475 386Q1451 421 1416 446Q1370 484 1338 510Q1310 531 1266 548Q1229 560 1179 548Q1102 537 1056 505Q1000 464 941 441Q900 422 870 412Q824 391 790 361Q775 346 770 328Z',
        surround:'M1706 181Q1749 137 1793 141Q1847 142 1870 160Q1890 179 1883 216Q1884 240 1862 256Q1830 231 1796 236Q1758 244 1736 227Q1720 208 1706 181Z',
        green:'M1742 195Q1741 171 1754 157Q1769 147 1806 151Q1847 153 1866 169Q1881 181 1879 215L1872 244Q1852 236 1829 230Q1810 224 1784 228Q1755 230 1743 218Z',
        sand:[
            'M1438 244Q1440 235 1453 229Q1463 205 1480 196Q1499 186 1504 200Q1508 211 1502 218Q1492 231 1511 233Q1526 239 1531 261Q1518 271 1495 264Q1480 270 1463 257Q1439 259 1438 244Z',
            'M1595 305Q1600 286 1624 269Q1639 262 1656 258Q1666 266 1660 285Q1656 301 1649 307Q1667 304 1664 320Q1660 340 1639 342Q1624 342 1612 329Q1607 315 1595 305Z',
            'M1705 169Q1704 161 1715 151Q1707 136 1724 125Q1736 120 1742 108Q1752 99 1764 105Q1776 95 1791 103Q1800 98 1811 107Q1831 109 1836 122Q1843 143 1828 148Q1814 153 1799 145Q1783 137 1765 141Q1752 144 1741 158Q1723 178 1705 178Z',
            'M1790 276Q1792 257 1805 251Q1823 242 1840 254Q1855 263 1845 272Q1842 279 1832 282Q1836 294 1828 296Q1824 315 1813 313Q1802 311 1800 292Q1801 286 1790 284Z',
            'M1875 148Q1884 138 1892 142Q1901 149 1901 165Q1903 171 1909 174Q1913 180 1907 192Q1913 203 1915 211Q1908 220 1903 232Q1904 258 1897 269Q1887 280 1880 268Q1874 258 1880 241Q1888 220 1884 201Q1880 179 1875 164Z'
        ].join(' ')
    },
    paths:[
        'M422 111Q406 130 374 139Q348 147 357 170Q368 190 425 211Q475 229 528 242Q581 251 624 332Q657 392 688 430Q710 457 728 469Q771 492 819 499Q870 502 918 504Q998 508 1046 550Q1114 627 1188 637Q1221 648 1254 633Q1318 598 1354 574Q1439 546 1493 473Q1514 445 1552 427Q1603 400 1629 380Q1682 327 1708 356Q1735 384 1666 414L1450 632',
        'M2045 263Q2001 300 1965 337Q1927 379 1872 430L1632 650'
    ],
    scenery:{trees:[
        [736,212,11],[917,248,12],[1018,314,10],[1182,216,9],[1189,288,12],
        [1385,241,9],[932,541,12],[1340,556,12],[1516,433,10],[1667,406,8],
        [1809,369,8],[1674,88,8],[1756,33,11],[1913,74,9],
        [1989,132,10],[1998,247,12],[1945,347,10],
        [177,178,12],[212,278,12],[282,336,11],[369,341,13],[466,389,12],
        [514,441,11],[579,504,12],[694,548,11],[800,565,11],[1045,626,12]
    ].map(([x,z,height])=>({...point(x,z),height}))},
    terrain:{
        baseRipple:.07,rippleLength:50,bunkerDepth:.77,bunkerBlend:1.65,
        elevation(x,z){
            // The forward pads join the rise farther up the slope.
            const frontSide=ease((z-276)/142);
            const riseStart=463-28*frontSide;
            const riseEnd=805+29*frontSide;
            // The back tees sit below the surrounding holes. The first
            // fairway section comes back up to the shared course grade.
            const uphill=-fairwayRise*(1-ease((x-riseStart)/(riseEnd-riseStart)));
            const backTeeDrop=2*.3048*(1-ease((x-410)/185))*(1-ease((z-260)/120));
            const approach=approachRise*ease((x-approachStart)/(greenCenter[0]-approachStart));
            const backPad=2*.3048*ease((x-195)/55)*(1-ease((x-310)/14))*
                ease((z-155)/40)*(1-ease((z-245)/45));
            // The high edge sits outside the bunker, with a longer fall away from the green.
            const ridgeLine=84-.18*(x-1760);
            const greensideRidge=2*.3048*ease((x-1680)/55)*(1-ease((x-1815)/55))*
                ease((z-ridgeLine+66)/66)*(1-ease((z-ridgeLine)/15));
            return uphill-backTeeDrop+approach+backPad+greensideRidge;
        }
    },
    green:{
        front:1742,depth:137,center:greenCenter,blend:[100,77],backToFrontRise:-.09,
        contour(x,z){
            return .055*Math.sin((x-1742)/32)*Math.sin((z-175)/26);
        }
    }
};
