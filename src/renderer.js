// renderer.js
// 1) Basit Blockly blokları tanımlar (ileri git, dön, tekrar et, eğer)
// 2) Karakteri metin tabanlı bir "sahnede" simüle eder
// 4. Sohbet panelini (yazılı + sesli) AI köprüsüne bağlar

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
    voiceLangBtnTitle: 'Mikrofon ve arayüz şu an Türkçe - İngilizce\'ye geçmek için tıkla'
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
    voiceLangBtnTitle: 'Microphone and interface are in English now - click to switch to Turkish'
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

  const templateLabel = document.querySelector('label[for="templateSelect"]');
  if (templateLabel) templateLabel.textContent = uiText('templateLabel');
  setText('runBtn', 'runBtn');
  setText('runHint', 'runHint');
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

  if (typeof updateApiKeyButton === 'function') updateApiKeyButton();
  if (typeof micBtn !== 'undefined' && micBtn) {
    micBtn.innerText = voiceModeOn ? uiText('micBtnStop') : uiText('micBtnStart');
    micBtn.title = uiText('micBtnStartTitle');
  }

  // Sablon dropdown'ini yeni dilde yeniden olustur, secili sablonu koru.
  if (typeof templateSelect !== 'undefined' && templateSelect) {
    const selectedId = currentTemplate ? currentTemplate.id : (TEMPLATES[0] && TEMPLATES[0].id);
    templateSelect.innerHTML = '';
    TEMPLATES.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.innerText = templateText(t, 'name');
      templateSelect.appendChild(opt);
    });
    templateSelect.value = selectedId;
  }

  // Zaten yerlestirilmis (calisma alanindaki) bloklarin etiketlerini de
  // guncelle - flyout'taki (henuz surukleyip birakilmamis) bloklar zaten
  // bir sonraki acilista init() ile yeni dilde olusturulacak.
  if (typeof workspace !== 'undefined' && workspace && workspace.getAllBlocks) {
    const labelKeyByType = { move_forward: 'blockForward', turn_around: 'blockTurn', jump: 'blockJump' };
    workspace.getAllBlocks(false).forEach((block) => {
      if (labelKeyByType[block.type]) {
        const field = block.inputList[0] && block.inputList[0].fieldRow.find((f) => f instanceof Blockly.FieldLabel);
        if (field) field.setValue(uiText(labelKeyByType[block.type]));
      } else if (block.type === 'repeat_n') {
        const labels = block.inputList[0] ? block.inputList[0].fieldRow.filter((f) => f instanceof Blockly.FieldLabel) : [];
        if (labels[0]) labels[0].setValue(uiText('blockRepeatPrefix'));
        if (labels[1]) labels[1].setValue(uiText('blockRepeatSuffix'));
      }
    });
  }
}

// ---------------------------------------------------------------
// 1. ÖZEL BLOKLAR
// ---------------------------------------------------------------
Blockly.Blocks['move_forward'] = {
  init: function () {
    this.appendDummyInput().appendField(uiText('blockForward'));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip(uiText('blockForwardTooltip'));
  }
};

Blockly.Blocks['turn_around'] = {
  init: function () {
    this.appendDummyInput().appendField(uiText('blockTurn'));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip(uiText('blockTurnTooltip'));
  }
};

Blockly.Blocks['jump'] = {
  init: function () {
    this.appendDummyInput().appendField(uiText('blockJump'));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip(uiText('blockJumpTooltip'));
  }
};

Blockly.Blocks['repeat_n'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(uiText('blockRepeatPrefix'))
      .appendField(new Blockly.FieldNumber(3, 1, 20), 'TIMES')
      .appendField(uiText('blockRepeatSuffix'));
    this.appendStatementInput('DO').setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip(uiText('blockRepeatTooltip'));
  }
};

