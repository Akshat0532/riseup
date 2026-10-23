'use strict';
/* RiseUp app: alarm storage, scheduling, audio, PWA install. */
const $ = id => document.getElementById(id);
let alarms = JSON.parse(localStorage.getItem('riseup_alarms') || '[]');
let firedAlarm = null;
let audioCtx = null, osc = null, pulse = null;
let deferredInstall = null;

/* ---------- Audio ---------- */
function startAlarm() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 880; gain.gain.value = 0.25;
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start();
    let up = true;
    pulse = setInterval(() => { if (osc) { osc.frequency.value = up ? 880 : 620; up = !up; } }, 400);
  } catch (e) { console.warn('audio unavailable', e); }
}
function stopAlarm() {
  try { clearInterval(pulse); if (osc) osc.stop(); if (audioCtx) audioCtx.close(); } catch (e) {}
  audioCtx = osc = null;
}

/* ---------- Storage & list ---------- */
function save() { localStorage.setItem('riseup_alarms', JSON.stringify(alarms)); renderList(); }
function repLabel(r) { return { once: 'once', daily: 'daily', weekdays: 'Mon–Fri', weekends: 'Sat–Sun' }[r]; }
function renderList() {
  $('alarmList').innerHTML = alarms.length ? alarms.map(a =>
    '<div class="alarm-row"><span>⏰ ' + a.time + ' <span class="tag">' + repLabel(a.repeat) + '</span>' +
    (a.code ? '<span class="tag">🔒code</span>' : '') + '</span>' +
    '<span><button class="del" data-id="' + a.id + '" aria-label="Delete">✕</button></span></div>').join('')
    : '<div style="color:#64748b;font-size:.85rem;padding:8px">No alarms yet.</div>';
  document.querySelectorAll('.del').forEach(b => b.onclick = () => { alarms = alarms.filter(a => a.id != b.dataset.id); save(); });
}

$('armBtn').onclick = () => {
  const t = $('timeInput').value;
  if (!t) { $('status').textContent = 'Pick a time first.'; return; }
  const code = $('secretCode').value.trim();
  alarms.push({ id: Date.now(), time: t, repeat: $('repeat').value, mode: $('mode').value, code, firedToday: false });
  save();
  $('status').textContent = 'Alarm added for ' + t + '. No snooze. Good luck.' +
    (code ? ' Write code ' + code + ' on paper far from bed!' : '');
  $('secretCode').value = '';
  requestWakeLock();
};

/* ---------- Scheduling ---------- */
function todayMatches(rep) {
  const d = new Date().getDay();
  if (rep === 'daily') return true;
  if (rep === 'weekdays') return d >= 1 && d <= 5;
  if (rep === 'weekends') return d === 0 || d === 6;
  return false;
}
setInterval(() => {
  const now = new Date();
  const cur = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (now.getSeconds() > 2) return;
  const hit = alarms.find(a => a.time === cur && (a.repeat === 'once' || todayMatches(a.repeat)) && !a.firedToday);
  if (hit) { hit.firedToday = true; save(); trigger(hit); }
}, 1000);
function resetFiredFlags() {
  const key = 'riseup_day_' + new Date().toDateString();
  if (localStorage.getItem(key) !== '1') { alarms.forEach(a => a.firedToday = false); save(); localStorage.setItem(key, '1'); }
}
resetFiredFlags(); setInterval(resetFiredFlags, 3600000);

function trigger(alarm) {
  firedAlarm = alarm;
  stageIndex = 0; stages = [];
  const m = alarm.mode;
  if (m === 'full' || m === 'math') stages.push('math', 'typing');
  if (m === 'full' || m === 'motion') stages.push('motion');
  if (alarm.code) stages.push('code');
  if (!stages.length) stages.push('math', 'typing');
  $('wakeTime').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $('wake').classList.add('active');
  startAlarm();
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  runStage();
}

window.__onWin = function () {
  stopAlarm();
  if (firedAlarm.repeat === 'once') alarms = alarms.filter(a => a.id !== firedAlarm.id);
  save();
  $('stageBox').innerHTML = '<h3 style="color:#22c55e">🎉 Alarm dismissed</h3><div style="margin-top:10px">You\'re up. Have a great morning.</div>';
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  setTimeout(() => { $('wake').classList.remove('active'); $('status').textContent = 'Dismissed. Next alarm re-arms automatically.'; }, 2500);
};

async function requestWakeLock() { try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && alarms.length) requestWakeLock(); });

/* ---------- PWA install ---------- */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('installBtn').hidden = false; });
$('installBtn').onclick = async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null; $('installBtn').hidden = true;
};

/* ---------- Service worker ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

renderList();
