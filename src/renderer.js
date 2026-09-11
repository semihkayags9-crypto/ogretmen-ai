// renderer.js
// 1) Gerçek/çalıştırılabilir Python dersleri (bkz. PYTHON_LESSONS) sunar
// 2) Sohbet panelini (yazılı + sesli) AI köprüsüne bağlar
// (Blok Modu 2026-09-11'de kaldırıldı - "sadece python kalsın")

// ---------------------------------------------------------------
// 0. DİL (TR/EN) - kullanıcının açık isteği (2026-08-30): "İngilizceye
// çevirdim ama yazılar hâlâ Türkçe" - önceden bu ayar SADECE mikrofonun
// dinlediği dili kontrol ediyordu, şimdi TÜM sabit arayüz metnini
// (butonlar, etiketler, blok adları, şablon adları) de kapsıyor. AI'nin
// KENDİ cevapları zaten çocuğun yazdığı dile göre otomatik değişiyor
// (main.js SYSTEM_PROMPT talimatı) - bu AYRI/EK bir katman, sadece
// SABIT arayüz metnini kapsar, geçmiş sohbet mesajlarını GERİYE DÖNÜK
// çevirmez (gerçek bir uygulamada da öyle olmaz).
// ---------------------------------------------------------------
let voiceLanguage = 'tr-TR';
try { voiceLanguage = localStorage.getItem('ogretmenai-voice-lang') || 'tr-TR'; } catch (e) {}

const UI_TEXT = {
  'tr-TR': {
    templateLabel: '🗺️ Şablon:',
    runBtn: '▶ Çalıştır',
    runHint: 'Blokları sürükleyip bırak, sonra Çalıştır\'a bas!',
    noBlocks: 'Önce birkaç blok yerleştirmelisin!',
    goalReachedMsg: '🎉 Hedefe ulaştın!',
    goalReachedLog: '🎉 Hedefe ulaşıldı!',
    bumpLog: '🚧 Karakter kenara çarptı, ilerleyemedi.',
    obstacleAheadLog: '🧱 Önünde bir engel var — üstünden atlaman gerekebilir!',
    forwardLog: '➡️  Karakter ileri gitti.',
    turnLog: '🔄  Karakter döndü.',
    jumpObstacleLog: '⬆️  Karakter zıplayıp engeli aştı!',
    jumpLog: '⬆️  Karakter zıpladı!',
    blockForward: 'ileri git',
    blockForwardTooltip: 'Karakteri bir adım ileri hareket ettirir',
    blockTurn: 'dön',
    blockTurnTooltip: 'Karakteri döndürür',
    blockJump: 'zıpla',
    blockJumpTooltip: 'Karakteri zıplatır',
    blockRepeatPrefix: 'şunu',
    blockRepeatSuffix: 'kere tekrarla',
    blockRepeatTooltip: 'İçindeki blokları belirtilen sayıda tekrarlar',
    blockIfObstacle: 'eğer önünde engel varsa',
    blockIfObstacleTooltip: 'İçindeki blokları SADECE karakterin hemen önünde bir engel varsa çalıştırır',
    ifObstacleYesLog: '🔍 Önünde engel var, içindekini çalıştırıyorum.',
    ifObstacleNoLog: '🔍 Önünde engel yok, atlıyorum.',
    chatHeaderTitle: '🧑‍🏫 Öğretmen AI',
    showRobotBtn: '🤖 Aven’i Göster',
    apiKeyBtn: '⚙ API Anahtarı',
    apiKeyBtnConfigured: '⚙ API Anahtarı ✓',
    apiKeyBtnTitleConfigured: 'API anahtarı kayıtlı — değiştirmek için tıkla',
    apiKeyBtnTitleUnconfigured: 'Groq API anahtarını gir',
    hideRobotBtnTitle: 'Aven’i gizle',
    teacherStageLabel: 'Aven öğretmen',
    avenRobotAlt: 'Aven öğretmen robotu',
    teacherGreetingBubble: 'Merhaba! Birlikte kodlamayı öğrenelim.',
    micBtnStart: '🎤 Konuş',
    micBtnStartTitle: 'Aven ile sesli konuşmayı başlat',
    micBtnStop: '⏹ Durdur',
    micBtnStopTitle: 'Sesli sohbeti durdur',
    chatInputPlaceholder: 'Bir şey sor...',
    sendBtn: 'Gönder',
    apiKeyDialogTitle: 'Groq API Anahtarı',
    apiKeyDialogDesc: 'Anahtar sadece bu bilgisayardaki .env dosyasına kaydedilir. Anahtarını kimseyle paylaşma.',
    apiKeyInputLabel: 'API anahtarı',
    cancelBtn: 'Vazgeç',
    saveBtn: 'Kaydet',
    apiKeySavedMsg: 'API anahtarı kaydedildi. Artık sorularını yanıtlayabilirim!',
    apiKeySaveFailed: 'Anahtar kaydedilemedi.',
    micPermissionMsg: 'Aven’in seni duyabilmesi için mikrofon izni vermen gerekiyor.',
    micPermissionMsg2: 'Mikrofonu kullanabilmem için izin vermen gerekiyor.',
    wakeWordHeard: '(uyandırma kelimesi duyuldu: "Aven")',
    initialGreeting: 'Merhaba! Ben Aven, senin kodlama öğretmenin. “Aven” dersen ya da “Konuş” düğmesine basarsan seninle sesli konuşmaya başlarım.',
    voiceLangBtnLabel: '🌐 TR',
    voiceLangBtnTitle: 'Mikrofon ve arayüz şu an Türkçe - İngilizce\'ye geçmek için tıkla',
    blockModeTabLabel: '🧱 Blok Modu',
    pythonModeTabLabel: '🐍 Python Modu',
    pythonLessonLabel: '🐍 Ders:',
    pythonRunBtn: '▶ Çalıştır',
    pythonRunHint: 'Kodu değiştir, sonra Çalıştır\'a bas!',
    pythonInstalling: 'Python indiriliyor, biraz bekle...',
    pythonInstallFailed: 'Python indirilemedi - internet bağlantını kontrol edip tekrar dene.',
    pythonNotWindows: 'Bu özellik şu an sadece Windows sürümünde otomatik kuruluyor.',
    pythonRanOk: '[Kodu çalıştırdım] Çıktı:',
    pythonRanEmptyOk: '[Kodu çalıştırdım] Çalıştı ama ekrana bir şey yazdırmadı.',
    pythonRanError: '[Kodu çalıştırdım] Hata oluştu:',
    pythonTimedOut: '[Kodu çalıştırdım] Kod çok uzun sürdü, durdurdum - muhtemelen bitmeyen bir döngü var.'
  },
  'en-US': {
    templateLabel: '🗺️ Template:',
    runBtn: '▶ Run',
    runHint: 'Drag and drop blocks, then press Run!',
    noBlocks: 'You need to place a few blocks first!',
    goalReachedMsg: '🎉 You reached the goal!',
    goalReachedLog: '🎉 Goal reached!',
    bumpLog: '🚧 The character hit the edge and could not move.',
    obstacleAheadLog: '🧱 There is an obstacle ahead — you may need to jump over it!',
    forwardLog: '➡️  The character moved forward.',
    turnLog: '🔄  The character turned.',
    jumpObstacleLog: '⬆️  The character jumped over the obstacle!',
    jumpLog: '⬆️  The character jumped!',
    blockForward: 'move forward',
    blockForwardTooltip: 'Moves the character one step forward',
    blockTurn: 'turn',
    blockTurnTooltip: 'Turns the character',
    blockJump: 'jump',
    blockJumpTooltip: 'Makes the character jump',
    blockRepeatPrefix: 'repeat this',
    blockRepeatSuffix: 'times',
    blockRepeatTooltip: 'Repeats the blocks inside a set number of times',
    blockIfObstacle: 'if obstacle ahead',
    blockIfObstacleTooltip: 'Runs the blocks inside ONLY IF there is an obstacle right in front of the character',
    ifObstacleYesLog: '🔍 There is an obstacle ahead, running what\'s inside.',
    ifObstacleNoLog: '🔍 No obstacle ahead, skipping.',
    chatHeaderTitle: '🧑‍🏫 Teacher AI',
    showRobotBtn: '🤖 Show Aven',
    apiKeyBtn: '⚙ API Key',
    apiKeyBtnConfigured: '⚙ API Key ✓',
    apiKeyBtnTitleConfigured: 'API key saved — click to change it',
    apiKeyBtnTitleUnconfigured: 'Enter your Groq API key',
    hideRobotBtnTitle: 'Hide Aven',
    teacherStageLabel: 'Aven the teacher',
    avenRobotAlt: 'Aven the teacher robot',
    teacherGreetingBubble: 'Hi! Let\'s learn to code together.',
    micBtnStart: '🎤 Talk',
    micBtnStartTitle: 'Start talking with Aven',
    micBtnStop: '⏹ Stop',
    micBtnStopTitle: 'Stop the voice chat',
    chatInputPlaceholder: 'Ask something...',
    sendBtn: 'Send',
    apiKeyDialogTitle: 'Groq API Key',
    apiKeyDialogDesc: 'The key is only saved to the .env file on this computer. Don\'t share your key with anyone.',
    apiKeyInputLabel: 'API key',
    cancelBtn: 'Cancel',
    saveBtn: 'Save',
    apiKeySavedMsg: 'API key saved. I can answer your questions now!',
    apiKeySaveFailed: 'Could not save the key.',
    micPermissionMsg: 'I need microphone permission so Aven can hear you.',
    micPermissionMsg2: 'I need permission to use the microphone.',
    wakeWordHeard: '(wake word heard: "Aven")',
    initialGreeting: 'Hi! I\'m Aven, your coding teacher. Say "Aven" or press the "Talk" button and I\'ll start talking with you.',
    voiceLangBtnLabel: '🌐 EN',
    voiceLangBtnTitle: 'Microphone and interface are in English now - click to switch to Turkish',
    blockModeTabLabel: '🧱 Block Mode',
    pythonModeTabLabel: '🐍 Python Mode',
    pythonLessonLabel: '🐍 Lesson:',
    pythonRunBtn: '▶ Run',
    pythonRunHint: 'Change the code, then press Run!',
    pythonInstalling: 'Downloading Python, hang on...',
    pythonInstallFailed: 'Could not download Python - check your internet connection and try again.',
    pythonNotWindows: 'This feature is only auto-installed on the Windows version for now.',
    pythonRanOk: '[Ran the code] Output:',
    pythonRanEmptyOk: '[Ran the code] It ran but did not print anything.',
    pythonRanError: '[Ran the code] An error happened:',
    pythonTimedOut: '[Ran the code] It took too long, so I stopped it - probably a loop that never ends.'
  }
};