// ---------------------------------------------------------------
// 2. WORKSPACE KURULUMU
// ---------------------------------------------------------------
const toolbox = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'block', type: 'move_forward' },
    { kind: 'block', type: 'turn_around' },
    { kind: 'block', type: 'jump' },
    { kind: 'block', type: 'repeat_n' }
  ]
};

const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolbox,
  trashcan: true,
  scrollbars: true,
  renderer: 'zelos',
  // Çocukların blokları rahatça görüp sürükleyebilmesi için çalışma alanını büyüt.
  zoom: { controls: true, wheel: true, startScale: 1.35, minScale: 0.9, maxScale: 2.5, scaleSpeed: 1.2 }
});

// ---------------------------------------------------------------
// 3. ŞABLON SİSTEMİ
// Her şablon bir "seviye/senaryo" tanımıdır: karakterin başlangıç
// konumu/yönü, ızgara boyutu, varsa bir hedef bayrağı ve kısa bir
// açıklama. Aven (ya da sen) yeğenin seviyesine göre yeni şablonlar
// öğretebilir/ekleyebilir — tek yapılması gereken bu diziye aynı
// formatta yeni bir obje eklemek. Şimdilik birkaç örnekle başlıyor,
// mimari onlarcasını taşıyacak şekilde kuruldu.
// ---------------------------------------------------------------
const TEMPLATES = [
  {
    id: 'duz-yol',
    name: '1) Düz Yol — İleriye Yürü',
    nameEn: '1) Straight Road — Walk Forward',
    cols: 8, rows: 6,
    start: { x: 1, y: 3, angle: 0 },   // angle: 0=sağ, 90=aşağı, 180=sol, 270=yukarı
    goal: { x: 6, y: 3 },
    hint: 'Karakteri sadece "ileri git" bloklarıyla bayrağa ulaştır.',
    hintEn: 'Get the character to the flag using only "move forward" blocks.'
  },
  {
    id: 'kose-donme',
    name: '2) Köşeyi Dön',
    nameEn: '2) Turn the Corner',
    cols: 8, rows: 6,
    start: { x: 1, y: 1, angle: 0 },
    goal: { x: 6, y: 4 },
    hint: 'Önce ileri git, sonra "dön" bloğunu kullan, sonra tekrar ileri git.',
    hintEn: 'First move forward, then use the "turn" block, then move forward again.'
  },
  {
    id: 'tekrar-pratigi',
    name: '3) Tekrar Bloğu Pratiği',
    nameEn: '3) Repeat Block Practice',
    cols: 8, rows: 6,
    start: { x: 0, y: 5, angle: 270 },
    goal: { x: 0, y: 0 },
    hint: '"N kere tekrarla" bloğunu kullanarak daha az blokla hedefe ulaş.',
    hintEn: 'Reach the goal with fewer blocks using the "repeat N times" block.'
  },
  {
    id: 'engelli-parkur',
    name: '4) Engelli Parkur — Zıpla',
    nameEn: '4) Obstacle Course — Jump',
    cols: 8, rows: 6,
    start: { x: 1, y: 3, angle: 0 },
    goal: { x: 6, y: 3 },
    obstacle: { x: 4, y: 3 },
    hint: 'Engelin üstünden geçmek için tam önünde "zıpla" bloğunu kullan.',
    hintEn: 'Use the "jump" block right in front of the obstacle to get over it.'
  },
  {
    id: 'serbest-alan',
    name: '5) Serbest Alan (hedef yok)',
    nameEn: '5) Free Play (no goal)',
    cols: 8, rows: 6,
    start: { x: 4, y: 3, angle: 0 },
    goal: null,
    hint: 'Hedef yok, istediğin gibi deneme yapabilirsin.',
    hintEn: 'No goal here — try anything you like.'
  },
  {
    id: 'cift-kose',
    name: '6) Çift Köşe — S Yolu',
    nameEn: '6) Double Turn — S Path',
    cols: 8, rows: 6,
    start: { x: 1, y: 1, angle: 0 },
    goal: { x: 2, y: 3 },
    hint: 'Bu sefer İKİ köşe var: önce ileri git, dön, tekrar ileri git, tekrar dön, sonra ileri git.',
    hintEn: 'This time there are TWO corners: move forward, turn, move forward again, turn again, then move forward.'
  },
  {
    id: 'uzun-tekrar',
    name: '7) Uzun Tekrar — Büyük Yol',
    nameEn: '7) Long Repeat — Big Road',
    cols: 10, rows: 6,
    start: { x: 0, y: 2, angle: 0 },
    goal: { x: 9, y: 2 },
    hint: 'Bu yol çok uzun — tek tek "ileri git" eklemek yerine "N kere tekrarla" bloğunun içine bir "ileri git" koy.',
    hintEn: 'This road is very long — instead of adding "move forward" one by one, put a single "move forward" inside a "repeat N times" block.'
  },
  {
    id: 'cifte-engel',
    name: '8) Çifte Engel — İki Kere Zıpla',
    nameEn: '8) Double Obstacle — Jump Twice',
    cols: 8, rows: 6,
    start: { x: 0, y: 3, angle: 0 },
    goal: { x: 7, y: 3 },
    obstacles: [{ x: 2, y: 3 }, { x: 5, y: 3 }],
    hint: 'Yolda İKİ engel var — her birinin tam önünde "zıpla" bloğunu kullanman gerekiyor.',
    hintEn: 'There are TWO obstacles on the road — use the "jump" block right in front of each one.'
  },
  {
    id: 'kare-tur',
    name: '9) Kare Tur — Başladığın Yere Dön',
    nameEn: '9) Square Tour — Back to Start',
    cols: 8, rows: 6,
    start: { x: 1, y: 1, angle: 0 },
    goal: { x: 1, y: 1 },
    hint: '"N kere tekrarla" bloğunun içine "ileri git, ileri git, dön" koy ve 4 kere tekrarlat — kare çizip başladığın yere dönersin.',
    hintEn: 'Put "move forward, move forward, turn" inside a "repeat N times" block set to 4 — you\'ll draw a square and return to where you started.'
  },
  {
    id: 'zipla-don-karisik',
    name: '10) Zıpla + Dön Karışık Parkur',
    nameEn: '10) Mixed Jump + Turn Course',
    cols: 8, rows: 6,
    start: { x: 1, y: 1, angle: 0 },
    goal: { x: 1, y: 4 },
    obstacles: [{ x: 3, y: 3 }],
    hint: 'Hem "dön" hem "zıpla" bloğuna ihtiyacın olacak — önce köşeyi dön, sonra engelin önünde zıpla, sonra tekrar dön.',
    hintEn: 'You\'ll need both "turn" and "jump" — turn the corner first, then jump in front of the obstacle, then turn again.'
  }
];

