/* 워터파크 안내방송 콘솔
 * - 방송 스테이션(태블릿 1대): 실제 음성 송출 + 자동 시간표 실행
 * - 리모컨(휴대폰·PC): 방송 요청을 보내고 멘트·시간표를 함께 편집
 * - Firebase Realtime Database로 기기 간 실시간 공유 (미설정 시 이 기기 전용으로 동작)
 */
(function () {
'use strict';

/* ================= 기본 데이터 ================= */
const CATS = { all: '전체', safety: '안전', event: '이벤트', ops: '운영', emergency: '긴급' };
const DEFAULT_LIB = [
 {id:'s1',cat:'safety',title:'물놀이 안전수칙',ko:'고객 여러분께 안내 말씀 드립니다. 안전한 물놀이를 위해 풀장 주변에서 뛰거나 다이빙하지 마시고, 어린이는 반드시 보호자와 함께 이용해 주시기 바랍니다. 안전요원의 안내에 협조해 주셔서 감사합니다.',en:'Attention please. For your safety, please do not run or dive in the pool area. Children must be accompanied by a guardian at all times. Thank you.'},
 {id:'s2',cat:'safety',title:'미끄럼·단차 주의',ko:'바닥이 젖어 매우 미끄럽습니다. 이동하실 때는 천천히 걸어 주시고, 출입구와 계단의 낮은 단차에 걸려 넘어지지 않도록 발밑을 확인해 주시기 바랍니다.',en:'The floor is wet and slippery. Please walk slowly and watch your step at entrances and stairs.'},
 {id:'s3',cat:'safety',title:'구명조끼 착용 안내',ko:'파도풀과 유수풀을 이용하시는 어린이 고객은 구명조끼를 꼭 착용해 주시기 바랍니다. 구명조끼는 휴게시설·자켓 대여소에서 대여하실 수 있습니다.',en:'Children using the wave pool and lazy river must wear a life jacket. Life jackets are available at the rental counter.'},
 {id:'s4',cat:'safety',title:'휴식·수분 보충 권장',ko:'장시간 물놀이는 체온 저하와 피로를 일으킬 수 있습니다. 한 시간에 한 번은 물 밖에서 충분히 쉬시고 물을 드셔 주시기 바랍니다.',en:''},
 {id:'e1',cat:'event',title:'폼파티 10분 전',ko:'잠시 후 10분 뒤, 워터파크 메인 무대에서 신나는 버블 폼파티가 시작됩니다. 참여를 원하시는 고객께서는 무대 앞으로 모여 주시기 바랍니다.',en:'The bubble foam party starts in 10 minutes at the main stage. Please gather in front of the stage.'},
 {id:'e2',cat:'event',title:'폼파티 시작',ko:'지금부터 버블 폼파티를 시작합니다. 거품 속에서는 뛰지 마시고, 어린이는 보호자와 함께 즐겨 주시기 바랍니다.',en:'The bubble foam party is starting now. Please do not run, and keep children close to you.'},
 {id:'e3',cat:'event',title:'파도풀 가동 5분 전',ko:'5분 뒤 파도풀 파도가 시작됩니다. 수영이 서툰 고객과 어린이는 얕은 곳에서 구명조끼를 착용하고 이용해 주시기 바랍니다.',en:'Waves will start in the wave pool in 5 minutes. Weak swimmers and children, please stay in the shallow area with a life jacket.'},
 {id:'e4',cat:'event',title:'해적 공연 안내',ko:'오후 4시, 메인 무대에서 해적 공연이 시작됩니다. 가족과 함께 즐거운 시간 보내시기 바랍니다.',en:''},
 {id:'o1',cat:'ops',title:'개장 안내',ko:'안녕하십니까. 오늘도 저희 워터파크를 찾아 주신 고객 여러분, 진심으로 환영합니다. 지금부터 워터파크 운영을 시작합니다. 안전하고 즐거운 시간 보내시기 바랍니다.',en:'Good morning and welcome. The water park is now open. Have a safe and fun day.'},
 {id:'o2',cat:'ops',title:'자켓 대여 라인 안내',ko:'휴게시설·자켓 대여소를 이용하시는 고객께 안내드립니다. 자켓만 대여하실 고객은 왼쪽 전용 라인을, 휴게시설과 자켓을 함께 대여하실 고객은 오른쪽 라인을 이용해 주시기 바랍니다.',en:'Life jacket only, please use the left line. For rest area and jacket rentals together, please use the right line.'},
 {id:'o3',cat:'ops',title:'수영 강습 안내',ko:'초보자 수영 강습이 잠시 후 시작됩니다. 사전 예약하신 고객께서는 실내 풀 강습 구역으로 와 주시기 바랍니다.',en:''},
 {id:'o4',cat:'ops',title:'영업 종료 30분 전',ko:'고객 여러분께 안내 말씀 드립니다. 30분 뒤 워터파크 운영이 종료됩니다. 물놀이를 마무리하시고 소지품을 챙겨 주시기 바랍니다.',en:'The water park will close in 30 minutes. Please finish your activities and collect your belongings.'},
 {id:'o5',cat:'ops',title:'영업 종료',ko:'오늘 워터파크 운영이 모두 종료되었습니다. 이용해 주셔서 감사합니다. 귀가길 안전에 유의하시고 다음에 또 찾아 주시기 바랍니다.',en:'The water park is now closed. Thank you for visiting, and have a safe trip home.'},
 {id:'x1',cat:'emergency',title:'기상 악화 일시 중단',ko:'긴급 안내 말씀 드립니다. 낙뢰 등 기상 악화로 야외 시설 운영을 일시 중단합니다. 야외에 계신 고객께서는 즉시 물에서 나와 실내로 이동해 주시기 바랍니다.',en:'Emergency notice. Due to severe weather, outdoor facilities are temporarily closed. Please leave the water and move indoors immediately.'},
 {id:'x2',cat:'emergency',title:'시설 점검 일시 중단',ko:'안내 말씀 드립니다. 안전 점검을 위해 해당 시설 운영을 잠시 중단합니다. 안전요원의 안내에 따라 물 밖으로 나와 주시기 바랍니다.',en:'Attention please. This facility is temporarily closed for a safety check. Please follow the lifeguard’s instructions.'},
 {id:'x3',cat:'emergency',title:'비상 대피 안내',ko:'긴급 안내 말씀 드립니다. 지금 비상 상황이 발생하였습니다. 고객 여러분께서는 침착하게 직원의 안내에 따라 가까운 비상구로 대피해 주시기 바랍니다. 뛰지 마시고 천천히 이동해 주십시오.',en:'Emergency. Please stay calm and follow staff to the nearest exit. Do not run.'}
];
const TEMPLATES = [
 {id:'child',title:'미아 보호',fields:[['age','나이','5'],['sex','성별','남자'],['place','보호 위치','B2 워터파크 입구 안내데스크']],
  build:v=>`미아 보호 안내 말씀 드립니다. ${v.age}세 ${v.sex} 어린이를 ${v.place}에서 보호하고 있습니다. 보호자께서는 ${v.place}로 와 주시기 바랍니다.`},
 {id:'parent',title:'보호자 찾기',fields:[['name','어린이 이름','김민준'],['age','나이','6'],['place','보호 위치','유수풀 안전요원 초소']],
  build:v=>`보호자를 찾습니다. ${v.age}세 ${v.name} 어린이가 보호자를 찾고 있습니다. ${v.name} 어린이의 보호자께서는 ${v.place}로 와 주시기 바랍니다.`},
 {id:'lost',title:'분실물 습득',fields:[['item','물품','검은색 방수 스마트폰 파우치'],['found','습득 장소','파도풀 앞 선베드'],['keep','보관 장소','고객센터']],
  build:v=>`분실물 안내 말씀 드립니다. ${v.found}에서 ${v.item}을 습득하여 ${v.keep}에 보관하고 있습니다. 물건을 잃어버리신 고객께서는 ${v.keep}로 문의해 주시기 바랍니다.`},
 {id:'car',title:'차량 이동 요청',fields:[['num','차량 번호','12가 3456'],['model','차종','흰색 승합차']],
  build:v=>`차량 이동 안내 말씀 드립니다. 차량 번호 ${v.num}, ${v.model} 차주분께서는 차량 이동을 위해 지하 주차장 안내 데스크로 와 주시기 바랍니다.`},
 {id:'call',title:'고객 호출',fields:[['name','성함','홍길동'],['place','오실 곳','1층 매표소']],
  build:v=>`고객 호출 안내 말씀 드립니다. ${v.name} 고객님, ${v.name} 고객님께서는 ${v.place}로 와 주시기 바랍니다.`}
];
const DEFAULT_SCHED = {
 gold:[['10:00','o1'],['11:00','s1'],['12:30','s4'],['13:50','e1'],['14:00','e2'],['15:00','s2'],['15:55','e3'],['16:00','e4'],['17:30','o4'],['18:00','o5']],
 normal:[['10:00','o1'],['12:00','s1'],['14:50','e1'],['15:00','e2'],['17:30','o4'],['18:00','o5']]
};

/* ================= 도우미 ================= */
const $ = s => document.querySelector(s);
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const pad = n => String(n).padStart(2, '0');
const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);
const clean = a => (Array.isArray(a) ? a : Object.values(a || {})).filter(Boolean);
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 3200); }
function defaultSched() {
  const mk = rows => rows.map(([time, id]) => ({ k: rid(), time, id, on: true }));
  return { gold: mk(DEFAULT_SCHED.gold), normal: mk(DEFAULT_SCHED.normal) };
}
function guessDevice() {
  const u = navigator.userAgent;
  if (/iPad|Tablet/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) return '태블릿';
  if (/Mobi|iPhone|Android/i.test(u)) return '휴대폰';
  return 'PC';
}

