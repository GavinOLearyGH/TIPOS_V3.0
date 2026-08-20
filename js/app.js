import { startRouter, navigate } from './router.js';
import { TIPState } from './core/storage.js';
import { renderHome } from './home/home-view.js';
import { renderTIP } from './tip/tip-view.js';
import { renderGolfer } from './golfer/journal-view.js';

const view = document.getElementById('view');
const menuDialog = document.getElementById('menuDialog');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const toast = document.getElementById('toast');

let activeRoute = 'home';
let toastTimer = null;

const renderers = {
  home: renderHome,
  tip: renderTIP,
  golfer: renderGolfer
};

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function render(route = activeRoute) {
  activeRoute = renderers[route] ? route : 'home';
  view.innerHTML = renderers[activeRoute]();
  document.querySelectorAll('[data-route]').forEach(link => {
    link.classList.toggle('active', link.dataset.route === activeRoute);
  });
  view.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function downloadSnapshot() {
  const json = TIPState.exportSnapshot();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `the-irish-par-golfer-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('Golfer exported.');
}

function handleAction(action) {
  switch (action) {
    case 'tip7':
      showToast('TIP7 integration arrives in V3.0-C.');
      break;
    case 'tip9':
      showToast('TIP9 integration arrives in V3.0-D.');
      break;
    case 'tell-tip':
    case 'add-entry':
      navigate('tip');
      showToast('Journal entry flows arrive in V3.0-B.');
      break;
    case 'build-session':
      showToast('Session composition comes after TIP7, TIP9 and Memory.');
      break;
    default:
      break;
  }
}

view.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (target) handleAction(target.dataset.action);
});

menuBtn.addEventListener('click', () => menuDialog.showModal());
closeMenuBtn.addEventListener('click', () => menuDialog.close());
menuDialog.addEventListener('click', event => {
  if (event.target === menuDialog) menuDialog.close();
});

menuDialog.querySelector('.settings-list').addEventListener('click', event => {
  const button = event.target.closest('[data-setting]');
  if (!button || button.disabled) return;

  switch (button.dataset.setting) {
    case 'about':
      menuDialog.close();
      showToast('TIP7 trains the body. TIP9 trains the game. TIP remembers.');
      break;
    case 'export':
      downloadSnapshot();
      menuDialog.close();
      break;
    case 'reset':
      if (confirm('Reset this V3 golfer? This clears the shared V3 state on this device.')) {
        TIPState.reset();
        menuDialog.close();
        render(activeRoute);
        showToast('Golfer reset.');
      }
      break;
    default:
      break;
  }
});

TIPState.addEventListener('change', () => render(activeRoute));

startRouter(render);