function templateText(tpl, field) {
  if (voiceLanguage === 'en-US') return tpl[field + 'En'] || tpl[field];
  return tpl[field];
}

let currentTemplate = TEMPLATES[0];
let charState = { x: 0, y: 0, angle: 0 };
let goalReached = false;

// ---------------------------------------------------------------
// 4. CANVAS ÇİZİMİ
// ---------------------------------------------------------------
const canvas = document.getElementById('stageCanvas');
const ctx = canvas.getContext('2d');
const stageMsgEl = document.getElementById('stageMsg');
const stageLogEl = document.getElementById('stageLog');

function cellSize() {
  return Math.min(
    canvas.width / currentTemplate.cols,
    canvas.height / currentTemplate.rows
  );
}

function drawScene() {
  const cs = cellSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ızgara
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let c = 0; c <= currentTemplate.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cs, 0);
    ctx.lineTo(c * cs, currentTemplate.rows * cs);
    ctx.stroke();
  }
  for (let r = 0; r <= currentTemplate.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cs);
    ctx.lineTo(currentTemplate.cols * cs, r * cs);
    ctx.stroke();
  }

  // engel(ler)
  const obstacles = templateObstacles(currentTemplate);
  if (obstacles.length > 0) {
    ctx.font = `${cs * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const o of obstacles) ctx.fillText('🧱', o.x * cs + cs / 2, o.y * cs + cs / 2);
  }

  // hedef bayrağı
  if (currentTemplate.goal) {
    ctx.font = `${cs * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚩', currentTemplate.goal.x * cs + cs / 2, currentTemplate.goal.y * cs + cs / 2);
  }

  // karakter (yön okuyla)
  const cx = charState.x * cs + cs / 2;
  const cy = charState.y * cs + cs / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((charState.angle * Math.PI) / 180);
  ctx.font = `${cs * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚗', 0, 0); // basit karakter ikonu; sonradan sprite ile degistirilebilir
  ctx.restore();
}

function resetCharacter() {
  charState = { ...currentTemplate.start };
  goalReached = false;
  stageMsgEl.innerText = '';
  stageLogEl.innerHTML = '';
  drawScene();
}

function loadTemplate(id) {
  const tpl = TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
  currentTemplate = tpl;
  resetCharacter();
  if (tpl.hint) {
    log(`💡 ${templateText(tpl, 'hint')}`);
  }
}

const templateSelect = document.getElementById('templateSelect');
TEMPLATES.forEach(t => {
  const opt = document.createElement('option');
  opt.value = t.id;
  opt.innerText = templateText(t, 'name');
  templateSelect.appendChild(opt);
});
templateSelect.addEventListener('change', () => loadTemplate(templateSelect.value));

// ---------------------------------------------------------------
// 5. ÇALIŞTIRICI (interpreter) — bloklara göre karakteri GERÇEKTEN
// ızgara üzerinde hareket ettirir, her adımda kısa bir animasyon
// gecikmesiyle canvas'ı yeniden çizer.
// ---------------------------------------------------------------
function log(line) {
  const div = document.createElement('div');
  div.innerText = line;
  stageLogEl.appendChild(div);
  stageLogEl.scrollTop = stageLogEl.scrollHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Bazi sablonlarda TEK engel (obstacle: {x,y}), bazilarinda BIRDEN FAZLA
// engel (obstacles: [{x,y}, ...]) olabilir - eskiyle geriye donuk uyumlu
// tek bir liste dondurur, tum engel kontrolleri buradan gecer.
function templateObstacles(tpl) {
  if (Array.isArray(tpl.obstacles)) return tpl.obstacles;
  if (tpl.obstacle) return [tpl.obstacle];
  return [];
}

function angleToDelta(angle) {
  switch (((angle % 360) + 360) % 360) {
    case 0: return { dx: 1, dy: 0 };
    case 90: return { dx: 0, dy: 1 };
    case 180: return { dx: -1, dy: 0 };
    case 270: return { dx: 0, dy: -1 };
    default: return { dx: 0, dy: 0 };
  }
}

function checkGoal() {
  const g = currentTemplate.goal;
  if (g && !goalReached && charState.x === g.x && charState.y === g.y) {
    goalReached = true;
    stageMsgEl.innerText = uiText('goalReachedMsg');
    log(uiText('goalReachedLog'));
    // Cocuk-profiline kalici olarak yazilsin - Aven bu sablonu artik
    // bildigini hatirlasin (bir sonraki oturumda bile).
    window.ogretmenAPI.reportTemplateProgress(currentTemplate.id, 'completed');
  }
}

async function runBlock(block) {
  if (!block) return;
  switch (block.type) {
    case 'move_forward': {
      const { dx, dy } = angleToDelta(charState.angle);
      const nx = charState.x + dx;
      const ny = charState.y + dy;
      const inBounds = nx >= 0 && nx < currentTemplate.cols && ny >= 0 && ny < currentTemplate.rows;
      const blockedByObstacle = templateObstacles(currentTemplate).some((o) => o.x === nx && o.y === ny);
      if (!inBounds) {
        log(uiText('bumpLog'));
      } else if (blockedByObstacle) {
        log(uiText('obstacleAheadLog'));
      } else {
        charState.x = nx;
        charState.y = ny;
        log(uiText('forwardLog'));
      }
      drawScene();
      checkGoal();
      await sleep(400);
      break;
    }
    case 'turn_around':
      charState.angle = (charState.angle + 90) % 360;
      log(uiText('turnLog'));
      drawScene();
      await sleep(300);
      break;
    case 'jump': {
      // Basit ziplama animasyonu: konum degismez, kisa bir "hop" gosterilir
      const cs = cellSize();
      const cx = charState.x * cs + cs / 2;
      const cy = charState.y * cs + cs / 2;
      for (const offset of [-10, -18, -10, 0]) {
        drawScene();
        ctx.save();
        ctx.font = `${cs * 0.7}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚗', cx, cy + offset);
        ctx.restore();
        await sleep(80);
      }
      // Engelin tam onundeyse ve zipladiysa, engeli asip bir hucre ilerlet
      const { dx, dy } = angleToDelta(charState.angle);
      const ahead = { x: charState.x + dx, y: charState.y + dy };
      const obstacleAhead = templateObstacles(currentTemplate).some((o) => o.x === ahead.x && o.y === ahead.y);
      if (obstacleAhead) {
        charState.x = ahead.x + dx;
        charState.y = ahead.y + dy;
        log(uiText('jumpObstacleLog'));
      } else {
        log(uiText('jumpLog'));
      }
      drawScene();
      checkGoal();
      await sleep(200);
      break;
    }
    case 'repeat_n': {
      const times = block.getFieldValue('TIMES');
      const inner = block.getInputTargetBlock('DO');
      log(`🔁  ${times} kere tekrar başlıyor...`);
      for (let i = 0; i < times; i++) {
        await runBlock(inner);
      }
      break;
    }
    default:
      break;
  }
  await runBlock(block.getNextBlock());
}