/* ================= 상태 ================= */
const devId = load('pa_dev', null) || (() => { const v = 'd_' + rid(); save('pa_dev', v); return v; })();
let devName = load('pa_devname', '') || guessDevice();
let stationCode = load('pa_code', '');
let isStation = load('pa_station', false);
let settings = Object.assign({ voice: '', rate: .95, pitch: 1, volume: 1, chime: true, multi: true, repeat: 1 }, load('pa_set_v2', {}));
let autoOn = load('pa_auto', true);

let lib = load('pa_lib_v2', null) || DEFAULT_LIB.map(x => ({ ...x }));
let sched = load('pa_sched_v2', null) || defaultSched();
let season = load('pa_season_v2', 'gold');
let log = load('pa_log_v2', []);

let filter = 'all', tplId = 'child', tplVals = {};

/* 코드가 링크로 들어온 경우 (?code=WP-XXXX) */
try {
  const qc = new URLSearchParams(location.search).get('code');
  if (qc) { stationCode = qc.trim().toUpperCase(); save('pa_code', stationCode); history.replaceState(null, '', location.pathname); }
} catch (e) {}

/* ================= 클라우드 (Firebase) ================= */
const cfg = window.FIREBASE_CONFIG;
const cloudReady = !!(window.firebase && cfg && cfg.databaseURL && cfg.apiKey && !/여기/.test(cfg.apiKey));
let root = null, connected = false, serverOffset = 0, stationInfo = null, listeners = [];
const serverNow = () => Date.now() + serverOffset;
const TS = () => firebase.database.ServerValue.TIMESTAMP;
const cloud = () => !!root;

function on(ref, ev, fn) { ref.on(ev, fn); listeners.push([ref, ev, fn]); }
function detach() { listeners.forEach(([r, e, f]) => r.off(e, f)); listeners = []; root = null; }

