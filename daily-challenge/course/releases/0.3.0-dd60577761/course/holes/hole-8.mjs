import {hole1} from './hole-1.mjs';
import {hole2} from './hole-2.mjs';

// Coordinates trace the supplied 2048 × 643 aerial markup.
const pin=[1853,231];
const k=550*.9144/(pin[0]-82);
const point=(x,z)=>({x:x*k,z:z*k});
const tee=(id,name,yards,x,z)=>({id,name,yards,...point(x,z)});
const [barranca]=hole2.landforms;

export const hole8={
    id:'springhaven-8',number:8,bearing:177,name:'The Springhaven Club - Hole 8',
    title:'Between the fairways',par:5,
    description:'Keep the drive between the left trees and the Church Pews. The approach bends left toward a green that falls to the front left, with the barranca beyond the left bunker.',
    about:'The shared Church Pews and barranca are playable. Tee marker locations, bunker depths and green grades are provisional pending the office maps.',
    plan:{width:2048,height:643,metresPerUnit:k},
    bounds:{minX:0,maxX:2048*k,minZ:0,maxZ:643*k},
    airClearance:20,renderStep:.8,pathWidth:1.8,
    tees:[
        tee('1896','1896 (Black)',550,82,201),
        tee('rawlins','Rawlins (Blue)',536,127,201),
        tee('butler','Butler (Silver)',498,249,226),
        tee('dixon','Dixon (White)',491,271,230)
    ],
    pins:[{id:'center',name:'Center',...point(...pin)}],
    aimPoints:[point(945,333),point(1535,339)],
    shapes:{
        tee:'M47 204Q50 181 82 179L132 181L145 216Q119 227 79 224Q46 222 47 204Z M224 208L278 216L278 250L221 242Z',
        fairway:[
            'M491 296Q483 273 500 250Q524 234 571 241Q624 248 664 246Q681 247 702 260Q758 273 816 275Q876 281 946 289Q994 295 1058 299Q1134 312 1189 317Q1294 324 1360 320Q1464 320 1584 285Q1650 266 1698 244Q1729 231 1778 227L1815 267Q1784 303 1751 319Q1706 337 1668 345Q1640 355 1622 365Q1588 369 1531 386Q1474 400 1414 407Q1366 420 1289 419Q1226 425 1156 415Q1063 404 994 397Q943 391 907 378Q882 383 834 378Q745 381 674 365L553 345Q501 336 491 296Z',
            // Visible stretches of Hole 2 above and Hole 1 below the playing corridor.
            'M437 0L1605 0Q1652 29 1694 58Q1722 86 1719 124Q1720 164 1708 190Q1660 205 1591 207Q1501 202 1450 192Q1384 190 1312 180Q1224 168 1147 163Q1044 157 944 141Q821 117 709 119Q625 118 553 98Q477 83 437 0Z',
            'M162 377Q292 367 405 423Q570 491 702 524Q836 558 956 589Q1030 610 1127 643L697 643Q555 599 446 567Q325 528 232 475Q173 437 162 377Z'
        ].join(' '),
        surround:'M1779 221Q1790 206 1823 192Q1852 176 1887 180Q1909 182 1914 213Q1919 240 1902 260Q1866 282 1822 277Q1792 273 1779 221Z',
        green:'M1807 225Q1816 208 1845 195Q1865 186 1888 196Q1898 208 1898 230Q1900 253 1881 263Q1850 273 1826 263Q1804 250 1807 225Z',
        sand:[
            'M1642 361Q1651 352 1668 348Q1684 337 1694 343Q1706 351 1698 363Q1688 370 1677 372Q1662 384 1650 383Q1639 374 1642 361Z',
            'M1783 151Q1786 135 1813 136Q1848 138 1874 153Q1888 161 1880 174Q1875 181 1853 182Q1820 186 1798 211Q1788 221 1779 209Q1788 182 1783 151Z',
            'M1820 278Q1835 267 1852 275Q1876 280 1897 263Q1907 257 1910 268Q1904 281 1893 289Q1880 298 1859 296Q1843 306 1830 301Q1817 297 1820 278Z'
        ].join(' ')
    },
    // Use the established Hole 1 relief and Hole 2 recovery model at their aerial positions in this view.
    pews:{...hole1.pews,x:818,z:450,spacing:21,length:68,width:7},
    landforms:[{...barranca,
        shape:'M1739 23Q1748 6 1756 24Q1768 46 1765 77Q1764 102 1770 132L1780 184Q1788 218 1767 227Q1748 234 1741 211Q1732 184 1726 153Q1719 133 1720 112Q1705 95 1713 72Q1722 53 1739 23Z'
    }],
    paths:[
        'M70 0Q51 33 51 62L34 203Q29 245 79 248Q135 248 179 249Q233 257 284 283Q392 318 508 358Q666 407 837 418Q986 427 1142 445Q1363 464 1463 442Q1577 416 1652 380Q1719 349 1800 343Q1899 337 1939 344',
        'M180 249Q226 275 256 324Q279 364 343 371Q494 405 625 445Q807 513 1008 557Q1073 568 1142 554Q1264 557 1388 591Q1481 591 1493 615',
        'M895 0Q977 31 1079 43Q1287 66 1483 69Q1607 81 1698 63Q1728 45 1743 0',
        'M1750 643Q1783 570 1815 510Q1833 442 1880 390Q1918 349 1948 309Q1983 257 2001 260Q2028 262 2004 283Q1987 299 1968 289'
    ],
    scenery:{trees:[
        [454,133,13],[743,169,12],[918,259,7],[985,198,15],
        [1136,244,12],[1250,216,9],[1271,289,13],[1442,276,12],[1508,219,11],[1510,270,10],
        [389,361,11],[505,391,9],[529,417,8],[579,404,10],[724,432,11],
        [994,518,10],[1032,486,10],[1134,423,13],[1120,465,11],[1132,522,12],
        [1189,475,9],[1238,484,10],[1302,467,9],[1348,474,14],[1385,438,12],
        [1449,452,10],[1585,402,12],[1715,389,10],[1964,222,9],
        [1070,30,10],[1225,49,12],[1345,62,10],[1468,68,11],[1582,69,12],[1670,54,13]
    ].map(([x,z,height])=>({...point(x,z),height}))},
    terrain:{baseRipple:.07,rippleLength:82,bunkerDepth:.72,bunkerBlend:1.8},
    green:{
        front:1806,depth:93,center:pin,blend:[116,83],backToFrontRise:0,
        contour:(x,z)=>k*(.036*(x-pin[0])+.042*(z-pin[1]))
    }
};