function uiText(key) { return (UI_TEXT[voiceLanguage] || UI_TEXT['tr-TR'])[key] || ''; }

// Butonlar/etiketler/blok adları gibi TÜM sabit arayüz metnini günceller -
// hem ilk açılışta (kaydedilmiş tercihle) hem TR/EN düğmesine her
// tıklandığında çağrılır.
function applyUILanguage() {
  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = uiText(key); };
  const setTitle = (id, key) => { const el = document.getElementById(id); if (el) el.title = uiText(key); };
  const setPlaceholder = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = uiText(key); };

  setText('showRobotBtn', 'showRobotBtn');
  setTitle('hideRobotBtn', 'hideRobotBtnTitle');
  setTitle('avenRobot', 'avenRobotAlt');
  const teacherStageEl = document.getElementById('teacherStage');
  if (teacherStageEl) teacherStageEl.setAttribute('aria-label', uiText('teacherStageLabel'));
  // Karsilama balonunu SADECE hala varsayilan/ilk karsilama metniyse guncelle
  // (statik HTML varsayilani YA DA addMessage'in yazdigi ilk "initialGreeting"
  // metni) - gercek bir sohbet cevabinin uzerine YAZMA (o zaten dogru dilde
  // geldi, gecmis mesajlar geriye donuk cevrilmez).
  const teacherSpeechEl = document.getElementById('teacherSpeech');
  if (teacherSpeechEl) {
    const isStillDefault = Object.values(UI_TEXT).some((d) =>
      d.teacherGreetingBubble === teacherSpeechEl.textContent || d.initialGreeting === teacherSpeechEl.textContent);
    if (isStillDefault) teacherSpeechEl.textContent = uiText('teacherGreetingBubble');
  }
  const chatHeaderSpan = document.querySelector('#chatHeader > span:first-child');
  if (chatHeaderSpan) chatHeaderSpan.textContent = uiText('chatHeaderTitle');
  setPlaceholder('chatInput', 'chatInputPlaceholder');
  setText('sendBtn', 'sendBtn');
  setText('apiKeyTitle', 'apiKeyDialogTitle');
  const apiKeyDesc = document.querySelector('#apiKeyForm p');
  if (apiKeyDesc) apiKeyDesc.textContent = uiText('apiKeyDialogDesc');
  const apiKeyLabel = document.querySelector('label[for="apiKeyInput"]');
  if (apiKeyLabel) apiKeyLabel.textContent = uiText('apiKeyInputLabel');
  setText('cancelApiKeyBtn', 'cancelBtn');
  setText('saveApiKeyBtn', 'saveBtn');

  const voiceBtn = document.getElementById('voiceLangBtn');
  if (voiceBtn) { voiceBtn.textContent = uiText('voiceLangBtnLabel'); voiceBtn.title = uiText('voiceLangBtnTitle'); }

  const pythonLessonLabel = document.querySelector('label[for="pythonLessonSelect"]');
  if (pythonLessonLabel) pythonLessonLabel.textContent = uiText('pythonLessonLabel');
  setText('pythonRunBtn', 'pythonRunBtn');
  setText('pythonRunHint', 'pythonRunHint');
  // Ders dropdown'ini yeni dilde yeniden olustur - SADECE acilmis (kilitli
  // olmayan) dersleri, secili dersi koruyarak (bkz. renderPythonLessonOptions).
  if (typeof renderPythonLessonOptions === 'function') {
    renderPythonLessonOptions(currentPythonLesson && currentPythonLesson.id);
  }

  if (typeof updateApiKeyButton === 'function') updateApiKeyButton();
  if (typeof micBtn !== 'undefined' && micBtn) {
    micBtn.innerText = voiceModeOn ? uiText('micBtnStop') : uiText('micBtnStart');
    micBtn.title = uiText('micBtnStartTitle');
  }

}