async function connectCloud() {
  detach();
  if (!cloudReady) { updateConn(); return; }
  if (!stationCode) { updateConn(); openSettings(); return; }
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    if (!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
  } catch (e) {
    console.error(e); toast('Firebase 로그인에 실패했습니다. 익명 로그인이 켜져 있는지 확인해 주세요.'); updateConn(); return;
  }
  const db = firebase.database();
  root = db.ref('stations/' + stationCode);
  on(db.ref('.info/connected'), 'value', s => { connected = !!s.val(); updateConn(); });
  on(db.ref('.info/serverTimeOffset'), 'value', s => { serverOffset = s.val() || 0; });

  // 처음 쓰는 코드면 기본 데이터 넣기
  try {
    const snap = await root.child('lib').once('value');
    if (!snap.exists()) {
      await root.update({ lib, sched, season });
    }
  } catch (e) {
    console.error(e); toast('데이터베이스 접근이 거부되었습니다. 보안 규칙과 업장 코드(8자 이상)를 확인해 주세요.'); detach(); updateConn(); return;
  }

  on(root.child('lib'), 'value', s => { if (s.exists()) { lib = clean(s.val()); renderLib(); renderSched(); } });
  on(root.child('sched'), 'value', s => { const v = s.val(); if (v) { sched = { gold: clean(v.gold), normal: clean(v.normal) }; renderSched(); } });
  on(root.child('season'), 'value', s => { if (s.val()) { season = s.val(); renderSeason(); } });
  on(root.child('log').orderByChild('at').limitToLast(40), 'value', s => {
    const arr = []; s.forEach(c => { arr.push(c.val()); }); log = arr.reverse(); renderLog(); if (!playing) setNow(null, false);
  });
  on(root.child('station'), 'value', s => {
    stationInfo = s.val();
    if (isStation && stationInfo && stationInfo.dev && stationInfo.dev !== devId) {
      isStation = false; save('pa_station', false); stopStation();
      toast('다른 기기(' + (stationInfo.name || '알 수 없음') + ')가 방송 스테이션이 되어 이 기기는 리모컨으로 바뀌었습니다.');
    }
    updateConn(); renderRole();
  });
  if (isStation) $('#unlock').hidden = false;
  updateConn(); renderRole();
}

/* 저장: 클라우드 연결 시 공유, 아니면 이 기기에 */
function saveLib() { save('pa_lib_v2', lib); if (cloud()) root.child('lib').set(lib); }
function saveSched() { save('pa_sched_v2', sched); if (cloud()) root.child('sched').set(sched); }
function saveSeason() { save('pa_season_v2', season); if (cloud()) root.child('season').set(season); }

function stationOnline() {
  return !!(stationInfo && stationInfo.hb && serverNow() - stationInfo.hb < 45000);
}
function updateConn() {
  const b = $('#connBtn'), t = $('#connTxt');
  b.className = 'conn';
  updateMbar();
  if (!cloudReady) { b.classList.add('wait'); t.textContent = '이 기기 전용 (Firebase 미설정)'; return; }
  if (!stationCode || !root) { b.classList.add('bad'); t.textContent = '연결 안 됨 · 설정 필요'; return; }
  if (!connected) { b.classList.add('wait'); t.textContent = '서버 연결 중…'; return; }
  if (isStation && stationStarted) { b.classList.add('station'); t.textContent = '● 방송 스테이션 (이 기기)'; return; }
  if (isStation) { b.classList.add('wait'); t.textContent = '스테이션 시작 대기'; return; }
  if (stationOnline()) { b.classList.add('ok'); t.textContent = '스테이션 연결됨 · ' + (stationInfo.name || '태블릿') + (stationInfo.now ? ' · 방송 중' : ''); }
  else { b.classList.add('bad'); t.textContent = '방송 스테이션 꺼짐'; }
}

