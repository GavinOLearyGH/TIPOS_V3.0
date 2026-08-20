import { startRouter, navigate } from './router.js';
import { TIPState } from './core/storage.js';
import { deleteJournalEntry } from './core/journal.js';
import { detectV2Data, importV2FromThisDevice } from './core/import-v2.js';
import { renderEntryForm, saveEntryForm } from './golfer/entry-form.js';
import { renderHome } from './home/home-view.js';
import { renderTIP } from './tip/tip-view.js';
import { renderGolfer } from './golfer/journal-view.js';
import { startTIP7 } from './tip7/tip7-view.js';

const view = document.getElementById('view');
const menuDialog = document.getElementById('menuDialog');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const entryDialog = document.getElementById('entryDialog');
const entryDialogBody = document.getElementById('entryDialogBody');
const restoreFile = document.getElementById('restoreFile');
const toast = document.getElementById('toast');

let activeRoute = 'home';
let toastTimer = null;
let executionMode = null;
let executionCleanup = null;

const renderers = { home:renderHome, tip:renderTIP, golfer:renderGolfer };

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function endExecution() {
  if (executionCleanup) executionCleanup();
  executionCleanup = null;
  executionMode = null;
  document.body.classList.remove('execution-mode');
}

function render(route = activeRoute) {
  if (executionMode) return;
  activeRoute = renderers[route] ? route : 'home';
  view.innerHTML = renderers[activeRoute]();
  document.querySelectorAll('[data-route]').forEach(link => link.classList.toggle('active', link.dataset.route === activeRoute));
  view.focus({ preventScroll:true });
  window.scrollTo({ top:0, behavior:'instant' });
}

function launchTIP7() {
  endExecution();
  executionMode = 'tip7';
  executionCleanup = startTIP7({
    container:view,
    onExit:() => {
      endExecution();
      activeRoute = 'home';
      if (location.hash !== '#/home') navigate('home');
      else render('home');
    },
    onComplete:() => showToast('TIP7 saved to your Journal.')
  });
  window.scrollTo({ top:0, behavior:'instant' });
}

function openEntry(entryId = null, type = null) {
  entryDialogBody.innerHTML = renderEntryForm(entryId, type);
  entryDialog.showModal();
}

function closeEntry() {
  if (entryDialog.open) entryDialog.close();
  entryDialogBody.innerHTML = '';
}

function downloadSnapshot() {
  const json = TIPState.exportSnapshot();
  const blob = new Blob([json], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `the-irish-par-golfer-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('Golfer exported.');
}

function handleAction(target) {
  const action = target.dataset.action;
  switch (action) {
    case 'tip7': launchTIP7(); break;
    case 'tip9': showToast('TIP9 integration arrives in V3.0-D.'); break;
    case 'tell-tip':
    case 'add-entry':
      openEntry(null, 'round');
      break;
    case 'edit-entry':
      openEntry(target.dataset.entryId);
      break;
    case 'delete-entry':
      if (confirm('Delete this Journal entry?')) {
        deleteJournalEntry(target.dataset.entryId);
        showToast('Journal entry deleted.');
      }
      break;
    case 'build-session': showToast('Session composition comes after TIP7, TIP9 and Memory.'); break;
    default: break;
  }
}

view.addEventListener('click', event => {
  if (executionMode) return;
  const target = event.target.closest('[data-action]');
  if (target) handleAction(target);
});

entryDialog.addEventListener('click', event => {
  if (event.target === entryDialog || event.target.closest('[data-entry-close]')) {
    closeEntry();
    return;
  }
  const typeButton = event.target.closest('[data-entry-type-choice]');
  if (typeButton) entryDialogBody.innerHTML = renderEntryForm(null, typeButton.dataset.entryTypeChoice);
});

entryDialog.addEventListener('submit', event => {
  if (event.target.id !== 'journalEntryForm') return;
  event.preventDefault();
  try {
    const wasEdit = !!event.target.dataset.entryId;
    saveEntryForm(event.target);
    closeEntry();
    navigate('golfer');
    showToast(wasEdit ? 'Journal entry updated.' : 'Added to your Journal.');
  } catch (error) {
    showToast(error.message || 'Could not save that entry.');
  }
});

menuBtn.addEventListener('click', () => menuDialog.showModal());
closeMenuBtn.addEventListener('click', () => menuDialog.close());
menuDialog.addEventListener('click', event => { if (event.target === menuDialog) menuDialog.close(); });

menuDialog.querySelector('.settings-list').addEventListener('click', event => {
  const button = event.target.closest('[data-setting]');
  if (!button) return;
  switch (button.dataset.setting) {
    case 'about':
      menuDialog.close();
      showToast('TIP7 trains the body. TIP9 trains the game. TIP remembers.');
      break;
    case 'export':
      downloadSnapshot();
      menuDialog.close();
      break;
    case 'restore':
      menuDialog.close();
      restoreFile.click();
      break;
    case 'import-v2': {
      const found = detectV2Data();
      menuDialog.close();
      if (!found.available) {
        showToast('No TIP OS V2 data found on this device.');
        break;
      }
      const total = found.counts.rounds + found.counts.sessions + found.counts.notes;
      if (confirm(`Import available TIP OS V2 history into this Journal? About ${total} historical records were found. Existing V3 entries will be kept.`)) {
        try {
          const result = importV2FromThisDevice();
          navigate('golfer');
          showToast(`V2 import complete: ${result.imported} records processed.`);
        } catch (error) {
          showToast(error.message || 'V2 import failed.');
        }
      }
      break;
    }
    case 'reset':
      if (confirm('Reset this V3 golfer? This clears the shared V3 state on this device.')) {
        TIPState.reset();
        menuDialog.close();
        render(activeRoute);
        showToast('Golfer reset.');
      }
      break;
    default: break;
  }
});

restoreFile.addEventListener('change', async () => {
  const file = restoreFile.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    if (!confirm('Restore this golfer file? The current V3 golfer on this device will be replaced.')) return;
    TIPState.restoreSnapshot(text);
    navigate('golfer');
    showToast('Golfer restored.');
  } catch (error) {
    showToast(error.message || 'Could not restore that golfer file.');
  } finally {
    restoreFile.value = '';
  }
});

TIPState.addEventListener('change', () => { if (!executionMode) render(activeRoute); });
startRouter(route => {
  if (executionMode) endExecution();
  render(route);
});
