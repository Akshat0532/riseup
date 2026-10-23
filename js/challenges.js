'use strict';
/* RiseUp challenge stages. Each stage renders into #stageBox and calls runStage() when completed. */

let stageIndex = 0, stages = [], locked = false, mathCount = 0;

function progressHTML() {
  return '<div class="progress">' + stages.map((_, i) => '<div class="dot' + (i < stageIndex ? ' done' : '') + '"></div>').join('') + '</div>';
}
function lockTemporarily() {
  locked = true;
  document.getElementById('stageBox').classList.add('locked');
  setTimeout(() => { locked = false; document.getElementById('stageBox').classList.remove('locked'); }, 5000);
}

/* ---------- Math ---------- */
function mathStage(box) {
  mathCount = 0;
  newMath(box);
}
function newMath(box) {
  const op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
  let a = Math.floor(Math.random() * 20) + 5, b = Math.floor(Math.random() * 12) + 3;
  if (op === '-' && b > a) [a, b] = [b, a];
  const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
  box.innerHTML = progressHTML() + '<h3>Math Challenge (' + mathCount + '/3)</h3><div class="q">' + a + ' ' + op + ' ' + b + ' = ?</div>' +
    '<input id="mIn" inputmode="numeric" placeholder="Answer"><div class="msg" id="mMsg"></div><div class="hint">3 in a row. A mistake resets progress. Alarm keeps ringing.</div>';
  const inp = document.getElementById('mIn');
  inp.focus();
  inp.onkeydown = e => {
    if (e.key !== 'Enter' || locked) return;
    if (parseInt(inp.value, 10) === ans) {
      mathCount++;
      document.getElementById('mMsg').textContent = '';
      inp.value = '';
      if (mathCount >= 3) { stageIndex++; runStage(); } else newMath(box);
    } else {
      mathCount = 0;
      document.getElementById('mMsg').textContent = 'Wrong! Progress reset. 🔔';
      lockTemporarily();
      newMath(box);
    }
  };
}

/* ---------- Typing ---------- */
function typingStage(box) {
  const words = ['sunrise', 'coffee', 'awake', 'morning', 'energy', 'rise', 'shower', 'daylight', 'active', 'fresh', 'bounce', 'vigilant'];
  const phrase = Array.from({ length: 6 }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
  box.innerHTML = progressHTML() + '<h3>Typing Challenge</h3><div>Type this exactly:</div><div id="phrase">' + phrase + '</div>' +
    '<input id="tIn" autocomplete="off" placeholder="Type the phrase…"><div class="msg" id="tMsg"></div><div class="hint">Case-sensitive. A typo resets the phrase.</div>';
  const inp = document.getElementById('tIn');
  inp.focus();
  inp.oninput = () => {
    if (locked) return;
    if (inp.value === phrase) { stageIndex++; runStage(); }
    else if (!phrase.startsWith(inp.value)) {
      document.getElementById('tMsg').textContent = 'Typo! New phrase. 🔔';
      inp.value = '';
      lockTemporarily();
      typingStage(box);
    }
  };
}

/* ---------- Movement ---------- */
function motionStage(box) {
  if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(r => r === 'granted' ? grantMotion(box) : desktopMotion(box))
      .catch(() => desktopMotion(box));
  } else if ('DeviceMotionEvent' in window) grantMotion(box);
  else desktopMotion(box);
}
function grantMotion(box) {
  let active = 0, last = null, tick = null, started = false;
  box.innerHTML = progressHTML() + '<h3>Get Up & Move</h3><div>Walk around with your phone for 10 seconds of movement.</div>' +
    '<div style="padding:30px"><div class="steps" id="stepCount">0s</div>of movement detected</div><div class="hint">Physical motion required — lying still won\'t work.</div>';
  const h = e => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (last !== null && Math.abs(mag - last) > 2) {
      if (!started) { started = true; active++; }
      else if (!tick) tick = setInterval(() => {
        active++;
        document.getElementById('stepCount').textContent = Math.min(active, 10) + 's';
        if (active >= 10) { clearInterval(tick); window.removeEventListener('devicemotion', h); stageIndex++; runStage(); }
      }, 1000);
    }
    last = mag;
  };
  window.addEventListener('devicemotion', h);
}
function desktopMotion(box) {
  let hits = 0;
  const target = document.getElementById('target');
  box.innerHTML = progressHTML() + '<h3>Chase the Dot</h3><div>Click the red dot 10 times. It jumps every time.</div>' +
    '<div style="padding:30px"><div class="steps" id="hitCount">0/10</div></div>';
  const move = () => { target.style.left = Math.random() * (innerWidth - 80) + 'px'; target.style.top = Math.random() * (innerHeight - 80) + 'px'; };
  target.style.display = 'block';
  move();
  target.onclick = () => {
    hits++;
    document.getElementById('hitCount').textContent = hits + '/10';
    move();
    if (hits >= 10) { target.style.display = 'none'; target.onclick = null; stageIndex++; runStage(); }
  };
}

/* ---------- Walk-away code ---------- */
function codeStage(box) {
  box.innerHTML = progressHTML() + '<h3>Walk-Away Code</h3><div>Enter the secret code you wrote on paper — wherever that paper is, go get it.</div>' +
    '<input id="cIn" maxlength="8" autocomplete="off" placeholder="Secret code" style="letter-spacing:6px"><div class="msg" id="cMsg"></div><div class="hint">Wrong code = alarm keeps blaring. Get walking.</div>';
  const inp = document.getElementById('cIn');
  inp.focus();
  inp.onkeydown = e => {
    if (e.key !== 'Enter' || locked) return;
    if (inp.value === firedAlarm.code) { stageIndex++; runStage(); }
    else { document.getElementById('cMsg').textContent = 'Wrong code! 🔔'; inp.value = ''; lockTemporarily(); }
  };
}

const STAGE_MAP = { math: mathStage, typing: typingStage, motion: motionStage, code: codeStage };
function runStage() {
  const box = document.getElementById('stageBox');
  if (stageIndex >= stages.length) { window.__onWin(); return; }
  STAGE_MAP[stages[stageIndex]](box);
}