/* ================= 음성 ================= */
const synthOK = 'speechSynthesis' in window;
let voices = [];
function loadVoices() {
  voices = synthOK ? speechSynthesis.getVoices() : [];
  const ko = voices.filter(v => /^ko/i.test(v.lang));
  const list = ko.length ? ko : voices;
  const sel = $('#voiceSel');
  sel.innerHTML = list.length ? list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)}${/natural|online|enhanced|premium/i.test(v.name) ? ' ★' : ''}</option>`).join('') : '<option value="">기본 음성</option>';
  if (!settings.voice || !list.some(v => v.voiceURI === settings.voice)) {
    const best = ko.find(v => /natural|online|enhanced|premium/i.test(v.name)) || ko[0];
    if (best) settings.voice = best.voiceURI;
  }
  sel.value = settings.voice;
  const w = $('#voiceWarn');
  if (!synthOK) { w.hidden = false; w.textContent = '이 브라우저는 음성 합성을 지원하지 않습니다. Chrome이나 Edge, Safari 최신 버전으로 열어 주세요.'; }
  else if (voices.length && !ko.length) { w.hidden = false; w.textContent = '이 기기에 한국어 음성이 없습니다. 기기 설정의 음성(TTS)에서 한국어를 추가해 주세요.'; }
  else w.hidden = true;
}
if (synthOK) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; setTimeout(loadVoices, 800); } else loadVoices();
const koVoice = () => voices.find(v => v.voiceURI === settings.voice) || voices.find(v => /^ko/i.test(v.lang));
const enVoice = () => voices.find(v => /^en/i.test(v.lang) && /natural|online|enhanced/i.test(v.name)) || voices.find(v => /^en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));

let actx;
function unlockAudio() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {}
  if (synthOK) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }
}
function chime(dir) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const notes = dir === 'down' ? [783.99, 659.25, 523.25] : [523.25, 659.25, 783.99];
    const t0 = actx.currentTime + .05;
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), st = t0 + i * .36;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(.32 * settings.volume, st + .02);
      g.gain.exponentialRampToValueAtTime(.001, st + 1.1);
      o.connect(g).connect(actx.destination); o.start(st); o.stop(st + 1.2);
    });
  } catch (e) { return Promise.resolve(); }
  return wait(1500);
}
function speakOne(text, voice, lang) {
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang;
    u.rate = settings.rate; u.pitch = settings.pitch; u.volume = settings.volume;
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin; speechSynthesis.speak(u);
    setTimeout(fin, Math.max(8000, text.length * 260 / settings.rate)); // 일부 브라우저의 onend 누락 대비
  });
}
let runId = 0;
async function speak(text, voice, lang, id, item) {
  const parts = text.split(/(?<=[.!?。])\s+/).filter(Boolean); // 긴 문장 끊김 방지
  for (const p of parts) { if (id !== runId) return; markNow(item, p); await speakOne(p, voice, lang); }
}

/* 실제 송출 (스테이션 또는 이 기기 전용 모드). 끝까지 방송하면 true */
let playing = false;
async function play(item, source, from) {
  if (!synthOK) { toast('이 브라우저에서는 음성 방송을 할 수 없습니다.'); return false; }
  const id = ++runId; speechSynthesis.cancel();
  playing = true; setNow(item, true); writeLog(item.title, source, from); beat();
  try {
    for (let r = 0; r < settings.repeat; r++) {
      if (settings.chime) { await chime('up'); if (id !== runId) return false; }
      await speak(item.ko, koVoice(), 'ko-KR', id, item); if (id !== runId) return false;
      if (settings.multi && item.en) { await wait(400); await speak(item.en, enVoice(), 'en-US', id, { ko: item.en }); if (id !== runId) return false; }
      if (r < settings.repeat - 1) await wait(700);
    }
    if (settings.chime) await chime('down');
    return id === runId;
  } finally {
    if (id === runId) { playing = false; setNow(null, false); beat(); }
  }
}
function cutCurrent() { runId++; if (synthOK) speechSynthesis.cancel(); playing = false; setNow(null, false); }

/* ================= 방송 대기열 (스테이션) ================= */
let queue = [], busy = false;
function enqueue(job) {
  if (job.item.cat === 'emergency') {          // 긴급 방송은 끼어들기
    queue.unshift(job);
    if (busy) cutCurrent();
  } else queue.push(job);
  renderQueue(); pump();
}
async function pump() {
  if (busy) return;
  const job = queue.shift(); renderQueue();
  if (!job) return;
  busy = true;
  if (job.ref) job.ref.update({ status: 'playing', by: devName });
  const ok = await play(job.item, job.source, job.from);
  if (job.ref) job.ref.update({ status: ok ? 'done' : 'stopped' });
  busy = false; pump();
}
function stopEverything() {
  queue.forEach(j => j.ref && j.ref.update({ status: 'stopped' }));
  queue = []; renderQueue(); cutCurrent();
}
function renderQueue() {
  const q = $('#queueInfo');
  q.hidden = !queue.length;
  q.textContent = queue.length ? `대기 중인 방송 ${queue.length}건: ` + queue.map(j => j.item.title).join(', ') : '';
}

/* ================= 방송 요청 (모든 기기 공통 진입점) ================= */
function requestBroadcast(item, source) {
  const payload = { title: item.title, ko: item.ko, en: item.en || '', cat: item.cat || 'ops' };
  // 이 기기에서 바로 송출하는 경우
  if (!cloud() || (isStation && stationStarted)) { enqueue({ item: payload, source, from: devName }); return; }
  if (isStation && !stationStarted) { $('#unlock').hidden = false; toast('먼저 "방송 스테이션 시작"을 눌러 주세요.'); return; }
  // 리모컨 → 스테이션으로 요청
  if (!stationOnline()) toast('방송 스테이션이 꺼져 있습니다. 요청은 보내지만 30초 안에 응답이 없으면 취소됩니다.');
  const ref = root.child('requests').push();
  ref.set({ ...payload, source, from: devName, createdAt: TS(), status: 'pending' });
  const h = ref.child('status').on('value', s => {
    const v = s.val();
    if (v === 'queued') toast('방송 대기열에 들어갔습니다: ' + item.title);
    else if (v === 'playing') toast('방송 중: ' + item.title);
    else if (v === 'done' || v === 'stopped' || v === 'expired') {
      if (v === 'done') toast('방송 완료: ' + item.title);
      if (v === 'stopped') toast('방송이 중지되었습니다: ' + item.title);
      ref.child('status').off('value', h);
    }
  });
  setTimeout(() => ref.child('status').once('value', s => {
    if (s.val() === 'pending') { ref.update({ status: 'expired' }); toast('방송 스테이션이 응답하지 않아 요청을 취소했습니다. 태블릿 화면을 확인해 주세요.'); }
  }), 30000);
  if (!stationOnline()) return;
  toast('방송 요청을 보냈습니다: ' + item.title);
}
function requestStop() {
  if (!cloud() || (isStation && stationStarted)) { stopEverything(); toast('방송을 중지했습니다.'); return; }
  root.child('control/stop').set(TS()); toast('중지 요청을 보냈습니다.');
}

/* ================= 스테이션 동작 ================= */
let stationStarted = false, beatTimer = null, wakeLock = null, stationRefs = [];
function beat() {
  if (!cloud() || !isStation || !stationStarted) return;
  root.child('station').update({ dev: devId, name: devName, hb: TS(), now: playing ? ($('#nowTitle').textContent || '') : '' });
}
async function keepAwake() {
  try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); } } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && stationStarted) keepAwake(); });

function startStation() {
  unlockAudio(); keepAwake();
  stationStarted = true; $('#unlock').hidden = true;
  if (cloud()) {
    root.child('station').set({ dev: devId, name: devName, hb: TS(), now: '' });
    root.child('station/hb').onDisconnect().set(0);
    clearInterval(beatTimer); beatTimer = setInterval(beat, 15000);
    const startedAt = serverNow();
    // 새 방송 요청 받기 (2분 넘은 요청은 무시)
    const reqRef = root.child('requests').orderByChild('createdAt').startAt(startedAt - 120000);
    const onReq = snap => {
      const r = snap.val(); if (!r || r.status !== 'pending') return;
      if (serverNow() - (r.createdAt || 0) > 120000) { snap.ref.update({ status: 'expired' }); return; }
      snap.ref.update({ status: 'queued' });
      enqueue({ item: { title: r.title, ko: r.ko, en: r.en, cat: r.cat }, source: r.source || '원격', from: r.from || '', ref: snap.ref });
    };
    reqRef.on('child_added', onReq); stationRefs.push([reqRef, 'child_added', onReq]);
    // 원격 중지
    let firstStop = true; const stopRef = root.child('control/stop');
    const onStop = s => { if (firstStop) { firstStop = false; return; } if (s.val()) { stopEverything(); toast('원격 중지 요청으로 방송을 멈췄습니다.'); } };
    stopRef.on('value', onStop); stationRefs.push([stopRef, 'value', onStop]);
    // 오래된 요청·기록 정리
    root.child('requests').orderByChild('createdAt').endAt(startedAt - 86400000).once('value', s => s.forEach(c => { c.ref.remove(); }));
    root.child('log').orderByChild('at').endAt(startedAt - 7 * 86400000).once('value', s => s.forEach(c => { c.ref.remove(); }));
  }
  updateConn(); renderRole(); toast('방송 스테이션을 시작했습니다. 이 화면을 켜 둔 채로 두세요.');
}
function stopStation() {
  stationStarted = false; clearInterval(beatTimer);
  stationRefs.forEach(([r, e, f]) => r.off(e, f)); stationRefs = [];
  try { wakeLock && wakeLock.release(); } catch (e) {}
  stopEverything(); updateConn(); renderRole();
}
$('#unlockBtn').onclick = startStation;

/* ================= 송출 화면 ================= */
let nowItem = null;
function setNow(item, live) {
  $('#onair').classList.toggle('live', live);
  $('#lampTxt').textContent = live ? 'ON AIR' : 'STANDBY';
  nowItem = item;
  if (live && item) { $('#nowTitle').textContent = item.title; $('#nowText').textContent = item.ko; }
  else {
    $('#nowTitle').textContent = '방송 대기 중';
    $('#nowText').textContent = log.length ? `마지막 방송: ${fmtTime(log[0].at)} ${log[0].title}` : '멘트를 고르면 차임과 함께 방송이 시작됩니다.';
  }
  updateStopBtn();
}
function updateStopBtn() {
  const remoteLive = cloud() && !isStation && stationInfo && stationInfo.now;
  const can = !!(playing || queue.length || remoteLive);
  $('#stopBtn').disabled = !can; $('#mStop').disabled = !can;
  $('#stopBtn').textContent = (cloud() && !isStation) ? '■ 스테이션 방송 중지' : '■ 방송 중지';
  updateMbar();
}
/* 휴대폰·태블릿 세로 화면 하단 고정 바 */
function updateMbar() {
  const bar = $('#mbar'), txt = $('#mTxt');
  if (!bar) return;
  const remote = cloud() && !isStation;
  let live = false, text = '방송 대기 중';
  if (playing && nowItem) { live = true; text = '방송 중 · ' + nowItem.title; }
  else if (remote && stationInfo && stationInfo.now && stationOnline()) { live = true; text = '스테이션 방송 중 · ' + stationInfo.now; }
  else if (remote) { text = stationOnline() ? '대기 중 · ' + (stationInfo.name || '방송 스테이션') : '방송 스테이션 꺼짐'; bar.classList.toggle('off', !stationOnline()); }
  if (queue.length) text += ` (대기 ${queue.length})`;
  bar.classList.toggle('live', live);
  if (!remote) bar.classList.remove('off');
  txt.textContent = text;
}
function markNow(item, sentence) {
  if (!item) return; const full = item.ko; const i = full.indexOf(sentence);
  $('#nowText').innerHTML = i < 0 ? esc(full) : esc(full.slice(0, i)) + '<mark>' + esc(sentence) + '</mark>' + esc(full.slice(i + sentence.length));
}
const fmtTime = at => { const d = new Date(at || Date.now()); return hm(d); };
function writeLog(title, source, from) {
  if (cloud()) { root.child('log').push({ at: TS(), title, source, from: from || devName }); return; }
  log.unshift({ at: Date.now(), title, source, from: from || devName }); log = log.slice(0, 40); save('pa_log_v2', log); renderLog();
}
function renderLog() {
  $('#logList').innerHTML = log.length ? log.map(l => `<li><time>${fmtTime(l.at)}</time><span>${esc(l.title)}</span><small>${esc(l.source || '')}${l.from ? ' · ' + esc(l.from) : ''}</small></li>`).join('')
    : '<li style="display:block;border:0" class="hint">아직 방송 기록이 없습니다.</li>';
}

/* ================= 멘트 목록 ================= */
function renderFilters() {
  $('#filters').innerHTML = Object.entries(CATS).map(([k, v]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${filter === k}">${v}</button>`).join('');
}
function renderLib() {
  const items = lib.filter(x => filter === 'all' || x.cat === filter);
  $('#lib').innerHTML = items.map(x => `<div class="card c-${esc(x.cat)}" role="button" tabindex="0" data-play="${esc(x.id)}" aria-label="${esc(x.title)} 방송">
    <span class="t">${esc(x.title)}</span><span class="p">${esc(x.ko)}</span>
    <span class="meta"><span class="tag">${CATS[x.cat] || ''}</span>${x.en ? '<span class="en">EN</span>' : ''}</span>
    <button type="button" class="edit" data-edit="${esc(x.id)}" aria-label="${esc(x.title)} 수정">✎</button></div>`).join('') || '<p class="hint">이 분류에는 멘트가 없습니다.</p>';
}
$('#filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; renderFilters(); renderLib(); });
$('#lib').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]'); if (ed) { e.stopPropagation(); openModal(ed.dataset.edit); return; }
  const c = e.target.closest('[data-play]'); if (c) { const it = lib.find(x => x.id === c.dataset.play); if (it) requestBroadcast(it, '수동'); }
});
$('#lib').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-play]')) { e.preventDefault(); e.target.click(); } });