// ---------------------------------------------------------------
// 6. SOHBET PANELİ (yazılı + sesli)
// ---------------------------------------------------------------
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const apiKeyBtn = document.getElementById('apiKeyBtn');
const apiKeyDialog = document.getElementById('apiKeyDialog');
const apiKeyForm = document.getElementById('apiKeyForm');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const cancelApiKeyBtn = document.getElementById('cancelApiKeyBtn');
const teacherStage = document.getElementById('teacherStage');
const teacherSpeech = document.getElementById('teacherSpeech');
const teacherBubble = document.getElementById('teacherBubble');
const voiceWaveWrap = document.getElementById('voiceWaveWrap');
const voiceWaveCanvas = document.getElementById('voiceWaveCanvas');
const hideRobotBtn = document.getElementById('hideRobotBtn');
const showRobotBtn = document.getElementById('showRobotBtn');
const avenRobot = document.getElementById('avenRobot');

hideRobotBtn.addEventListener('click', () => {
  teacherStage.hidden = true;
  showRobotBtn.classList.add('visible');
});

showRobotBtn.addEventListener('click', () => {
  teacherStage.hidden = false;
  showRobotBtn.classList.remove('visible');
});

// Robot artik SUREKLI DONMUYOR (anlamsizdi) - varsayilan olarak hep direkt
// kameraya/kullaniciya bakar (model-viewer'in orientation'i ayarlanmadikca
// varsayilan yon budur). SADECE konusurken (isSpeaking) hafif, duzensiz bir
// bas cevirme/egme hareketi yapar - gercek dudak senkronu icin modelin
// (aven-robot.glb) hicbir agiz/cene animasyonu/morph target'i yok (kontrol
// edildi), bu yuzden "konusuyormus gibi" en dogal/ucuz gosterge budur.
// isSpeaking degisince dongu kendiliginden durur ve yuzu tekrar duz karsiya
// (0deg 0deg 0deg) doner.
function animateTalking(startTime) {
  if (!isSpeaking) { avenRobot.orientation = '0deg 0deg 0deg'; return; }
  const t = (performance.now() - startTime) / 1000;
  // Ogretmen gibi ANLATIYORMUS hissi icin: yavas/genis bas cevirme + hafif
  // one egilme (dinleyiciye donuk anlatan biri gibi) + cok hafif govde
  // yalpasi (roll) - hizli/kucuk titresim yerine daha "kasitli hareket eden"
  // bir tempo (dusuk frekans, buyuk genlik).
  const yaw = Math.sin(t * 3.2) * 10 + Math.sin(t * 1.1) * 4;
  const pitch = Math.sin(t * 2.6) * 5 + 2;
  const roll = Math.sin(t * 1.7) * 3;
  avenRobot.orientation = `${roll.toFixed(2)}deg ${pitch.toFixed(2)}deg ${yaw.toFixed(2)}deg`;
  requestAnimationFrame(() => animateTalking(startTime));
}

async function updateApiKeyButton() {
  const result = await window.ogretmenAPI.getApiKeyStatus();
  apiKeyBtn.innerText = result.configured ? uiText('apiKeyBtnConfigured') : uiText('apiKeyBtn');
  apiKeyBtn.title = result.configured ? uiText('apiKeyBtnTitleConfigured') : uiText('apiKeyBtnTitleUnconfigured');
}

apiKeyBtn.addEventListener('click', () => {
  apiKeyInput.value = '';
  apiKeyStatus.innerText = '';
  apiKeyDialog.showModal();
  apiKeyInput.focus();
});

cancelApiKeyBtn.addEventListener('click', () => apiKeyDialog.close());

apiKeyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const result = await window.ogretmenAPI.saveApiKey(apiKey);
  if (!result.ok) {
    apiKeyStatus.innerText = result.message || uiText('apiKeySaveFailed');
    return;
  }
  apiKeyDialog.close();
  updateApiKeyButton();
  addMessage(uiText('apiKeySavedMsg'), 'ai');
});

updateApiKeyButton();

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  // 'system': Python kodu calistirildiginda otomatik uretilen rapor - cocugun
  // GERCEKTEN yazdigi bir mesaj DEGIL, bu yuzden 🧒/🤖 onekiyle karistirmiyoruz.
  const prefix = who === 'user' ? '🧒 ' : who === 'ai' ? '🤖 ' : '';
  div.innerText = prefix + text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  if (who === 'ai') teacherSpeech.innerText = text;
}

// ---------------------------------------------------------------
// SESLİ SOHBET MODU (hands-free) — döngü şu şekilde çalışır:
// 1) "Sesli Sohbeti Başlat" ile mod açılır, dinleme başlar
// 2) Çocuk konuşur -> metne çevrilir -> AI'a gönderilir
// 3) AI cevabı hem yazılı hem sesli (TTS) gösterilir
// 4) TTS konuşması BİTTİĞİNDE dinleme otomatik olarak tekrar başlar
//    (TTS konuşurken dinleme kapalı tutulur, yoksa AI kendi sesini
//    duyup kendine cevap vermeye çalışabilir)
// 5) Mod kapatılana kadar bu döngü kendiliğinden devam eder
// ---------------------------------------------------------------

let voiceModeOn = false;   // sesli sohbet modu açık mı
let isSpeaking = false;    // AI şu an TTS ile konuşuyor mu
let microphoneStream = null;
let microphoneSetup = null;