const runBtn = document.getElementById('runBtn');

runBtn.addEventListener('click', async () => {
  resetCharacter();
  const topBlocks = workspace.getTopBlocks(true);
  if (topBlocks.length === 0) {
    log(uiText('noBlocks'));
    return;
  }
  runBtn.disabled = true;
  window.ogretmenAPI.reportTemplateProgress(currentTemplate.id, 'attempt');
  for (const block of topBlocks) {
    await runBlock(block);
  }
  runBtn.disabled = false;
});

// İlk şablonu yükle ve sahneyi çiz
loadTemplate(TEMPLATES[0].id);

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
  div.innerText = (who === 'user' ? '🧒 ' : '🤖 ') + text;
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

function speak(text, onDone) {
  isSpeaking = true;
  teacherStage.classList.add('speaking');
  requestAnimationFrame(() => animateTalking(performance.now()));

  // Windows'ta kurulu Microsoft sesini doğrudan kullan. Böylece Türkçe ve
  // İngilizce yanıtlar kendi diline uygun sesle okunur; Piper Türkçe modeli
  // İngilizce metni doğal okuyamadığı için varsayılan değildir.
  speakWithChromium(text, () => {
    isSpeaking = false;
    teacherStage.classList.remove('speaking');
    if (onDone) onDone();
  });
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

async function sendToAI(text) {
  addMessage(text, 'user');
  chatInput.value = '';
  const reply = await window.ogretmenAPI.askAI(text);
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
  const blob = await recordUntilSilence({ maxMs: 8000, silenceMs: 1100, isCancelled: () => !voiceModeOn });
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
  stopWakeListener();
  await startListening();
}

function stopVoiceMode() {
  voiceModeOn = false;
  micBtn.title = uiText('micBtnStartTitle');
  micBtn.innerText = uiText('micBtnStart');
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