/* 멘트 수정 창 */
let editing = null;
function openModal(id) {
  editing = lib.find(x => x.id === id); if (!editing) return;
  $('#mName').value = editing.title; $('#mCat').value = editing.cat; $('#mKo').value = editing.ko; $('#mEn').value = editing.en || '';
  $('#modal').hidden = false;
}
const closeModal = () => { $('#modal').hidden = true; editing = null; };
$('#mCancel').onclick = closeModal;
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
$('#mPlay').onclick = () => { unlockAudio(); play({ title: $('#mName').value || '미리 듣기', ko: $('#mKo').value, en: $('#mEn').value }, '미리듣기'); };
$('#mSave').onclick = () => {
  if (!$('#mKo').value.trim()) { toast('한국어 멘트를 입력해 주세요.'); return; }
  Object.assign(editing, { title: $('#mName').value.trim() || '이름 없는 멘트', cat: $('#mCat').value, ko: $('#mKo').value.trim(), en: $('#mEn').value.trim() });
  saveLib(); renderLib(); renderSched(); closeModal(); toast('멘트를 저장했습니다.');
};
$('#mDel').onclick = () => {
  const b = $('#mDel');
  if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = '한 번 더 누르면 삭제'; setTimeout(() => { b.dataset.confirm = ''; b.textContent = '삭제'; }, 3000); return; }
  lib = lib.filter(x => x !== editing); saveLib(); renderLib(); renderSched();
  b.dataset.confirm = ''; b.textContent = '삭제'; closeModal(); toast('멘트를 삭제했습니다.');
};

