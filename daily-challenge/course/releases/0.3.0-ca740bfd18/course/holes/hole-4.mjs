// Traced from the supplied Hole 4 markup. All engine coordinates are metres.
import {geometryPath,sampleGeometryPath} from '../../core/geometry.mjs';
import {ease} from '../../core/physics.mjs';

const greenCenter=[1870,257];
const k=420*.9144/Math.hypot(greenCenter[0]-190,greenCenter[1]-237);
const point=(x,z)=>({x:x*k,z:z*k});
const tee=(id,name,yards,z)=>({id,name,yards,...point(
    greenCenter[0]-Math.sqrt((yards*.9144/k)**2-(greenCenter[1]-z)**2),z)});
const outOfBounds='M105 346L365 351Q640 363 1018 405Q1130 418 1250 418L1650 417Q1790 416 1859 377Q1971 322 2034 308';

export const hole4={
    id:'springhaven-4',number:4,name:'The Springhaven Club - Hole 4',
    title:'The downhill dogleg',par:4,
    description:'Carry the left-side bunkers for an open approach or play right and face a blind downhill shot. Out of bounds runs along the right.',
    about:'The layout follows the supplied overhead. Tee positions, overall elevations, green contours and bunker depths are provisional.',
    plan:{width:2034,height:478,metresPerUnit:k},
    bounds:{minX:100*k,maxX:2034*k,minZ:0,maxZ:478*k},
    airClearance:20,renderStep:.75,pathWidth:1.8,
    tees:[tee('1896','1896 (Black)',420,237),tee('rawlins','Rawlins (Blue)',400,235),
        tee('butler','Butler (Silver)',380,228),tee('dixon','Dixon (White)',324,267)],
    pins:[{id:'center',name:'Center',...point(...greenCenter)}],
    aimPoints:[point(1170,132)],
    shapes:{
        tee:'M179 221L358 205L364 248L179 258Z M559 258L618 244L626 281L566 293Z',
        fairway:'M751 249Q760 205 799 174Q838 140 884 122Q901 118 930 145Q968 173 1014 158Q1061 143 1053 81Q1044 44 1068 25Q1129 12 1174 24Q1239 31 1252 65L1270 113Q1303 126 1314 148Q1318 164 1352 162Q1429 137 1494 160Q1561 180 1596 207Q1650 221 1690 213Q1752 199 1797 189Q1805 209 1848 221L1856 272Q1838 309 1792 305Q1740 302 1711 288Q1683 277 1669 302Q1654 325 1607 326Q1475 328 1364 285Q1322 271 1269 232Q1239 205 1198 218Q1150 218 1132 241Q1097 253 1051 292Q1026 319 932 315Q855 316 805 301Q757 286 751 249Z',
        surround:'M1789 234Q1806 220 1853 216Q1898 202 1926 213Q1944 234 1930 272Q1917 302 1881 308Q1833 309 1808 285Q1789 267 1789 234Z',
        green:'M1806 248Q1812 234 1854 225Q1901 212 1918 223Q1927 238 1923 269Q1920 291 1891 295Q1856 295 1830 281Q1814 269 1806 248Z',
        sand:[
            'M939 145Q935 130 959 123Q972 119 978 109Q993 98 1006 110Q1011 121 1019 135Q1024 148 1001 155Q976 171 949 155Z',
            'M1280 108Q1275 101 1287 90Q1296 81 1306 89Q1319 98 1322 88Q1335 85 1353 101Q1379 120 1373 137Q1365 151 1345 157Q1323 169 1316 142Q1313 129 1293 122Z',
            'M1083 285Q1087 267 1125 248Q1135 233 1153 225Q1169 214 1172 230Q1173 248 1154 276Q1138 303 1105 303Q1083 301 1083 285Z',
            'M1183 252Q1188 233 1198 226Q1214 217 1233 224Q1249 231 1257 249Q1264 261 1243 263Q1226 265 1213 257Q1207 257 1198 264Q1186 267 1183 252Z',
            'M1669 325Q1665 311 1680 302Q1687 280 1702 282Q1717 283 1728 297Q1729 305 1714 311Q1710 328 1697 335Q1678 343 1669 325Z',
            'M1773 318Q1769 306 1788 302Q1823 301 1848 309Q1861 315 1850 331Q1840 338 1821 333Q1801 345 1780 340Q1773 334 1773 318Z',
            'M1815 200Q1810 182 1826 179Q1841 184 1856 180Q1878 175 1875 193Q1872 204 1878 212Q1875 224 1847 222Q1824 220 1815 200Z',
            'M1923 219Q1918 209 1927 199Q1936 187 1945 200Q1951 208 1944 219Q1950 222 1958 230Q1964 241 1949 252Q1935 258 1928 244Q1921 235 1923 219Z'
        ].join(' '),
        road:'M1720 478Q1880 423 2034 343L2034 382Q1890 459 1820 478Z'
    },
    paths:[
        'M146 0Q145 88 143 185Q137 255 124 322L112 414',
        'M350 0Q331 56 281 97Q252 129 199 151Q156 177 159 226Q151 267 172 287Q288 276 369 282Q540 302 701 310Q782 318 849 338Q1035 377 1246 370Q1420 355 1600 362Q1750 359 1830 342Q1941 306 2034 283',
        'M306 65Q339 103 386 111Q417 125 448 168Q497 197 500 243L501 289Q488 314 440 325Q409 331 387 348'
    ],
    outOfBounds,outOfBoundsSide:'right',
    boundaryStakes:sampleGeometryPath(geometryPath(outOfBounds)[0],32).map(({x,z})=>point(x,z)),
    scenery:{
        trees:[
            [224,82,10],[413,142,7],[590,124,10],[770,90,9],[1038,117,8],[1472,75,10],[1652,52,10],[1754,116,11],
            [1168,346,10],[1235,317,11],[1370,335,9],[1494,348,10],[1598,392,10],[1718,399,11],
            [917,399,10],[1020,435,12],[1185,452,11],[1340,450,11],[1773,366,10],[1893,340,11],[1977,254,10]
        ].map(([x,z,height])=>({...point(x,z),height})),
        buildings:[{...point(266,353),width:38,height:6,depth:20}]
    },
    terrain:{
        baseRipple:.06,rippleLength:65,bunkerDepth:.78,bunkerBlend:1.6,
        elevation(x,z){
            const descent=-7*ease((x-1160)/700);
            const rightCrest=4.7*Math.exp(-(((x-1380)/123)**2+((z-278)/61)**2));
            return descent+rightCrest;
        }
    },
    green:{front:1806,depth:117,center:greenCenter,blend:[95,71],backToFrontRise:-.20,localBreaks:null},
    provisional:['Tee marker locations and bunker carries','Right-side crest and downhill grade','Green contours','Bunker depth','Exact boundary stakes'],
    sources:['User supplied Hole 4 overhead and markup','Springhaven published hole guide']
};