// ---------------------------------------------------------------
// SESLİ MOD GÖRSEL DAVRANIŞI (2026-09-11, Semih: "sesli konuşmaya
// geçtiğimizde mesajların görünmemesini sağla, ses dalga efekti koy,
// sesi kapatınca sesli sohbetteki konuşmalar yazılı olarak görülebilir
// ama konuşurken değil") - mesajlar chatLog'dan hiç SİLİNMİYOR, addMessage
// eskisi gibi normal ekliyor; sadece CSS ile gizleniyor. Bu yüzden mod
// kapanınca TÜM sesli sohbet geçmişi ekstra bir buffer/senkron
// gerektirmeden otomatik olarak görünür hale geliyor.
// ---------------------------------------------------------------
const voiceWaveCtx = voiceWaveCanvas.getContext('2d');
let sharedAudioCtx = null;
let micAnalyser = null;
let ttsAnalyser = null;
let waveLoopRunning = false;

function getSharedAudioCtx() {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
  return sharedAudioCtx;
}

async function ensureMicAnalyser() {
  if (micAnalyser) return micAnalyser;
  if (!await prepareMicrophone()) return null;
  const ctx = getSharedAudioCtx();
  const source = ctx.createMediaStreamSource(microphoneStream);
  micAnalyser = ctx.createAnalyser();
  micAnalyser.fftSize = 256;
  source.connect(micAnalyser);
  return micAnalyser;
}

// speak() icinde AI'nin konusma sesi (Audio elementi) olusturulunca cagrilir -
// dalga GERCEK oynatma sesini yansitsin diye (sabit/sahte bir animasyon degil).
function attachTtsAnalyser(audioEl) {
  try {
    const ctx = getSharedAudioCtx();
    const source = ctx.createMediaElementSource(audioEl);
    ttsAnalyser = ctx.createAnalyser();
    ttsAnalyser.fftSize = 256;
    source.connect(ttsAnalyser);
    // createMediaElementSource baglaninca tarayici ses cikisini BU graph'a
    // yonlendirir - destination'a baglamazsak ses hoparlore hic gitmez,
    // sessizce kaybolur.
    ttsAnalyser.connect(ctx.destination);
  } catch (e) {
    ttsAnalyser = null;
  }
}

function drawVoiceWave() {
  if (!voiceModeOn) { waveLoopRunning = false; return; }
  requestAnimationFrame(drawVoiceWave);
  const analyser = (isSpeaking && ttsAnalyser) ? ttsAnalyser : micAnalyser;
  const w = voiceWaveCanvas.width, h = voiceWaveCanvas.height;
  voiceWaveCtx.clearRect(0, 0, w, h);
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const barCount = 28;
  const step = Math.max(1, Math.floor(data.length / barCount));
  const barWidth = w / barCount;
  voiceWaveCtx.fillStyle = isSpeaking ? '#3f6fd1' : '#e0546a';
  for (let i = 0; i < barCount; i++) {
    const v = data[i * step] / 255;
    const barH = Math.max(3, v * h);
    voiceWaveCtx.fillRect(i * barWidth + 1, (h - barH) / 2, barWidth - 2, barH);
  }
}

function setVoiceUiMode(on) {
  if (on) {
    chatLog.classList.add('voice-hidden');
    teacherBubble.classList.add('voice-hidden');
    voiceWaveWrap.classList.add('active');
    ensureMicAnalyser();
    if (!waveLoopRunning) { waveLoopRunning = true; requestAnimationFrame(drawVoiceWave); }
  } else {
    chatLog.classList.remove('voice-hidden');
    teacherBubble.classList.remove('voice-hidden');
    voiceWaveWrap.classList.remove('active');
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

async function prepareMicrophone() {
  if (microphoneStream?.active) return true;
  if (!navigator.mediaDevices?.getUserMedia) return true;

  if (!microphoneSetup) {
    microphoneSetup = navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    }).then((stream) => {
      microphoneStream = stream;
      return true;
    }).catch(() => {
      microphoneSetup = null;
      addMessage(uiText('micPermissionMsg'), 'ai');
      return false;
    });
  }
  return microphoneSetup;
}