/* ================= 템플릿 ================= */
function renderTpl() {
  $('#tplPick').innerHTML = TEMPLATES.map(t => `<button type="button" class="chip" data-t="${t.id}" aria-pressed="${t.id === tplId}">${t.title}</button>`).join('');
  const t = TEMPLATES.find(x => x.id === tplId);
  if (!tplVals[tplId]) tplVals[tplId] = Object.fromEntries(t.fields.map(f => [f[0], f[2]]));
  $('#tplFields').innerHTML = t.fields.map(([k, l]) => `<label class="f" for="tf-${k}">${l}<input type="text" id="tf-${k}" data-k="${k}" value="${esc(tplVals[tplId][k])}"></label>`).join('');
  updTpl();
}
function updTpl() { const t = TEMPLATES.find(x => x.id === tplId); $('#tplPreview').textContent = t.build(tplVals[tplId]); }
$('#tplPick').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { tplId = b.dataset.t; renderTpl(); } });
$('#tplFields').addEventListener('input', e => { const k = e.target.dataset.k; if (k) { tplVals[tplId][k] = e.target.value; updTpl(); } });
$('#tplGo').onclick = () => { const t = TEMPLATES.find(x => x.id === tplId); requestBroadcast({ title: t.title, ko: t.build(tplVals[tplId]), en: '', cat: 'ops' }, '템플릿'); };

/* ================= 직접 입력 ================= */
$('#freeGo').onclick = () => {
  const ko = $('#freeKo').value.trim(); if (!ko) { toast('방송할 멘트를 입력해 주세요.'); return; }
  requestBroadcast({ title: $('#freeTitle').value.trim() || '직접 입력 멘트', ko, en: $('#freeEn').value.trim(), cat: $('#freeCat').value }, '직접입력');
};
$('#freeSave').onclick = () => {
  const ko = $('#freeKo').value.trim(); if (!ko) { toast('저장할 멘트를 입력해 주세요.'); return; }
  lib.push({ id: 'u' + rid(), cat: $('#freeCat').value, title: $('#freeTitle').value.trim() || '새 멘트', ko, en: $('#freeEn').value.trim() });
  saveLib(); renderLib(); renderSched(); toast('즉시 방송 목록에 추가했습니다.');
};

