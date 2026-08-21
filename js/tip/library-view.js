import { TIP_LIBRARY_DIMENSIONS, filterTIPLibrary, getTIPLibraryItem } from '../coach/library.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function listHTML(items=[]){return items.length?`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'';}
function meta(item){
  if(item.dose?.balls) return `${item.dose.balls} BALLS${item.duration?` · ${item.duration} MIN`:''}`;
  if(item.dose?.seconds) return `${item.dose.seconds} SEC`;
  if(item.duration) return `${item.duration} MIN`;
  return item.skill||item.area||'PRACTICE';
}

export function libraryResultsHTML({dimension='All',query='',context=null}={}){
  const rows=filterTIPLibrary({dimension,query,context});
  const dimensions=['All',...TIP_LIBRARY_DIMENSIONS];
  const counts=Object.fromEntries(dimensions.map(d=>[d,filterTIPLibrary({dimension:d,query,context}).length]));
  return {
    count:`${rows.length} practice${rows.length===1?'':'s'}`,
    filters:dimensions.map(d=>`<button type="button" data-action="library-filter" data-library-filter="${esc(d)}" data-tip9-filter="${esc(d)}" class="${dimension===d?'selected':''}">${esc(d)}<small>${counts[d]}</small></button>`).join(''),
    rows:rows.map(item=>`<button type="button" class="tip-library-row" data-action="library-item" data-library-id="${esc(item.id)}" data-tip-library-id="${esc(item.id)}"><div class="tip-library-row-top"><span class="eyebrow">${esc(item.dimension)}${item.skill?` · ${esc(item.skill)}`:''}</span><span class="tip-library-meta">${esc(meta(item))}</span></div><strong>${esc(item.title)}</strong>${item.summary?`<p>${esc(item.summary)}</p>`:''}</button>`).join('')||'<div class="tip-library-empty">No practices match that search.</div>'
  };
}

export function renderTIPLibrary(workspace={}){
  const dimension=workspace.libraryFilter||'All';
  const query=workspace.libraryQuery||'';
  const parts=libraryResultsHTML({dimension,query});
  return `<section class="tip-library-view tip-library-workspace">
    <button type="button" class="tip-library-back-top" data-action="library-close">‹ Back to TIP</button>
    <div class="eyebrow">FULL CURRICULUM</div>
    <h1 class="page-title">TIP Library</h1>
    <p class="page-copy">Swing. Skill. Stretch. Strength. Everything TIP knows how to practice, in one place.</p>
    <label class="tip-library-search"><span class="sr-only">Search TIP Library</span><input type="search" data-tip-library-search value="${esc(query)}" placeholder="Search a problem, skill or practice" autocomplete="off"></label>
    <div class="tip9-filters tip-library-filters" data-tip-library-filters>${parts.filters}</div>
    <div class="tip-library-count" data-tip-library-count>${parts.count}</div>
    <div class="tip9-library tip-library-list" data-tip-library-results>${parts.rows}</div>
  </section>`;
}

export function renderTIPLibraryDetail(id){
  const item=getTIPLibraryItem(id);
  if(!item) return renderTIPLibrary();
  const detailMeta=[item.duration?`${item.duration} min`:item.dose?.seconds?`${item.dose.seconds} sec`:'',...(item.locations||[]).slice(0,3)].filter(Boolean).join(' · ');
  return `<section class="tip-library-detail tip-library-workspace">
    <button type="button" class="tip-library-back-top" data-action="library-detail-back">‹ TIP Library</button>
    <div class="eyebrow">TIP LIBRARY · ${esc(item.dimension)}</div>
    <h1 class="page-title">${esc(item.title)}</h1>
    ${item.summary?`<p class="page-copy">${esc(item.summary)}</p>`:''}
    ${detailMeta?`<div class="tip-library-detail-meta">${esc(detailMeta)}</div>`:''}
    ${item.equipment?.length?`<article class="tip-library-detail-section"><span class="eyebrow">YOU NEED</span>${listHTML(item.equipment)}</article>`:''}
    ${item.instructions?.length?`<article class="tip-library-detail-section"><span class="eyebrow">WHAT TO DO</span>${listHTML(item.instructions)}</article>`:''}
    ${item.success?.length?`<article class="tip-library-detail-section"><span class="eyebrow">SUCCESS</span>${listHTML(item.success)}</article>`:''}
    ${item.coachNote?`<article class="tip-library-cue"><span class="eyebrow">TIP CUE</span><p>${esc(item.coachNote)}</p></article>`:''}
    ${item.easier?.length||item.harder?.length?`<details class="tip-library-more"><summary>Adjust the practice</summary>${item.easier?.length?`<div><strong>Make it easier</strong>${listHTML(item.easier)}</div>`:''}${item.harder?.length?`<div><strong>Make it harder</strong>${listHTML(item.harder)}</div>`:''}</details>`:''}
  </section>`;
}

export function updateTIPLibraryResults(container,workspace={}){
  const parts=libraryResultsHTML({dimension:workspace.libraryFilter||'All',query:workspace.libraryQuery||''});
  const filters=container.querySelector('[data-tip-library-filters]');
  const count=container.querySelector('[data-tip-library-count]');
  const results=container.querySelector('[data-tip-library-results]');
  if(filters) filters.innerHTML=parts.filters;
  if(count) count.textContent=parts.count;
  if(results) results.innerHTML=parts.rows;
}
