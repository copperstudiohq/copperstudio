const dateLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function bindSaveMenu(menu, store, { save, load, restart }) {
  const summary = menu.querySelector('summary');
  const message = menu.querySelector('#save-message');
  const manualButton = menu.querySelector('#load-manual');
  const autoButton = menu.querySelector('#load-auto');
  const manualInfo = menu.querySelector('#manual-info');
  const autoInfo = menu.querySelector('#auto-info');

  function updateSlot(slot, button, label) {
    const { status, record } = store.read(slot);
    button.disabled = !record;
    label.textContent = record ? record.state.place + ' · ' + dateLabel.format(record.savedAt)
      : { unavailable: 'Browser storage unavailable', invalid: 'Save could not be read' }[status] ?? 'No save yet';
  }

  function refresh() {
    if (!menu.open) return;
    updateSlot('manual', manualButton, manualInfo);
    updateSlot('auto', autoButton, autoInfo);
  }

  function report(text, close = false) {
    message.textContent = text;
    if (close) {
      menu.open = false;
      summary.focus();
    }
    refresh();
  }

  menu.querySelector('#save-manual').addEventListener('click', () => {
    const status = save();
    report(status === 'ready' ? 'Game saved.' : 'Couldn’t save the game. Check browser storage.');
  });
  for (const [slot, button] of [['manual', manualButton], ['auto', autoButton]]) {
    button.addEventListener('click', () => {
      const { record } = store.read(slot);
      if (record && load(record)) report('Save loaded.', true);
      else report('This save couldn’t be loaded.');
    });
  }
  menu.querySelector('#new-game').addEventListener('click', () => {
    if (!window.confirm('Start a new game and replace the autosave? Your manual save will stay available.')) return;
    const status = restart();
    report(status === 'ready' ? 'New game started.' : 'New game started. The autosave couldn’t be replaced.', status === 'ready');
  });
  menu.addEventListener('toggle', refresh);
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });
  window.addEventListener('storage', refresh);
  menu.hidden = false;
  return refresh;
}