/* ================= 시즌·시간표 ================= */
function renderSeason() {
  document.querySelectorAll('.season button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === season));
  renderSched();
}
document.querySelector('.season').addEventListener('click', e => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  season = b.dataset.s; saveSeason(); renderSeason();
  toast(season === 'closed' ? '정기휴장: 자동 방송을 하지 않습니다.' : (season === 'gold' ? '골드시즌' : '일반 운영') + ' 시간표로 바꿨습니다.');
});
function renderSched() {
  const area = $('#schedArea');
  $('#addRow').hidden = season === 'closed';
  if (season === 'closed') {
    area.innerHTML = '<div class="note">정기휴장일입니다. 자동 방송이 나가지 않습니다. 점검 중 필요한 안내는 즉시 방송이나 직접 입력으로 해 주세요.</div>';
    $('#schedHint').textContent = ''; updNext(); return;
  }
  $('#schedHint').textContent = (season === 'gold' ? '골드시즌' : '일반 운영') + ' 시간표입니다. 바꾸면 바로 저장되고 모든 기기에 반영됩니다.';
  const rows = (sched[season] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const now = hm(new Date()); const nextK = (rows.find(r => r.on && r.time > now) || {}).k;
  const opts = id => lib.map(x => `<option value="${esc(x.id)}"${x.id === id ? ' selected' : ''}>[${CATS[x.cat] || ''}] ${esc(x.title)}</option>`).join('') + (lib.some(x => x.id === id) ? '' : '<option value="" selected>삭제된 멘트</option>');
  area.innerHTML = `<div class="sched-wrap"><table class="sched"><thead><tr><th>시간</th><th>방송 멘트</th><th style="text-align:center">사용</th><th></th></tr></thead><tbody>${
    rows.map(r => `<tr data-k="${esc(r.k)}" class="${r.k === nextK ? 'upcoming' : (r.time <= now ? 'done' : '')}">
      <td class="tm"><input type="time" id="st-${esc(r.k)}" data-fld="time" value="${esc(r.time)}" aria-label="방송 시간"></td>
      <td><select id="ss-${esc(r.k)}" data-fld="id" aria-label="방송 멘트">${opts(r.id)}</select></td>
      <td class="on"><input type="checkbox" id="sc-${esc(r.k)}" data-fld="on" ${r.on ? 'checked' : ''} aria-label="사용"></td>
      <td class="del"><button type="button" class="edit" style="position:static" data-del="${esc(r.k)}" aria-label="삭제">✕</button></td></tr>`).join('')
  }</tbody></table></div>`;
  updNext();
}
$('#schedArea').addEventListener('change', e => {
  const tr = e.target.closest('tr[data-k]'); if (!tr) return;
  const r = sched[season].find(x => x.k === tr.dataset.k); if (!r) return;
  const f = e.target.dataset.fld; r[f] = f === 'on' ? e.target.checked : e.target.value;
  saveSched(); renderSched();
});
$('#schedArea').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  sched[season] = sched[season].filter(x => x.k !== b.dataset.del); saveSched(); renderSched();
});
$('#addRow').onclick = () => {
  const d = new Date(Date.now() + 10 * 60000);
  (sched[season] = sched[season] || []).push({ k: rid(), time: hm(d), id: lib[0] ? lib[0].id : '', on: true });
  saveSched(); renderSched();
};
$('#autoSw').onclick = () => {
  autoOn = !autoOn; save('pa_auto', autoOn); renderRole();
  if (autoOn) unlockAudio();
  toast(autoOn ? '자동 방송을 켰습니다.' : '자동 방송을 껐습니다.');
};
function runsSchedule() { return !cloud() || (isStation && stationStarted); }
function renderRole() {
  const role = $('#schedRole'), sw = $('#autoSw');
  sw.setAttribute('aria-checked', autoOn); $('#autoLbl').textContent = autoOn ? '자동 방송 켜짐' : '자동 방송 꺼짐';
  if (cloud() && !isStation) {
    role.hidden = false;
    role.textContent = '자동 방송은 방송 스테이션(태블릿)에서 실행됩니다. 여기서 시간표를 고치면 스테이션에 바로 반영됩니다.';
    sw.disabled = true;
  } else if (cloud() && isStation && !stationStarted) {
    role.hidden = false; role.textContent = '"방송 스테이션 시작"을 누르면 자동 방송이 시작됩니다.'; sw.disabled = false;
  } else {
    role.hidden = !cloud() ? false : true;
    role.textContent = cloud() ? '' : '이 기기 전용 모드입니다. 화면이 열려 있는 동안 자동 방송이 나갑니다.';
    sw.disabled = false;
  }
  $('#voicePanel').style.opacity = (cloud() && !isStation) ? .75 : 1;
  updateStopBtn(); updNext();
}
function updNext() {
  const el = $('#nextInfo');
  if (season === 'closed') { el.textContent = '휴장일: 자동 방송 없음'; return; }
  const now = hm(new Date());
  const r = (sched[season] || []).filter(x => x.on && x.time > now).sort((a, b) => a.time.localeCompare(b.time))[0];
  const it = r && lib.find(x => x.id === r.id);
  el.innerHTML = it ? `다음 방송 <b>${esc(r.time)}</b> ${esc(it.title)}` : '오늘 남은 자동 방송이 없습니다';
}

/* ================= 시계·자동 방송 ================= */
let lastMin = '';
const fired = new Set();
setInterval(() => {
  const d = new Date();
  $('#clock').textContent = hm(d) + ':' + pad(d.getSeconds());
  const m = hm(d);
  if (m !== lastMin) { lastMin = m; if (!$('#p-sched').hidden) renderSched(); else updNext(); updateConn(); updateStopBtn(); }
  if (!autoOn || season === 'closed' || !runsSchedule()) return;
  const day = d.toDateString();
  (sched[season] || []).forEach(r => {
    if (r.on && r.time === m) {
      const key = day + r.time + r.k;
      if (!fired.has(key)) { fired.add(key); const it = lib.find(x => x.id === r.id); if (it) enqueue({ item: it, source: '자동', from: devName }); }
    }
  });
}, 1000);
setInterval(() => { updateConn(); updateStopBtn(); }, 5000);

/* ================= 탭 ================= */
function selectTab(b) {
  document.querySelectorAll('[role=tab]').forEach(t => { const sel = t === b; t.setAttribute('aria-selected', sel); $('#' + t.getAttribute('aria-controls')).hidden = !sel; });
  if (b.id === 't-sched') renderSched();
}
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) selectTab(b); });

