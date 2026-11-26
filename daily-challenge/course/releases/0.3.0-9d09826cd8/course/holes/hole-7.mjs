import {geometryPath,sampleGeometryPath} from '../../core/geometry.mjs';
import {clamp,ease,mix} from '../../core/physics.mjs';

// Coordinates trace the supplied 2048 × 517 aerial markup.
const pin=[1807,222];
const k=448*.9144/(pin[0]-78);
const point=(x,z)=>({x:x*k,z:z*k});
const tee=(id,name,yards,x,z)=>({id,name,yards,...point(x,z)});
const boundary='M0 505Q265 502 442 481Q587 451 677 445L922 435Q1050 421 1120 415L1260 414Q1371 401 1459 401Q1531 387 1593 394Q1610 391 1659 378Q1713 364 1777 362Q1844 365 1887 339Q1923 297 1926 239Q1931 160 1968 109L1995 0';

// Trace the left collar from the front approach around the green shoulder.
const runoffEdge=geometryPath('M1710 230Q1734 229 1744 210Q1748 198 1754 194Q1777 183 1809 193Q1840 198 1854 210Q1867 221 1868 232')[0];
let edgeSegment=1;
const runoffLevels=Array.from({length:159},(_,i)=>{
    const x=1710+i;
    while(runoffEdge[edgeSegment][0]<x)edgeSegment++;
    const [x0,z0]=runoffEdge[edgeSegment-1],[x1,z1]=runoffEdge[edgeSegment];
    return mix(z0,z1,(x-x0)/(x1-x0))-2;
});

function approachGrade(x,z){
    const crossSlope=-(z-250)*k*.026*ease((x-500)/240);
    const collar=.28*ease((x-1708)/37);
    const greenPitch=.025*k*clamp(x-1744,0,126);
    const greenBlend=ease((z-169)/20)*(1-ease((z-268)/50))*(1-ease((x-1870)/75));
    return crossSlope+(collar+greenPitch)*greenBlend;
}

export const hole7={
    id:'springhaven-7',number:7,name:'The Springhaven Club - Hole 7',
    title:'The rightward slope',par:4,
    description:'Favor the left half of the fairway. The ground feeds right toward sand and out of bounds, which also wraps behind the green.',
    about:'The tee pads, trees, bunkers and green trace the supplied aerial. Tee markers, grades, bunker depths and the boundary turn behind the green are provisional.',
    plan:{width:2048,height:517,metresPerUnit:k},
    bounds:{minX:0,maxX:2048*k,minZ:0,maxZ:517*k},
    airClearance:20,renderStep:.75,pathWidth:1.8,
    tees:[
        tee('1896','1896 (Black)',448,78,220),
        tee('rawlins','Rawlins (Blue)',431,150,220),
        tee('butler','Butler (Silver)',370,378,343),
        tee('dixon','Dixon (White)',334,518,250)
    ],
    pins:[{id:'center',name:'Center',...point(...pin)}],
    aimPoints:[point(1140,248)],
    shapes:{
        tee:'M72 207L190 205L193 234L73 233Z M341 332L409 323L415 353L341 358Z M497 234L538 236L539 268L494 267Z',
        fairway:'M635 308L636 271Q647 247 672 232Q697 216 740 213Q805 203 898 203Q1040 201 1152 204Q1252 209 1350 206Q1450 199 1502 195Q1551 203 1617 196Q1665 200 1691 188Q1716 161 1738 145Q1762 130 1788 125Q1815 122 1837 144Q1848 168 1853 195Q1868 210 1869 233Q1858 248 1843 256Q1815 269 1791 248Q1756 230 1737 241Q1724 244 1717 264Q1715 277 1692 277L1607 277Q1571 271 1533 288Q1503 300 1474 304Q1408 309 1350 309Q1298 315 1282 318Q1250 322 1225 320L1140 321Q1129 315 1114 305Q1097 296 1084 311Q1068 323 1043 325Q1026 325 1005 341Q991 349 955 350Q891 358 852 362Q811 363 758 357Q709 352 670 342Q636 332 635 308Z',
        surround:'M1726 206Q1728 189 1745 178Q1780 165 1823 181Q1857 189 1876 218Q1883 243 1861 259Q1837 278 1813 267Q1783 246 1745 246Q1727 238 1726 206Z',
        green:'M1744 218Q1743 201 1754 194Q1777 183 1809 193Q1840 198 1854 210Q1867 221 1866 233Q1864 248 1840 263Q1827 269 1809 253Q1786 237 1763 237Q1742 240 1744 218Z',
        sand:[
            'M1042 350Q1044 337 1058 330Q1082 325 1092 312Q1103 302 1114 309Q1118 320 1111 337Q1114 351 1109 365Q1100 371 1080 363Q1071 362 1062 371Q1051 383 1045 367Z',
            'M1714 293Q1717 276 1724 257Q1728 247 1740 244Q1758 238 1780 250Q1778 262 1765 277Q1752 287 1744 303Q1732 320 1721 312Q1713 307 1714 293Z',
            'M1748 310Q1757 295 1776 275Q1785 266 1794 254Q1808 261 1814 270Q1817 281 1806 288Q1792 296 1788 305Q1779 321 1762 319L1748 317Z'
        ].join(' '),
        outOfBounds:boundary+' L2048 0L2048 517L0 517Z'
    },
    paths:[
        'M1961 102Q1897 104 1842 96Q1793 79 1760 109Q1723 150 1653 171Q1614 183 1536 182L1325 184Q1200 196 1090 181Q977 168 866 177Q794 197 708 201Q641 200 598 252Q546 300 497 350Q453 400 408 399Q379 400 340 429Q242 481 149 484Q84 502 0 488',
        'M0 199Q18 148 70 144Q187 119 292 115Q455 112 553 97Q726 100 830 82Q902 74 1028 94Q1137 115 1234 111Q1350 101 1410 80Q1497 82 1576 70Q1645 69 1702 29Q1732 8 1770 0'
    ],
    boundaryStakes:sampleGeometryPath(geometryPath(boundary)[0],39).map(({x,z})=>point(x,z)),
    scenery:{trees:[
        [65,160,12],[237,164,12],[346,130,9],[420,127,8],[553,127,11],[600,178,9],
        [772,114,11],[1024,104,11],[1132,144,10],[1247,146,12],[1386,146,10],[1463,147,11],[1576,135,9],
        [254,295,14],[1285,392,11],[1338,364,10],[1415,376,10],[1465,373,10],[1577,368,13],[1688,402,12],[1790,400,12]
    ].map(([x,z,height])=>({...point(x,z),height}))},
    terrain:{
        baseRipple:.045,rippleLength:75,bunkerDepth:.80,bunkerBlend:1.7,
        elevation(x,z){
            const grade=approachGrade(x,z);
            if(x<=1710||x>=1868)return grade;
            const index=Math.floor(x)-1710;
            const edge=mix(runoffLevels[index],runoffLevels[index+1],x-Math.floor(x));
            const outward=edge-z;
            if(outward<=0)return grade;

            const width=12+14*(1-ease((x-1715)/48));
            const floor=approachGrade(x,edge)-2*.3048;
            const bankToFlat=mix(approachGrade(x,edge),floor,ease(outward/width));
            const ends=ease((x-1710)/48)*(1-ease((x-1840)/28));
            const blendBack=1-ease((outward-width-19)/52);
            return mix(grade,bankToFlat,ends*blendBack);
        }
    },
    green:{front:1744,depth:122,center:pin,blend:[96,75],backToFrontRise:0}
};
