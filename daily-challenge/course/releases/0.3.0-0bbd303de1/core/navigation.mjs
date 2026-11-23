// All destinations are derived from the current deployment, never a live hostname.
export function gameRoot(href){
 const url=new URL(href),match=url.pathname.match(/\/(daily-challenge|DailyChallenge)(?:\/|$)/);
 if(match)return new URL(url.pathname.slice(0,match.index+match[0].length).replace(/\/?$/,'/'),url);
 const course=url.pathname.indexOf('/course/');
 if(course>=0)return new URL(url.pathname.slice(0,course+1)+'daily-challenge/',url);
 return new URL('./',url);
}
export function gameLinks(href){const home=gameRoot(href);return {home:home.href,practice:new URL('course/',home).href,
 player:new URL('course/play.html',home).href,leaderboard:mode=>new URL('?board='+(mode==='ace'?'ace':'three')+'#leaderboards',home).href};}