/* ================= 음성 설정 ================= */
const persistSet = () => save('pa_set_v2', settings);
function bindRange(id, key, fmt) {
  const el = $('#' + id), o = $('#' + id + 'O'); el.value = settings[key]; o.textContent = fmt(settings[key]);
  el.addEventListener('input', () => { settings[key] = parseFloat(el.value); o.textContent = fmt(settings[key]); persistSet(); });
}
bindRange('rate', 'rate', v => v.toFixed(2)); bindRange('pitch', 'pitch', v => v.toFixed(2)); bindRange('vol', 'volume', v => Math.round(v * 100));
$('#chime').checked = settings.chime; $('#multi').checked = settings.multi;
$('#chime').onchange = e => { settings.chime = e.target.checked; persistSet(); };
$('#multi').onchange = e => { settings.multi = e.target.checked; persistSet(); };
$('#voiceSel').onchange = e => { settings.voice = e.target.value; persistSet(); };
function renderRepeat() { document.querySelectorAll('#repeatSeg button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.r === settings.repeat)); }
$('#repeatSeg').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { settings.repeat = +b.dataset.r; persistSet(); renderRepeat(); } });
$('#testVoice').onclick = () => { unlockAudio(); play({ title: '음성 테스트', ko: '안내 방송 음성 테스트입니다. 지금 들리는 목소리와 속도를 확인해 주세요.', en: '' }, '테스트'); };
$('#stopBtn').onclick = requestStop;
$('#mStop').onclick = requestStop;

/* ================= 연결 설정 창 ================= */
let pendingStation = false;
function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'WP-';
  const r = new Uint32Array(8); crypto.getRandomValues(r); r.forEach(n => s += A[n % A.length]); return s;
}
function openSettings() {
  $('#sCode').value = stationCode; $('#sName').value = devName;
  pendingStation = isStation; $('#sStation').setAttribute('aria-checked', pendingStation);
  $('#sWarn').hidden = true; delete $('#sSave').dataset.force;
  const st = $('#sStatus');
  if (!cloudReady) st.textContent = 'Firebase 설정(firebase-config.js)이 아직 비어 있습니다. 지금은 이 기기에서만 동작합니다. 설치 가이드의 2단계를 먼저 진행해 주세요.';
  else if (!stationCode) st.textContent = '처음 사용하시면 "새 코드 만들기"를 누르세요. 다른 기기에는 같은 코드를 입력하거나 "연결 링크 복사"로 링크를 보내 주세요.';
  else st.textContent = '현재 업장 코드: ' + stationCode + (stationOnline() ? ` · 방송 스테이션: ${stationInfo.name}` : ' · 방송 스테이션이 꺼져 있습니다');
  $('#setModal').hidden = false;
}
$('#connBtn').onclick = openSettings;
$('#sCancel').onclick = () => { $('#setModal').hidden = true; };
$('#sNewCode').onclick = () => { $('#sCode').value = genCode(); };
$('#sStation').onclick = () => { pendingStation = !pendingStation; $('#sStation').setAttribute('aria-checked', pendingStation); $('#sWarn').hidden = true; delete $('#sSave').dataset.force; };
$('#sCopyLink').onclick = async () => {
  const code = $('#sCode').value.trim().toUpperCase(); if (!code) { toast('먼저 업장 코드를 정해 주세요.'); return; }
  const link = location.origin + location.pathname + '?code=' + encodeURIComponent(code);
  try { await navigator.clipboard.writeText(link); toast('연결 링크를 복사했습니다. 다른 기기로 보내 주세요.'); }
  catch (e) { $('#sStatus').textContent = '연결 링크: ' + link; toast('복사가 안 되어 링크를 위에 표시했습니다.'); }
};
$('#sSave').onclick = async () => {
  const code = $('#sCode').value.trim().toUpperCase();
  if (cloudReady && code.length < 8) { $('#sWarn').hidden = false; $('#sWarn').textContent = '업장 코드는 8자 이상이어야 합니다. "새 코드 만들기"를 눌러 주세요.'; return; }
  // 다른 기기가 이미 스테이션이면 한 번 더 확인
  if (pendingStation && !isStation && code === stationCode && stationOnline() && stationInfo.dev !== devId && !$('#sSave').dataset.force) {
    $('#sWarn').hidden = false;
    $('#sWarn').textContent = `지금 "${stationInfo.name}"이(가) 방송 스테이션입니다. 이 기기로 바꾸면 그 기기는 리모컨이 됩니다. 계속하려면 "저장하고 연결"을 한 번 더 누르세요.`;
    $('#sSave').dataset.force = '1'; return;
  }
  devName = $('#sName').value.trim() || guessDevice(); save('pa_devname', devName);
  const codeChanged = code !== stationCode;
  const wasStation = isStation;
  stationCode = code; save('pa_code', code);
  isStation = pendingStation; save('pa_station', isStation);
  $('#setModal').hidden = true;
  if (wasStation && (!isStation || codeChanged)) {
    if (cloud() && stationInfo && stationInfo.dev === devId) root.child('station').set({ dev: '', name: '', hb: 0, now: '' });
    stopStation();
  }
  if (codeChanged || !cloud()) await connectCloud();
  if (isStation && !stationStarted) $('#unlock').hidden = false;
  if (isStation && stationStarted) beat();
  updateConn(); renderRole();
};

/* ================= 시작 ================= */
$('#freeTitle').value = '유수풀 정기 점검 안내';
$('#freeKo').value = '고객 여러분께 안내 말씀 드립니다. 잠시 후 오후 3시부터 유수풀 정기 점검이 10분간 진행됩니다. 이용에 참고해 주시기 바랍니다.';
$('#freeEn').value = 'Attention please. The lazy river will be closed for a 10-minute inspection starting at 3 p.m.';
renderFilters(); renderLib(); renderTpl(); renderSeason(); renderRepeat(); renderLog(); setNow(null, false); renderRole();
// 휴대폰(리모컨)에서는 자주 쓰는 호출·미아 템플릿 탭을 먼저 보여 주기
try { if (window.matchMedia('(max-width: 640px)').matches && !isStation) selectTab($('#t-tpl')); } catch (e) {}
if (!cloudReady && isStation) { /* 이 기기 전용 모드에서는 스테이션 개념 없음 */ }
if (!cloudReady) { $('#unlock').hidden = true; }
connectCloud();
if (!cloudReady) {
  // 이 기기 전용 모드: 첫 터치에서 소리 허용
  document.addEventListener('pointerdown', function once() { unlockAudio(); document.removeEventListener('pointerdown', once); });
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