// AnalyserNode ile basit enerji-tabanli ses aktivitesi algilama (VAD):
// konusma baslayana kadar bekler, basladiktan sonra `silenceMs` boyunca
// sessizlik olunca kaydi durdurur. `maxMs` bir ust sinir (cocuk konusmayi
// hic birakmazsa). webkitSpeechRecognition'in yerini alan gercek ses
// kaydi - hem ana dinleme hem uyandirma kelimesi bunu kullanir.
async function recordUntilSilence({ maxMs = 8000, silenceMs = 1100, requireSpeechFirst = true, isCancelled = () => false } = {}) {
  if (!await prepareMicrophone()) return null;
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(microphoneStream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  const recorder = new MediaRecorder(microphoneStream, { mimeType: 'audio/webm;codecs=opus' });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start();

  let heardSpeech = !requireSpeechFirst;
  let lastLoudAt = performance.now();
  const start = performance.now();
  await new Promise((resolve) => {
    function tick() {
      analyser.getByteTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sumSq += v * v; }
      const rms = Math.sqrt(sumSq / data.length);
      const now = performance.now();
      if (rms > 0.02) { heardSpeech = true; lastLoudAt = now; }
      const silentTooLong = heardSpeech && (now - lastLoudAt > silenceMs);
      const maxedOut = (now - start) > maxMs;
      if (silentTooLong || maxedOut || isCancelled()) { resolve(); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  recorder.stop();
  await stopped;
  audioCtx.close();
  if (!heardSpeech) return null;
  return new Blob(chunks, { type: 'audio/webm' });
}

function detectSpeechLanguage(text) {
  // Türkçeye özgü harfler ve yaygın kelimeler Türkçe sesi seçmeye yeterlidir.
  const lower = text.toLocaleLowerCase('tr-TR');
  const turkishMarkers = /[çğıöşü]|\b(ve|bir|bu|şu|ile|için|nasıl|neden|merhaba|tekrar|kod|öğren)\b/;
  return turkishMarkers.test(lower) ? 'tr-TR' : 'en-US';
}

function chooseWindowsVoice(language) {
  const voices = window.speechSynthesis.getVoices();
  const baseLanguage = language.slice(0, 2).toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(baseLanguage));
  if (!matching.length) return null;

  // Windows'un kurulu yerel seslerini tercih et. Bu sesler çevrimdışı da çalışır
  // ve Chromium'un varsayılan uzaktan seslerinden daha tutarlı davranır.
  return matching.find((voice) => voice.localService && /microsoft|windows/i.test(voice.name))
    || matching.find((voice) => voice.localService)
    || matching[0];
}

async function speak(text, onDone) {
  isSpeaking = true;
  teacherStage.classList.add('speaking');
  requestAnimationFrame(() => animateTalking(performance.now()));

  const finish = () => {
    isSpeaking = false;
    teacherStage.classList.remove('speaking');
    if (onDone) onDone();
  };

  // GERCEKTEN eklendi (2026-09-11, Semih: "ses gelmiyor... sesli konuşmayı
  // düzgün yapabilirsek" - window.ogretmenAPI.speak KOPRUSU onceden vardi
  // ama BURADAN HIC CAGRILMIYORDU, dogrudan Chromium'a gidiliyordu; Chromium
  // Linux'ta zaten sessiz kaliyor - bkz. main.js'teki FREYATTS ENTEGRASYONU
  // yorumu). FreyaTTS SADECE Turkce icin denenir (Piper'daki AYNI kisit -
  // Turkce modeli Ingilizce'yi dogal okuyamiyor), Ingilizce ya da FreyaTTS
  // basarisiz/kurulu degilse Chromium'a (Windows'ta Microsoft sesi) duser.
  const language = detectSpeechLanguage(text);
  console.log('[TANI] speak() cagrildi, dil:', language);
  if (language === 'tr-TR') {
    try {
      const result = await window.ogretmenAPI.speak(text);
      console.log('[TANI] ogretmenAPI.speak sonucu:', result && result.ok, result && result.mime, result && result.audioBase64 && result.audioBase64.length);
      if (result && result.ok && result.audioBase64) {
        const audio = new Audio(`data:${result.mime || 'audio/wav'};base64,${result.audioBase64}`);
        attachTtsAnalyser(audio);
        audio.onended = finish;
        audio.onerror = (e) => { console.log('[TANI] audio.onerror', e); speakWithChromium(text, finish); };
        await audio.play().catch((e) => { console.log('[TANI] audio.play() reddedildi:', e.message); speakWithChromium(text, finish); });
        return;
      }
    } catch (e) {
      console.log('[TANI] speak() catch:', e.message);
    }
  }
  speakWithChromium(text, finish);
}

// Yedek/varsayilan ses: Windows/Chromium'un yerlesik ucretsiz sesi.
// Piper kurulu degilse otomatik olarak buraya dusulur.
function speakWithChromium(text, onDone) {
  if (!('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  const language = detectSpeechLanguage(text);
  utter.lang = language;
  utter.voice = chooseWindowsVoice(language);
  // Çocuklar için anlaşılır, ama yapay derecede yavaş olmayan bir hız.
  utter.rate = language === 'tr-TR' ? 0.92 : 0.96;
  utter.pitch = 1.1;
  utter.onend = () => { if (onDone) onDone(); };
  utter.onerror = () => { if (onDone) onDone(); };
  window.speechSynthesis.speak(utter);
}

// Windows sesleri bazen ilk çağrıdan sonra yüklenir; yüklendiğinde sonraki
// cevaplarda en iyi yerel ses otomatik seçilir.
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  window.speechSynthesis.getVoices();
}

// ---------------------------------------------------------------
// PYTHON MODU - kullanicinin acik istegi (2026-08-31): "python kullanimi ve
// egitimi cok onemli... ai ogretmen otomatik python indirip kursun". Kucuk,
// sabit bir mufredat listesi; kalici ilerleme childProfile.pythonProgress'te
// (main.js) tutulur.
// GERCEKTEN genisletildi (2026-09-11, Semih: "blok modunu kaldır, sadece
// python kalsın, şablonları arttır, görevlerin seviyesi yaptıkça artsın") -
// liste/sozluk/while/fonksiyon eklendi, listede SIRAYLA artan zorluk var ve
// (bkz. asagidaki unlockedPythonLessons) bir sonraki ders SADECE bir onceki
// tamamlaninca acilir - cocuk zorluk sirasini atlayamaz.
// ---------------------------------------------------------------
const PYTHON_LESSONS = [
  {
    id: 'merhaba-dunya',
    name: '1) Merhaba Dünya',
    nameEn: '1) Hello World',
    hint: 'Kodu değiştirmene bile gerek yok - sadece Çalıştır\'a bas ve gerçek çıktıyı gör!',
    hintEn: 'You don\'t even need to change the code - just press Run and see the real output!',
    starterCode: 'print("Merhaba Dünya!")'
  },
  {
    id: 'adini-soyle',
    name: '2) Adını Söyle',
    nameEn: '2) Say Your Name',
    hint: '"Ayşe" yazan yeri kendi adınla değiştir, sonra Çalıştır\'a bas.',
    hintEn: 'Change "Ayşe" to your own name, then press Run.',
    starterCode: 'isim = "Ayşe"\nprint(isim)'
  },
  {
    id: 'sayilarla-oyna',
    name: '3) Sayılarla Oyna',
    nameEn: '3) Play with Numbers',
    hint: '8 sayısını değiştir, çıktının nasıl değiştiğini gör.',
    hintEn: 'Change the number 8 and see how the output changes.',
    starterCode: 'yas = 8\nprint(yas + 1)'
  },
  {
    id: 'tekrar-et',
    name: '4) Tekrar Et',
    nameEn: '4) Repeat It',
    hint: '5 sayısını değiştir, "Merhaba!" kaç kere yazdırıldığına bak.',
    hintEn: 'Change the number 5, see how many times "Merhaba!" gets printed.',
    starterCode: 'for i in range(5):\n    print("Merhaba!")'
  },
  {
    id: 'eger',
    name: '5) Eğer',
    nameEn: '5) If',
    hint: 'Yaşı değiştirip her iki durumu da dene (8\'den küçük ve büyük).',
    hintEn: 'Change the age and try both cases (under and over 8).',
    starterCode: 'yas = 8\nif yas >= 8:\n    print("Kodlamaya hazırsın!")\nelse:\n    print("Neredeyse hazırsın!")'
  },
  {
    id: 'carpim-tablosu',
    name: '6) Çarpım Tablosu',
    nameEn: '6) Multiplication Table',
    hint: '"sayi" değişkenini değiştir, çarpım tablosunun nasıl değiştiğini gör.',
    hintEn: 'Change the "sayi" (number) variable and see how the multiplication table changes.',
    starterCode: 'sayi = 3\nfor i in range(1, 6):\n    print(sayi * i)'
  },
  {
    id: 'ic-ice-tekrar',
    name: '7) İç İçe Tekrar',
    nameEn: '7) Nested Repeat',
    hint: 'Bu kod TOPLAM kaç kere "Merhaba!" yazdırır? "kat" ya da "adet" sayısını değiştirip dene.',
    hintEn: 'How many times does this print "Merhaba!" in TOTAL? Try changing the "kat" or "adet" numbers.',
    starterCode: 'for kat in range(3):\n    for adet in range(2):\n        print("Merhaba!")'
  },
  {
    id: 'sayac',
    name: '8) Sayaç — Çift mi Tek mi',
    nameEn: '8) Counter — Even or Odd',
    hint: '1\'den 10\'a kadar her sayı için çift mi tek mi olduğunu yazdırır. Son sayıyı (11) değiştirip dene.',
    hintEn: 'Prints whether each number from 1 to 10 is even or odd. Try changing the last number (11).',
    starterCode: 'for sayi in range(1, 11):\n    if sayi % 2 == 0:\n        print(sayi, "çift")\n    else:\n        print(sayi, "tek")'
  },
  // GERCEKTEN duzeltildi (2026-09-11, Semih: "mevcut zaten pc de, bütün
  // bağlamlar gidecek bu sefer de" - ilk taslakta 'metin-birlestir' YANLISLIKLA
  // orijinal 9 dersin ORTASINA (3 ile 4 arasina) eklenmisti. unlockedPythonLessons
  // dizi SIRASINA gore ardisik kilit actigindan, bu, ders 4-9'u ONCEDEN
  // tamamlamis GERCEK bir cocugu (yegen) yeni eklenen bu TEK derste "kilitli"
  // gosterip GERIYE dondururdu - ilerleme verisi (childProfile.pythonProgress)
  // SILINMEZ ama etkin kilit durumu boyle bozulurdu. Bu yuzden YENI derslerin
  // HEPSI orijinal 9'un (1-8, sayac'a kadar) ARDINDAN eklenir - var olan
  // ilerlemesi olan hic kimse geriye dogru kilitlenmez, sadece yeni icerik
  // ONCEKI EN SON tamamlanan dersin devami olarak acilir.
  {
    id: 'metin-birlestir',
    name: '9) Metinleri Birleştir',
    nameEn: '9) Join Two Words',
    hint: '"Ali" ve "Kaya" yerine kendi adını/soyadını yaz, ne olduğunu gör.',
    hintEn: 'Change "Ali" and "Kaya" to your own name, see what happens.',
    starterCode: 'ad = "Ali"\nsoyad = "Kaya"\nprint(ad + " " + soyad)'
  },
  {
    id: 'listeyle-tanis',
    name: '10) Listeyle Tanış',
    nameEn: '10) Meet Lists',
    hint: 'Listeye kendi sevdiğin bir meyveyi ekle (virgülle ayırıp tırnak içinde), tekrar çalıştır.',
    hintEn: 'Add your favorite fruit to the list (comma-separated, in quotes), run again.',
    starterCode: 'meyveler = ["elma", "armut", "muz"]\nfor meyve in meyveler:\n    print(meyve)'
  },
  {
    id: 'liste-toplami',
    name: '11) Liste Toplamı',
    nameEn: '11) Sum a List',
    hint: 'Listeye yeni bir sayı ekle, toplamın nasıl değiştiğini gör.',
    hintEn: 'Add a new number to the list, see how the total changes.',
    starterCode: 'sayilar = [4, 8, 15, 16]\ntoplam = 0\nfor sayi in sayilar:\n    toplam = toplam + sayi\nprint(toplam)'
  },
  {
    id: 'geri-sayim',
    name: '12) Geri Sayım (while)',
    nameEn: '12) Countdown (while)',
    hint: '5 sayısını değiştir, geri sayımın nereden başladığını gör.',
    hintEn: 'Change the number 5, see where the countdown starts.',
    starterCode: 'sayac = 5\nwhile sayac > 0:\n    print(sayac)\n    sayac = sayac - 1\nprint("Başla!")'
  },
  {
    id: 'kendi-fonksiyonun',
    name: '13) Kendi Fonksiyonun',
    nameEn: '13) Your Own Function',
    hint: '"Zeynep" yerine kendi adını yaz, fonksiyonu tekrar çağır.',
    hintEn: 'Change "Zeynep" to your own name, call the function again.',
    starterCode: 'def selamla(isim):\n    print("Merhaba " + isim + "!")\n\nselamla("Zeynep")'
  },
  {
    id: 'sozlukle-tanis',
    name: '14) Sözlükle Tanış',
    nameEn: '14) Meet Dictionaries',
    hint: '"seviye" değerini değiştir, çıktının nasıl değiştiğini gör.',
    hintEn: 'Change the "seviye" (level) value, see how the output changes.',
    starterCode: 'oyuncu = {"isim": "Ege", "seviye": 3}\nprint(oyuncu["isim"])\nprint(oyuncu["seviye"])'
  },
  {
    id: 'en-buyugu-bul',
    name: '15) En Büyüğü Bul',
    nameEn: '15) Find the Biggest',
    hint: 'Listeye daha büyük bir sayı ekle, en büyüğün değişip değişmediğini gör.',
    hintEn: 'Add a bigger number to the list, see if the biggest one changes.',
    starterCode: 'sayilar = [12, 45, 3, 89, 22]\nen_buyuk = sayilar[0]\nfor sayi in sayilar:\n    if sayi > en_buyuk:\n        en_buyuk = sayi\nprint(en_buyuk)'
  },
  {
    id: 'notlarin-ortalamasi',
    name: '16) Mini Görev: Notların Ortalaması',
    nameEn: '16) Mini Project: Grade Average',
    hint: 'Kendi notlarını listeye yaz, ortalamanın nasıl değiştiğini gör. Bu, öğrendiğin HER ŞEYİ (fonksiyon, liste, tekrar) bir araya getiriyor!',
    hintEn: 'Put your own grades in the list, see the average change. This combines EVERYTHING you learned (function, list, loop)!',
    starterCode: 'def ortalama_hesapla(notlar):\n    toplam = 0\n    for not_ in notlar:\n        toplam = toplam + not_\n    return toplam / len(notlar)\n\nnotlarim = [80, 90, 70, 100]\nprint(ortalama_hesapla(notlarim))'
  },
  {
    id: 'kendi-kodun',
    name: '17) Kendi Kodun (serbest)',
    nameEn: '17) Your Own Code (free)',
    hint: 'Hedef yok, istediğin gibi deneme yapabilirsin.',
    hintEn: 'No goal here — try anything you like.',
    starterCode: ''
  }
];

function pythonLessonText(lesson, field) {
  if (voiceLanguage === 'en-US') return lesson[field + 'En'] || lesson[field];
  return lesson[field];
}

let currentPythonLesson = PYTHON_LESSONS[0];
// Blok Modu kaldırıldı (2026-09-11, Semih: "blok modunu kaldır, sadece python
// kalsın") - artık tek öğretmen kimliği var, ama askAI'nin imzasını (mode
// parametresi, bkz. main.js buildSystemPrompt) değiştirmeye gerek yok.
const currentMode = 'python';
let pythonInstallChecked = false;

const pythonLessonSelect = document.getElementById('pythonLessonSelect');
const pythonCodeInput = document.getElementById('pythonCodeInput');
const pythonOutput = document.getElementById('pythonOutput');
const pythonRunBtn = document.getElementById('pythonRunBtn');

// ---------------------------------------------------------------
// DERS KİLİDİ / SEVİYE İLERLEMESİ (2026-09-11, Semih: "görevlerin seviyesi
// yaptıkça artsın") - dersler SIRAYLA açılır: bir ders, kendinden ÖNCEKİ ders
// gerçekten tamamlanmadan (kalıcı childProfile.pythonProgress'te 'completed')
// dropdown'da HİÇ görünmez. Böylece çocuk zorluk sırasını atlayıp doğrudan
// en zor derse geçemez - her ders bir öncekinin üzerine inşa edilir.
// ---------------------------------------------------------------
let pythonProgressCache = {};

async function refreshPythonProgress() {
  try { pythonProgressCache = (await window.ogretmenAPI.getPythonProgress()) || {}; }
  catch (e) { pythonProgressCache = {}; }
}

function isPythonLessonCompleted(id) {
  return Boolean(pythonProgressCache[id] && pythonProgressCache[id].completed);
}

// İlk kilitli derste durur - zincir kırılırsa (b öncekini atlayıp ilerisi
// tamamlanmışsa, olmamalı ama) sonrasını göstermeyiz.
function unlockedPythonLessons() {
  const result = [];
  for (const lesson of PYTHON_LESSONS) {
    result.push(lesson);
    if (!isPythonLessonCompleted(lesson.id)) break;
  }
  return result;
}

function renderPythonLessonOptions(preferredId) {
  const unlocked = unlockedPythonLessons();
  const selectedId = (preferredId && unlocked.some((l) => l.id === preferredId))
    ? preferredId
    : unlocked[unlocked.length - 1].id; // varsayilan: siradaki (en son acilan) ders
  pythonLessonSelect.innerHTML = '';
  unlocked.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.id;
    const doneMark = isPythonLessonCompleted(l.id) ? '✅ ' : '';
    opt.innerText = doneMark + pythonLessonText(l, 'name');
    pythonLessonSelect.appendChild(opt);
  });
  pythonLessonSelect.value = selectedId;
  return selectedId;
}

function setPythonOutput(text) { pythonOutput.textContent = text; }

function loadPythonLesson(id) {
  const lesson = PYTHON_LESSONS.find((l) => l.id === id) || PYTHON_LESSONS[0];
  currentPythonLesson = lesson;
  pythonCodeInput.value = lesson.starterCode;
  setPythonOutput(pythonLessonText(lesson, 'hint'));
}

pythonLessonSelect.addEventListener('change', () => loadPythonLesson(pythonLessonSelect.value));

(async () => {
  await refreshPythonProgress();
  loadPythonLesson(renderPythonLessonOptions());
})();

// Python Modu'na ilk kez girildiginde (ya da ilk Calistir'a basildiginda)
// cagrilir - zaten kuruluysa aninda basarili doner (main.js: isPythonReady()).
async function ensurePythonReadyOnce() {
  if (pythonInstallChecked) return true;
  const status = await window.ogretmenAPI.getPythonStatus();
  if (status.installed) { pythonInstallChecked = true; return true; }
  pythonRunBtn.disabled = true;
  setPythonOutput(uiText('pythonInstalling'));
  const result = await window.ogretmenAPI.ensurePythonInstalled();
  pythonRunBtn.disabled = false;
  if (!result.ok) {
    setPythonOutput(result.reason === 'not-windows' ? uiText('pythonNotWindows') : uiText('pythonInstallFailed'));
    return false;
  }
  pythonInstallChecked = true;
  setPythonOutput(pythonLessonText(currentPythonLesson, 'hint'));
  return true;
}

// Tek mod (Python) - acilista dogrudan hazirlik kontrolu yapilir (eskiden
// SADECE Python sekmesine tiklaninca calisirdi, artik baska sekme yok).
ensurePythonReadyOnce();

pythonRunBtn.addEventListener('click', async () => {
  const code = pythonCodeInput.value;
  window.ogretmenAPI.reportPythonProgress(currentPythonLesson.id, 'attempt');
  pythonRunBtn.disabled = true;
  const ready = await ensurePythonReadyOnce();
  if (!ready) { pythonRunBtn.disabled = false; return; }
  const result = await window.ogretmenAPI.runPythonCode(code);
  pythonRunBtn.disabled = false;

  // Cocugun okuyup transkript etmesine gerek kalmadan GERCEK stdout/stderr'i
  // dogrudan AI ogretmene bir "sistem raporu" olarak gonderiyoruz (asagida
  // sendToAI) - AI, tam da az once yazdigi kodun GERCEK sonucuna tepki verir.
  let report;
  if (result.timedOut) {
    setPythonOutput(uiText('pythonTimedOut'));
    report = uiText('pythonTimedOut');
  } else if (result.ok) {
    const out = (result.stdout || '').trim();
    setPythonOutput(out || uiText('pythonRanEmptyOk'));
    report = out ? `${uiText('pythonRanOk')} ${out}` : uiText('pythonRanEmptyOk');
    const wasAlreadyCompleted = isPythonLessonCompleted(currentPythonLesson.id);
    await window.ogretmenAPI.reportPythonProgress(currentPythonLesson.id, 'completed');
    // GERCEKTEN eklendi (2026-09-11, "görevlerin seviyesi yaptıkça artsın") -
    // bu ders İLK kez tamamlandiysa bir sonraki ders KİLİDİ açılır, çocuğa
    // bunu hemen belli et ve dropdown'i yenile.
    if (!wasAlreadyCompleted) {
      await refreshPythonProgress();
      const unlocked = unlockedPythonLessons();
      const stillOnLast = unlocked[unlocked.length - 1].id === currentPythonLesson.id;
      renderPythonLessonOptions(currentPythonLesson.id);
      if (!stillOnLast) {
        const nextLesson = unlocked[unlocked.length - 1];
        addMessage('🎉 ' + pythonLessonText(nextLesson, 'name'), 'system');
      }
    }
  } else {
    const err = (result.stderr || '').trim();
    setPythonOutput(err);
    report = `${uiText('pythonRanError')} ${err}`;
  }
  addMessage(report, 'system');
  await sendToAI(report, { skipUserBubble: true });
});

async function sendToAI(text, opts = {}) {
  if (!opts.skipUserBubble) {
    addMessage(text, 'user');
    chatInput.value = '';
  }
  const reply = await window.ogretmenAPI.askAI(text, currentMode);
  addMessage(reply, 'ai');

  speak(reply, () => {
    // AI konuşmasını bitirdi -> sesli mod hâlâ açıksa dinlemeye devam et
    if (voiceModeOn) startListening();
  });
}

sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (text) sendToAI(text);
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = chatInput.value.trim();
    if (text) sendToAI(text);
  }
});

