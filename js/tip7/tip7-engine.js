import { TIPState } from '../core/storage.js';
import { addJournalEntry, getJournal, updateJournalEntry } from '../core/journal.js';
import { TIP7_DAYS } from './tip7-data.js';

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function dayDiff(a,b) {
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}

export function calcTIP7Streak(progress = TIPState.get().tip7) {
  const dates = [...new Set(Object.values(progress.dates || {}).filter(Boolean))].sort();
  if (!dates.length) return 0;
  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (dayDiff(dates[i-1], dates[i]) === 1) streak++;
    else break;
  }
  return dayDiff(dates.at(-1), localDay()) <= 1 ? streak : 0;
}

export function nextTIP7DayIndex(progress = TIPState.get().tip7) {
  for (let i=0; i<TIP7_DAYS.length; i++) if (!progress.completed.includes(i)) return i;
  return TIP7_DAYS.length;
}

export function completedTIP7Today(progress = TIPState.get().tip7) {
  return Object.values(progress.dates || {}).includes(localDay());
}

export function getTIP7Status() {
  const progress = TIPState.get().tip7;
  const nextIndex = nextTIP7DayIndex(progress);
  const streak = calcTIP7Streak(progress);
  return {
    progress,
    nextIndex,
    nextDay: nextIndex < TIP7_DAYS.length ? TIP7_DAYS[nextIndex] : null,
    streak,
    complete: nextIndex >= TIP7_DAYS.length,
    doneToday: completedTIP7Today(progress),
    canStart: nextIndex < TIP7_DAYS.length && !completedTIP7Today(progress)
  };
}

function existingJournalEntry(dayIndex) {
  const date = TIPState.get().tip7.dates?.[dayIndex];
  if (!date) return null;
  return getJournal().find(entry =>
    entry.source === 'tip7' &&
    Number(entry.activity?.dayIndex) === Number(dayIndex) &&
    String(entry.createdAt || '').slice(0,10) === date
  ) || null;
}

export function completeTIP7Day(dayIndex) {
  const day = TIP7_DAYS[dayIndex];
  if (!day) throw new Error('TIP7 day not found.');
  const date = localDay();
  let newlyCompleted = false;

  TIPState.update(state => {
    const t = state.tip7;
    if (!t.completed.includes(dayIndex)) {
      t.completed.push(dayIndex);
      t.completed.sort((a,b)=>a-b);
      t.dates[dayIndex] = date;
      t.lifetime = Number(t.lifetime || 0) + 1;
      t.lastCompletedAt = new Date().toISOString();
      newlyCompleted = true;
    }
    t.currentStreak = calcTIP7Streak(t);
    t.bestStreak = Math.max(Number(t.bestStreak || 0), t.currentStreak);
    t.day = Math.min(TIP7_DAYS.length, nextTIP7DayIndex(t) + 1);
    return state;
  }, 'tip7:complete');

  if (newlyCompleted) {
    return addJournalEntry({
      type:'tip7',
      source:'tip7',
      title:day.theme,
      dimensions: day.dimension.includes('STRETCH') && day.dimension.includes('STRENGTH') ? ['stretch','strength'] : [day.dimension.toLowerCase()],
      topics:day.topics,
      result:{ completed:true, level:1, day:day.day, feel:'' },
      activity:{ kind:'tip7', level:1, day:day.day, dayIndex, theme:day.theme, durationSeconds:TIP7_DAYS[dayIndex].exercises.length * 30 },
      note:''
    });
  }
  return existingJournalEntry(dayIndex);
}

export function saveTIP7Feel(dayIndex, feel) {
  const day = TIP7_DAYS[dayIndex];
  const value = String(feel || '').trim();
  if (!day || !value) return null;

  TIPState.update(state => {
    state.tip7.feel[dayIndex] = value;
    return state;
  }, 'tip7:feel');

  const entry = existingJournalEntry(dayIndex);
  if (entry) {
    return updateJournalEntry(entry.id, {
      result:{ ...entry.result, feel:value },
      reflection:{ text:`TIP7 check-in: ${value}` }
    });
  }
  return null;
}