// Ses -> Metin: gercek ses kaydi (recordUntilSilence, yukarida) + Groq
// Whisper (main.js'teki audio:transcribe). ONCEDEN tarayicinin
// webkitSpeechRecognition'i kullaniliyordu - Electron'un icindeki ciplak
// Chromium'da bu GUVENILIR CALISMIYOR (bkz. recordUntilSilence yorumu),
// cocuk konusuyor ama hicbir sey olmuyordu. MediaRecorder/getUserMedia
// Electron'da HER ZAMAN var, o yuzden mikrofon butonu artik hicbir zaman
// "desteklenmiyor" diye kapatilmiyor.
const voiceLangBtn = document.getElementById('voiceLangBtn');
voiceLangBtn.addEventListener('click', () => {
  voiceLanguage = voiceLanguage === 'tr-TR' ? 'en-US' : 'tr-TR';
  try { localStorage.setItem('ogretmenai-voice-lang', voiceLanguage); } catch (e) {}
  applyUILanguage();
});

async function startListening() {
  if (isSpeaking || !voiceModeOn) return;
  micBtn.classList.add('listening');
  // silenceMs 1100 -> 750: kullanicinin "mikrofon gecikmesi" sikayeti sonrasi -
  // cocuk konusmayi bitirdikten sonra AI'in tepki vermesi icin GEREKSIZ uzun
  // bir sessizlik bekleniyordu. 750ms hala dogal bir konusma duraklamasini
  // (kelime aralari) yanlislikla "bitti" saymayacak kadar uzun, ama onceki
  // 1100ms'e gore belirgin sekilde daha hizli tepki verir.
  const blob = await recordUntilSilence({ maxMs: 8000, silenceMs: 750, isCancelled: () => !voiceModeOn });
  micBtn.classList.remove('listening');
  if (!voiceModeOn) return; // bu sirada durduruldu

  if (!blob) {
    // konusma hic algilanmadi (sessizlik/erken iptal) - hala sesli moddaysak tekrar dinle
    if (voiceModeOn) startListening();
    return;
  }

  const buf = await blob.arrayBuffer();
  const lang = voiceLanguage === 'tr-TR' ? 'tr' : 'en';
  const result = await window.ogretmenAPI.transcribeAudio(buf, 'audio/webm', lang);
  if (!voiceModeOn) return; // yaziya cevirirken kapatilmis olabilir

  if (result && result.ok && result.text) {
    sendToAI(result.text);
  } else if (voiceModeOn) {
    startListening(); // anlasilamadi, tekrar dinle
  }
}

function stopListening() {
  // recordUntilSilence kendi ici tick donguSunde isCancelled() ile
  // voiceModeOn'u kontrol ediyor - burada ekstra bir seye gerek yok,
  // bir sonraki animasyon karesinde kendiliginden durur.
  micBtn.classList.remove('listening');
}

// Mikrofon butonu artık "Sesli Sohbeti Başlat/Durdur" anahtarı
micBtn.addEventListener('click', () => {
  if (voiceModeOn) {
    stopVoiceMode();
  } else {
    startVoiceMode();
  }
});

async function startVoiceMode() {
  voiceModeOn = true;
  micBtn.title = uiText('micBtnStopTitle');
  micBtn.innerText = uiText('micBtnStop');
  setVoiceUiMode(true);
  stopWakeListener();
  await startListening();
}

function stopVoiceMode() {
  voiceModeOn = false;
  micBtn.title = uiText('micBtnStartTitle');
  micBtn.innerText = uiText('micBtnStart');
  setVoiceUiMode(false);
  stopListening();
  window.speechSynthesis.cancel(); // Chromium sesi calisiyorsa durdur
  // Not: Piper ile calan bir <audio> varsa o kendi akisinda biter;
  // istenirse ileride aktif Audio referansi tutulup burada .pause()
  // ile de kesilebilir.
  // Sesli mod elle kapatıldı -> "amca" ile tekrar açılabilsin diye
  // uyandırma dinleyicisini yeniden başlat
  startWakeListener();
}

// ---------------------------------------------------------------
// 7. UYANDIRMA KELİMESİ: "Aven"
// Uygulama açıldığında hafif bir arka plan dinleyicisi sürekli
// çalışır ve sadece "Aven" kelimesini dinler. Duyulduğu an
// tam sesli sohbet moduna (yukarıdaki döngü) otomatik geçilir —
// mikrofon butonuna basmaya gerek kalmaz. ONCEDEN webkitSpeechRecognition
// KULLANIYORDU (ayni GUVENILMEZ Electron sorunu, bkz. yukarisi) - artik
// SUREKLI bulut cagrisi YAPMADAN (VAD yerel/ucretsiz) sadece konusma
// algilaninca KISA bir kayit alip Groq Whisper'a soruyor.
// ---------------------------------------------------------------
let wakeListenerActive = false;

async function wakeLoop() {
  while (wakeListenerActive) {
    const blob = await recordUntilSilence({ maxMs: 3000, silenceMs: 700, isCancelled: () => !wakeListenerActive });
    if (!wakeListenerActive) return;
    if (blob) {
      const buf = await blob.arrayBuffer();
      const result = await window.ogretmenAPI.transcribeAudio(buf, 'audio/webm', 'tr');
      if (!wakeListenerActive) return;
      if (result && result.ok && result.text && result.text.toLowerCase().includes('aven')) {
        addMessage(uiText('wakeWordHeard'), 'ai');
        startVoiceMode();
        return;
      }
    }
  }
}

async function startWakeListener() {
  if (voiceModeOn || wakeListenerActive) return;
  wakeListenerActive = true;
  wakeLoop();
}

function stopWakeListener() {
  wakeListenerActive = false;
}

// Kaydedilmis dil tercihini TUM arayuze uygula (baslangicta bir kez).
applyUILanguage();

// Karşılama mesajı
addMessage(uiText('initialGreeting'), 'ai');

// Uygulama açılır açılmaz "Aven" kelimesini bekleyen dinleyiciyi başlat
startWakeListener();
