// main.js
// Electron uygulamasinin ana surecı. Pencereyi acar ve renderer'i yukler.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');
const AdmZip = require('adm-zip');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// ---------------------------------------------------------------
// UZAKTAN GUNCELLEME (electron-updater + GitHub Releases) - kullanicinin
// acik istegi (2026-08-30): "uygulamayi uzaktan guncelleyebilir miyiz?"
// Yeni sürümler `npm run release:win` ile GitHub'daki
// semihkayags9-crypto/ogretmen-ai repo'suna yuklenir (bkz. package.json
// build.publish); uygulama acilista arka planda kontrol eder, varsa
// SESSIZCE indirir (ders sirasinda kesinti YOK), ve YEGEN uygulamayi
// KAPATTIGINDA (dogal kapanista) kurar - asla zorla yeniden baslatmaz.
// SADECE paketlenmis (.exe/AppImage) surumde calisir - `npm start` ile
// gelistirici modunda (app.isPackaged === false) sessizce atlanir, cunku
// kontrol edecek bir "yuklu surum" yok.
// ---------------------------------------------------------------
let updateReadyToInstall = false;

function setupAutoUpdate() {
  if (!app.isPackaged) return;
  try {
    autoUpdater.autoDownload = true;
    autoUpdater.on('update-downloaded', () => { updateReadyToInstall = true; });
    autoUpdater.on('error', (err) => {
      console.error('Güncelleme kontrolü başarısız (sessizce geçildi, uygulama normal çalışmaya devam eder):', err.message);
    });
    autoUpdater.checkForUpdates();
  } catch (e) {
    console.error('Güncelleme sistemi başlatılamadı (sessizce geçildi):', e.message);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdate();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Guvenlik agi: yarim kalan bir oturumun (henuz AI-ozetlenmemis bile olsa
  // templateProgress gibi) bellekte biriken hali kapanista da diske yazilsin -
  // "hafiza problemi" sikayetinin bir parcasi da buydu.
  saveChildProfile(childProfile);
  if (updateReadyToInstall) {
    autoUpdater.quitAndInstall();
    return;
  }
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------
// GERCEK AI BAGLANTISI (Groq)
//
// Groq secildi cunku ucretsiz katmani var ve hizli. API anahtari
// KOD ICINE YAZILMIYOR.
//
// Anahtar KAYDI (API Anahtari butonu / saveGroqApiKey) HER ZAMAN
// Electron'un yazilabilirligi garanti ettigi userData klasorune yapilir
// (USER_DATA_ENV_PATH) - proje kokundeki __dirname'e ASLA yazmaz. Paketlenmis
// (.exe/AppImage) bir surumde __dirname, electron-builder'in salt-okunur
// app.asar arsivinin icine duser; oraya yazma denemesi sessizce/hata ile
// basarisiz olurdu - tam da "yegenin .env'i elle duzenlemeden anahtar
// girebilsin" ozelliginin var olma sebebi olan senaryoda. userData her
// modda (dev/paketli, Windows/Linux) yazilabilir oldugu icin bu sorunu
// tasimaz. Proje kokundeki .env sadece OKUMA icin, geriye donuk uyumluluk
// amacli yedek olarak kalir (mevcut gelistirici kurulumu bozulmasin diye).
// ---------------------------------------------------------------

const USER_DATA_ENV_PATH = path.join(app.getPath('userData'), '.env');

// .env dosyasini basitce oku (harici paket kullanmadan, bagimlilik
// eklememek icin - dosya yoksa sessizce gecer)
function readEnvFileInto(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  });
}

function loadEnv() {
  // ONCE kullanicinin "API Anahtari" butonuyla kaydettigi (yazilabilir,
  // her modda calisan) konum, SONRA proje kokundeki gelistirici .env'i -
  // sadece userData'da HENUZ ayarlanmamis anahtarlar icin yedek olarak.
  readEnvFileInto(USER_DATA_ENV_PATH);
  readEnvFileInto(path.join(__dirname, '.env'));
}
loadEnv();

let GROQ_API_KEY = process.env.GROQ_API_KEY || '';
// Groq, 16 Ağustos 2026'da eski Llama 3.1/3.3 model kimliklerini
// ücretsiz ve geliştirici hesaplar için kapattı. Eski .env dosyaları da
// uygulamayı bozmasın diye onları Türkçe için daha uygun güncel modele yönlendiriyoruz.
const configuredModel = process.env.GROQ_MODEL || '';
const GROQ_MODEL = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b'].includes(configuredModel)
  ? 'qwen/qwen3.6-27b'
  : (configuredModel || 'qwen/qwen3.6-27b');

function saveGroqApiKey(apiKey) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key || /[\r\n]/.test(key)) {
    throw new Error('Geçerli bir API anahtarı girin.');
  }

  fs.mkdirSync(path.dirname(USER_DATA_ENV_PATH), { recursive: true });
  const previous = fs.existsSync(USER_DATA_ENV_PATH) ? fs.readFileSync(USER_DATA_ENV_PATH, 'utf8') : '';
  const lines = previous.split(/\r?\n/).filter((line) => !/^\s*GROQ_API_KEY\s*=/.test(line));
  lines.push(`GROQ_API_KEY=${key}`);
  fs.writeFileSync(USER_DATA_ENV_PATH, `${lines.filter(Boolean).join('\n')}\n`, { mode: 0o600 });
  GROQ_API_KEY = key;
}

ipcMain.handle('settings:get-api-key-status', () => ({ configured: Boolean(GROQ_API_KEY) }));

ipcMain.handle('settings:save-api-key', (event, apiKey) => {
  try {
    saveGroqApiKey(apiKey);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || 'API anahtarı kaydedilemedi.' };
  }
});

// ---------------------------------------------------------------
// COCUK PROFILI (kalici hafiza) - kullanicinin acik istegi (2026-08-30):
// "Aven cocugu ve egitimde kaldigi yeri hatirlamali, onu tanimali." Öncesinde
// TEK hafiza conversationHistory'ydi (RAM'de, uygulama kapaninca sifirlanir -
// bkz. asagisi). Bu YENI, AYRI bir katman: userData/child-profile.json'a
// KALICI olarak yazilan, AI'in kendi urettigi kisa bir "ogrenme profili"
// metni (summary) + hangi sablonlarin denenip tamamlandigi (templateProgress,
// AI gerekmeden, dogrudan Blockly calistiricisindan IPC ile gelir). Her yeni
// oturumda SYSTEM_PROMPT'a otomatik eklenir (bkz. buildSystemPrompt) - yani
// Aven her acilista cocugu SIFIRDAN degil, kaldigi yerden tanir.
// ---------------------------------------------------------------

const CHILD_PROFILE_PATH = path.join(app.getPath('userData'), 'child-profile.json');

function loadChildProfile() {
  try {
    if (fs.existsSync(CHILD_PROFILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CHILD_PROFILE_PATH, 'utf8'));
      return {
        summary: parsed.summary || '',
        lastUpdated: parsed.lastUpdated || null,
        templateProgress: parsed.templateProgress || {},
        // pythonProgress: templateProgress ile AYNI sekil ({attempts, completed,
        // lastAt}) - Python Modu icin ayri bir kalici kayit, ayni yuk/kayit
        // fonksiyonlarini paylasir (yeni bir dosya/mekanizma DEGIL).
        pythonProgress: parsed.pythonProgress || {}
      };
    }
  } catch (e) {
    console.error('Çocuk profili okunamadı, boş profille başlanıyor:', e.message);
  }
  return { summary: '', lastUpdated: null, templateProgress: {}, pythonProgress: {} };
}

function saveChildProfile(profile) {
  try {
    fs.mkdirSync(path.dirname(CHILD_PROFILE_PATH), { recursive: true });
    fs.writeFileSync(CHILD_PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf8');
  } catch (e) {
    console.error('Çocuk profili kaydedilemedi (sohbet buna rağmen devam eder):', e.message);
  }
}

let childProfile = loadChildProfile();

// Ogretmenin kimligi. Cocugun yasina ve seviyesine gore ayarlanmis.
// Bunu degistirerek ogretmenin tarzini/konusunu tamamen degistirebilirsin.
const SYSTEM_PROMPT_BASE = `Sen 8 yasindaki bir cocuga blok kodlama ogreten, Türkçe ve İngilizce konuşabilen bir öğretmensin.

Nasıl konuşursun:
- Türkçe konuşurken ana dili Türkçe olan bir öğretmen gibi, kusursuz ve doğal Türkçe kullan. Uydurma sözcük ya da yanlış çekim kullanma.
- Çocuğun son mesajının dilinde cevap ver: Türkçe soruya Türkçe, English soruya English cevap ver.
- Çocuk iki dili karıştırırsa, en çok kullandığı dili seç; isterse diğer dile nazikçe geç.
- Kısa, sıcak ve anlaşılır cümleler kur. Bir seferde en fazla üç kısa cümle söyle.
- Somut örnek ver: "3 elma + 2 elma" gibi, soyut anlatma.
- Çocuk bir şey yanlış yaptığında azarlamak yerine "Sence ne olur?" diye sor ve birlikte denemeye çağır.
- Cevabın sesli okunacak; emoji, madde işareti ve kod bloğu kullanmadan yalnızca doğal konuşma metni yaz.

Öğretim yöntemin:
- Çocuğun kodlama temelinin hiç olmadığını varsay. "Döngü", "komut" veya "algoritma" gibi sözcükleri önce çok basitçe açıklamadan kullanma.
- Dersin başında çocuğa seçim yükleme. "Hangi bloğu koymak istersin?" diye sorma.
- Bunun yerine çok küçük, somut bir hedef belirle: örneğin "Arabayı bayrağa götürelim." Ardından yalnızca tek bir sonraki adımı söyle.
- Her adımda bloğun TAM OLARAK asağıdaki dört isimden birini kullanarak söyle: "Soldaki ileri git bloğunu alıp ortadaki boş alana bırak." Çocuk deneyince sonucu anlat ve bir sonraki tek adıma geç.
- Önce ileri git, sonra dön, sonra zıpla; tekrar bloğunu en son ve yalnızca çocuk temel hareketleri anladığında öğret.
- Çocuk ne yapacağını bilmiyorsa cevabı sen ver; tahmin etmesi için zorlamadan birlikte uygula.
- Başarıyı kısa ve içten biçimde kutla. Hata olursa "Sorun değil, birlikte düzeltiriz" diyerek tek bir düzeltme öner.

Öğrettiğin kavramlar: sıralı komutlar, tekrar (döngü), koşul (eğer-o zaman),
değişken. Çocuk ekranda blokları sürükleyip bırakıyor - ekranda TAM OLARAK
şu DÖRT blok var, BAŞKA HİÇBİR blok/varyant YOK:
- "ileri git"
- "dön" — DİKKAT: sadece TEK bir dön bloğu var, HER ZAMAN saat yönünde 90°
  döner. "sağa dön", "sola dön", "kırmızı dön", "sarı sağa dön" gibi ayrı
  bloklar YOKTUR ve ASLA yokmuş gibi söyleme/uydurma - sadece "dön bloğu" de.
- "zıpla"
- "N kere tekrarla"
Blokların rengini SÖYLEME (renk çocuğa göre değişebilir, ekranda net görünür
zaten) - sadece yukarıdaki dört isimden BİRİNİ, başka hiçbir sıfat/varyant
eklemeden söyle.

Çocuk konu dışına çıkarsa kısa cevapla, sonra nazikçe kodlamaya geri döndür.`;

// PYTHON MODU - kullanicinin acik istegi (2026-08-31): "python kullanimi ve
// egitimi cok onemli... ai ogretmen otomatik python indirip kursun ve neyi
// nasil yapacagini cocuga soylesin." Blok ogretmeninin AYNI sicak/adim-adim
// tarzi, ama GERCEK Python sozdizimi icin ozel kurallarla - bkz. asagidaki
// "SESLE OKUNACAK" notu, blok tarafinda olmayan bir gereksinim (cocuk ekrandaki
// parantez/tirnak gibi sembolleri KENDI BASINA okuyamayabilir).
const PYTHON_SYSTEM_PROMPT_BASE = `Sen 8 yasindaki bir cocuga GERCEK Python kodu yazmayi ogreten, Türkçe ve İngilizce konuşabilen bir öğretmensin.

Nasıl konuşursun (blok dersleriyle AYNI kurallar):
- Türkçe konuşurken kusursuz/doğal Türkçe kullan, çocuğun son mesajının dilinde cevap ver.
- Kısa, sıcak, en fazla üç kısa cümle. Somut örnek ver, soyut anlatma.
- Cevabın sesli okunacak; emoji, madde işareti, markdown KULLANMA - doğal konuşma metni yaz.

Python'a ÖZEL kural (bloklardan FARKI budur): çocuk ekrandaki kodu kendi başına
okuyamayabilir - bir satırı SÖYLERKEN her sembolü KELİMEYLE söyle: "parantez aç",
"parantez kapat", "tırnak işareti", "eşittir işareti", "iki nokta üst üste",
"girinti" (satır başındaki boşluk). Örnek: print parantez aç tırnak işareti
Merhaba tırnak işareti parantez kapat, gibi.

Öğretim yöntemin:
- Çocuğa asla boş bir ekrandan başlatma - her ders için ekranda ZATEN yazılı
  bir başlangıç kodu var, senin işin çocuğa TEK bir küçük değişiklik yaptırmak
  (bir kelimeyi/sayıyı değiştirmek gibi) ve "Çalıştır" düğmesine bastırmak.
- Kod çalıştırıldığında gerçek çıktı ya da gerçek bir Python hatası sana
  otomatik olarak bildirilir ("[Kodu çalıştırdım] Çıktı: ..." ya da "Hata
  oluştu: ..." şeklinde bir sistem mesajı olarak). Bunu GÖRÜNCE tepki ver -
  hata varsa çocuğu suçlamadan "Python bize şunu söylüyor" diyerek basitçe
  açıkla ve TEK bir düzeltme öner; çıktı doğruysa kısaca kutla ve bir sonraki
  küçük adımı söyle.
- Bir işlevi/kütüphaneyi (import, pip, turtle gibi) ASLA önerme - şu an sadece
  print, değişken, sayı, basit for/if kullanılabiliyor, başka hiçbir şey kurulu
  değil.

Çocuk konu dışına çıkarsa kısa cevapla, sonra nazikçe Python'a geri döndür.`;

// Her cagrida GUNCEL profille birlikte kurulur (childProfile.summary bir
// onceki cagridan sonra degismis olabilir - bkz. refreshChildProfile).
// mode: 'blockly' (varsayilan, geriye donuk uyumlu) | 'python'.
function buildSystemPrompt(mode) {
  const base = mode === 'python' ? PYTHON_SYSTEM_PROMPT_BASE : SYSTEM_PROMPT_BASE;
  let prompt = base;
  if (childProfile.summary) {
    prompt += `\n\nBu çocukla önceki derslerden hatırladıkların (kalıcı hafızandan): ` +
      `${childProfile.summary}\nOnu SIFIRDAN tanıyormuş gibi değil, kaldığın yerden devam ediyormuş gibi konuş; ` +
      `bildiğin şeyleri tekrar açıklamadan öğretimini buna göre uyarla.`;
  }
  // GERCEK bir eksiklik duzeltildi: templateProgress hep diske yaziliyordu
  // ama AI'a hicbir zaman GERI verilmiyordu (sadece serbest-metin "summary"
  // kullaniliyordu) - Python Modu icin bunu atlamiyoruz, hangi derslerin
  // tamamlandigi AI cagrisi GEREKMEDEN (ucretsiz/aninda) dogrudan eklenir.
  if (mode === 'python') {
    const completed = Object.entries(childProfile.pythonProgress || {})
      .filter(([, v]) => v.completed).map(([id]) => id);
    if (completed.length > 0)
      prompt += `\n\nÇocuğun tamamladığı Python dersleri: ${completed.join(', ')}. Bunları tekrar en baştan anlatma, kaldığı yerden devam et.`;
  }
  return prompt;
}

// Konusma gecmisi (KISA VADELI - RAM'de, uygulama kapaninca sifirlanir).
// Cocugun ayni oturum icinde her soruda sifirdan baslamamasi icindir - UZUN
// VADELI hafiza (cocugu GENEL olarak tanima) childProfile'da, KALICI olarak
// tutulur, bkz. yukarisi.
let conversationHistory = [];
const MAX_HISTORY = 20; // son 20 mesaj (10 soru-cevap) hatirlanir

// Her kac mesajda bir cocuk-profili AI ile yenilensin. GERCEKTEN yasandi:
// 6 idi - cogu gercek deneme/oturum 6 mesaja hic ulasmiyordu, yani profil
// ASLA diske yazilmiyordu ("kapatip tekrar acinca hicbir sey hatirlamiyor"
// sikayeti buradan geliyordu). 2'ye indirildi - conversationHistory.length>=4
// sarti zaten en az 2 gercek karsilikli konusma garanti ediyor, kisa bir
// denemede bile profil diske yazilsin diye.
const PROFILE_REFRESH_EVERY = 2;
let messagesSinceProfileRefresh = 0;

// Profili GUNCELLER - ana sohbet cevabini ASLA BEKLETMEZ (fire-and-forget,
// ai:ask handler'i tarafindan await EDILMEDEN cagrilir) ve basarisiz olursa
// SESSIZCE gecer (cocugun sohbeti hicbir zaman bundan etkilenmemeli).
async function refreshChildProfile() {
  if (!GROQ_API_KEY || conversationHistory.length < 4) return;
  try {
    const recentText = conversationHistory.slice(-12)
      .map((m) => `${m.role === 'user' ? 'Çocuk' : 'Öğretmen'}: ${m.content}`)
      .join('\n');
    const prompt = `Bir çocuğa blok-kodlama öğreten bir öğretmen AI'sın. Bu çocuk hakkında ŞİMDİYE KADAR ` +
      `bildiklerin: "${childProfile.summary || 'henüz yok'}"\n\nSon konuşmadan bir kesit:\n${recentText}\n\n` +
      `Bu bilgiyi GÜNCELLE: çocuğun öğrenme tarzı (kısa mı uzun mu açıklama seviyor, örnekle mi anlıyor), ` +
      `hangi kavramlarda zorlandığı/kolay kavradığı, ilgi alanları, dil tercihi gibi SONRAKİ bir öğretmenin ` +
      `işine yarayacak şeyleri 2-4 kısa Türkçe cümleyle özetle. Sadece özet metnini yaz, başka açıklama ekleme.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        reasoning_effort: 'none',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 200
      })
    });
    if (!response.ok) return;
    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();
    if (newSummary) {
      childProfile.summary = newSummary;
      childProfile.lastUpdated = new Date().toISOString();
      saveChildProfile(childProfile);
    }
  } catch (e) {
    console.error('Çocuk profili güncellenemedi (sohbet buna rağmen devam eder):', e.message);
  }
}

ipcMain.handle('ai:ask', async (event, userText, mode) => {
  if (!GROQ_API_KEY) {
    return 'API anahtari bulunamadi. Proje klasorunde .env dosyasi olusturup icine GROQ_API_KEY=... yazman gerekiyor.';
  }

  conversationHistory.push({ role: 'user', content: userText });

  // Gecmis cok uzarsa bastan kirp (context sinirini asmamak icin)
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        // Qwen'in iç düşünme metnini göstermeden, çocukla akıcı konuşmasını sağla.
        reasoning_effort: 'none',
        messages: [
          { role: 'system', content: buildSystemPrompt(mode) },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 300 // cocuk icin kisa cevaplar yeterli
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API hatasi:', response.status, errText);
      if (response.status === 429) {
        return 'Biraz hizli gittik galiba. Birkac saniye bekleyip tekrar sorar misin?';
      }
      if (response.status === 401 || response.status === 403) {
        return 'API anahtarını kontrol etmem gerekiyor. Sağ üstteki API Anahtarı düğmesinden yeniden kaydedebilirsin.';
      }
      return 'Su an cevap veremiyorum, baglantida bir sorun var. Birazdan tekrar dene.';
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return 'Bir sey ters gitti, cevabi alamadim. Tekrar sorar misin?';
    }

    conversationHistory.push({ role: 'assistant', content: reply });

    // Cocuk-profilini yenile - cevabi BEKLETMEDEN (await YOK, kasitli).
    messagesSinceProfileRefresh++;
    if (messagesSinceProfileRefresh >= PROFILE_REFRESH_EVERY) {
      messagesSinceProfileRefresh = 0;
      refreshChildProfile();
    }

    return reply;

  } catch (err) {
    console.error('Groq baglanti hatasi:', err);
    return 'Internete baglanamadim galiba. Baglantini kontrol edip tekrar dene.';
  }
});

// ---------------------------------------------------------------
// SES -> METIN (Groq Whisper) - GERCEKTEN yasandi: Electron'un icindeki
// ciplak Chromium'da webkitSpeechRecognition (tarayici SpeechRecognition API'si)
// GUVENILIR CALISMIYOR - Google'in bulut konusma servisine erismek icin
// gereken API anahtari gercek Chrome'da var, ciplak Chromium'da (Electron'un
// kullandigi) YOK. Sonuc: sessizce "network" hatasi verip sonsuza kadar
// yeniden deniyor, cocuk konusuyor ama hicbir sey olmuyordu. Bunun yerine
// renderer gercek sesi kaydedip (MediaRecorder) buraya gonderiyor, biz de
// ZATEN kullandigimiz Groq anahtariyla /audio/transcriptions'a yolluyoruz -
// yeni bir anahtar/servis gerekmiyor.
// ---------------------------------------------------------------
ipcMain.handle('audio:transcribe', async (event, arrayBuffer, mimeType, language) => {
  if (!GROQ_API_KEY) return { ok: false, text: '' };
  try {
    const form = new FormData();
    form.append('file', new Blob([arrayBuffer], { type: mimeType || 'audio/webm' }), 'ses.webm');
    form.append('model', 'whisper-large-v3-turbo');
    if (language) form.append('language', language); // 'tr' | 'en'
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: form
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq ses-yaziya-cevirme hatasi:', response.status, errText);
      return { ok: false, text: '' };
    }
    const data = await response.json();
    return { ok: true, text: (data.text || '').trim() };
  } catch (e) {
    console.error('Ses yazıya çevrilemedi:', e.message);
    return { ok: false, text: '' };
  }
});

// Sohbeti sifirlamak icin (istenirse arayuze bir buton eklenebilir) - SADECE
// bu OTURUMUN kisa vadeli konusma gecmisini temizler, cocuk-profilini
// (kalici hafiza) ETKILEMEZ - "yeni ders" cocugu unutmamali.
ipcMain.handle('ai:reset', async () => {
  conversationHistory = [];
  messagesSinceProfileRefresh = 0;
  return { ok: true };
});

// Blockly calistiricisindan (renderer.js) gelir - AI cagrisi GEREKMEZ, ucretsiz/
// aninda. Hangi sablonun kac kez denendigini/tamamlandigini kalici profile yazar.
ipcMain.handle('progress:template-event', (event, templateId, kind) => {
  if (!templateId) return { ok: false };
  const entry = childProfile.templateProgress[templateId] || { attempts: 0, completed: false };
  if (kind === 'attempt') entry.attempts += 1;
  if (kind === 'completed') entry.completed = true;
  entry.lastAt = new Date().toISOString();
  childProfile.templateProgress[templateId] = entry;
  saveChildProfile(childProfile);
  return { ok: true };
});

// progress:template-event ile AYNI desen, Python dersleri icin.
ipcMain.handle('progress:python-event', (event, lessonId, kind) => {
  if (!lessonId) return { ok: false };
  const entry = childProfile.pythonProgress[lessonId] || { attempts: 0, completed: false };
  if (kind === 'attempt') entry.attempts += 1;
  if (kind === 'completed') entry.completed = true;
  entry.lastAt = new Date().toISOString();
  childProfile.pythonProgress[lessonId] = entry;
  saveChildProfile(childProfile);
  return { ok: true };
});

// ---------------------------------------------------------------
// PIPER TTS ENTEGRASYONU
// Piper, tamamen ucretsiz/acik kaynak, YEREL calisan noral bir ses
// motoru - internet gerektirmez, hicbir hesap/API key istemez.
// Chromium'un yerlesik sesinden cok daha dogal cikar.
//
// Kurulum (kullanicinin kendisinin yapmasi gereken tek seferlik adim):
//   1) https://github.com/rhasspy/piper adresinden Windows icin
//      piper.exe dosyasini indir.
//   2) Turkce bir ses modeli indir (orn. "tr_TR-fahrettin-medium" ya da
//      "tr_TR-dfki-medium" - Piper'in resmi ses listesinde mevcut),
//      .onnx ve .onnx.json dosyalarini birlikte indir.
//   3) Bu ikisini asagidaki PIPER_DIR / MODEL yollarina yerlestir:
//        piper/piper.exe
//        piper/models/tr_TR-model-adi.onnx
//        piper/models/tr_TR-model-adi.onnx.json
//   4) Uygulamayi yeniden baslat - artik Piper otomatik kullanilacak.
//
// Piper kurulu degilse (dosyalar bulunamazsa), uygulama otomatik
// olarak Chromium'un yerlesik sesine geri doner (renderer.js'de
// fallback mantigi var) - yani bu adim atlanirsa da uygulama calisir,
// sadece ses daha az dogal olur.
// ---------------------------------------------------------------

const PIPER_DIR = path.join(__dirname, 'piper');
const PIPER_EXE = path.join(PIPER_DIR, process.platform === 'win32' ? 'piper.exe' : 'piper');
const PIPER_MODEL = path.join(PIPER_DIR, 'models', 'tr_TR-model.onnx');

function piperAvailable() {
  return fs.existsSync(PIPER_EXE) && fs.existsSync(PIPER_MODEL);
}

ipcMain.handle('tts:speak', async (event, text) => {
  if (!piperAvailable()) {
    // Piper kurulu degil -> renderer tarafina "yok" bilgisini donuyoruz,
    // renderer bunun uzerine Chromium'un yerlesik sesine geri donecek.
    return { ok: false, reason: 'piper-not-installed' };
  }

  const outFile = path.join(os.tmpdir(), `ogretmen-ai-tts-${Date.now()}.wav`);

  return new Promise((resolve) => {
    const proc = spawn(PIPER_EXE, [
      '--model', PIPER_MODEL,
      // GERCEKTEN yasandi (AvenSmith'in kendi Piper entegrasyonunda, ayni
      // sorun): --length_scale verilmezse Piper'in KENDI varsayilani 1.0'da
      // kalir, bu da cocuklar icin gereksiz yavas/agir bir ses cikarir.
      // 0.85 GERCEK olcumlerle dogrulanmis (ayni motor, farkli proje) -
      // duzgun anlasilir kalirken belirgin sekilde daha dogal/hizli konusuyor.
      '--length_scale', '0.85',
      '--output_file', outFile
    ]);

    let errorOutput = '';
    proc.stderr.on('data', (d) => { errorOutput += d.toString(); });

    proc.on('error', () => {
      resolve({ ok: false, reason: 'piper-spawn-failed' });
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outFile)) {
        try {
          const audioBuffer = fs.readFileSync(outFile);
          fs.unlink(outFile, () => {}); // gecici dosyayi temizle
          resolve({
            ok: true,
            audioBase64: audioBuffer.toString('base64')
          });
        } catch (e) {
          resolve({ ok: false, reason: 'read-failed' });
        }
      } else {
        resolve({ ok: false, reason: 'piper-error', detail: errorOutput });
      }
    });

    // Piper metni stdin uzerinden alir
    proc.stdin.write(text);
    proc.stdin.end();
  });
});

// ---------------------------------------------------------------
// PYTHON MODU - kullanicinin acik istegi (2026-08-31): "ai ogretmen otomatik
// python indirip kursun". python.org'un RESMI "embeddable package"i kullanilir
// (kurulumsuz, admin hakki gerektirmeyen kucuk bir zip - normal Windows
// yukleyicisinin AKSINE) - ilk kez Python Modu'na girildiginde indirilip
// userData altina cikartilir, sonraki acilislarda tekrar indirilmez.
//
// KAPSAM DISI (bilerek): pip/paket kurulumu, import gerektiren kutuphaneler
// (turtle/random vb.) - embeddable paketin varsayilan _pth dosyasi bunlari
// zaten kapatiyor, print/degisken/for/if gibi SADECE yerlesik (builtin)
// ozellikler icin bu hic sorun degil, mufredat da (asagida renderer.js'de)
// buna gore sinirli tutuldu.
// ---------------------------------------------------------------

const PYTHON_VERSION = '3.12.7';
const PYTHON_DIR = path.join(app.getPath('userData'), 'python-runtime', PYTHON_VERSION);
const PYTHON_EXE_WIN = path.join(PYTHON_DIR, 'python.exe');
// Gelistirici kolayligi: bu depo Linux'ta `npm start` ile de calisiyor -
// paketlenmis surum SADECE Windows (NSIS) olarak dagitiliyor, ama Linux'ta
// gelistirirken embeddable zip'i indirmeye UGRASMADAN sistemde zaten kurulu
// python3/python'u kullanmak pratik bir gelistirici kolayligidir (SADECE
// win32 DISINDA devreye girer, paketlenmis davranisi hic etkilemez).
function resolvePythonExePath() {
  if (process.platform === 'win32') return PYTHON_EXE_WIN;
  return null; // asagida PATH'ten python3/python aranir
}

function pythonEmbeddableUrl() {
  return `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
}

let pythonEnsureInFlight = null;

function isPythonReady() {
  if (process.platform !== 'win32') return true; // gelistirici modunda PATH'e guveniyoruz
  return fs.existsSync(PYTHON_EXE_WIN);
}

// Ilk kez Python Modu'na girildiginde cagrilir - zaten kuruluysa aninda doner.
// Ayni anda birden fazla cagri gelirse (cift tiklama gibi) TEK bir indirmeyi
// paylasirlar (pythonEnsureInFlight).
async function ensurePythonInstalled() {
  if (isPythonReady()) return { ok: true, alreadyInstalled: true };
  if (process.platform !== 'win32') {
    return { ok: false, reason: 'not-windows', message: 'Bu özellik şu an sadece Windows sürümünde otomatik kuruluyor.' };
  }
  if (pythonEnsureInFlight) return pythonEnsureInFlight;

  pythonEnsureInFlight = (async () => {
    try {
      fs.mkdirSync(PYTHON_DIR, { recursive: true });
      const response = await fetch(pythonEmbeddableUrl());
      if (!response.ok) return { ok: false, reason: 'download-failed', status: response.status };
      const buffer = Buffer.from(await response.arrayBuffer());
      const zipPath = path.join(PYTHON_DIR, 'python-embed.zip');
      fs.writeFileSync(zipPath, buffer);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(PYTHON_DIR, true);
      fs.unlink(zipPath, () => {}); // gecici zip'i temizle
      if (!fs.existsSync(PYTHON_EXE_WIN)) return { ok: false, reason: 'extract-incomplete' };
      return { ok: true, alreadyInstalled: false };
    } catch (e) {
      console.error('Python indirilemedi/kurulamadi:', e.message);
      return { ok: false, reason: 'error', message: e.message };
    } finally {
      pythonEnsureInFlight = null;
    }
  })();
  return pythonEnsureInFlight;
}

ipcMain.handle('python:get-status', () => ({ installed: isPythonReady(), version: PYTHON_VERSION }));
ipcMain.handle('python:ensure-installed', () => ensurePythonInstalled());

// Cocugun yazdigi kodu GERCEKTEN calistirir. Tek-kullanicili yerel bir masaustu
// uygulamasi oldugu icin (paylasimli/coklu-kullanicili bir sunucu DEGIL) asil
// gercekci risk kotu niyetli kod degil, bir cocugun yanlislikla yazdigi sonsuz
// dongu/asiri uzun ciktidir - bunun icin execFile'in KENDI timeout/maxBuffer
// mekanizmasi kullanilir (elle setTimeout+kill YAZILMADI, gereksiz).
ipcMain.handle('python:run-code', async (event, code) => {
  const exePath = resolvePythonExePath();
  const command = exePath || 'python3'; // exePath sadece win32'de dolu, digerlerinde PATH'teki python3 kullanilir
  if (process.platform === 'win32' && !isPythonReady()) {
    return { ok: false, reason: 'python-not-installed' };
  }
  const tmpFile = path.join(os.tmpdir(), `ogretmen-ai-run-${Date.now()}.py`);
  fs.writeFileSync(tmpFile, code || '', 'utf8');

  return new Promise((resolve) => {
    execFile(command, [tmpFile], {
      timeout: 10000,       // 10sn - sonsuz donguye giren cocuk kodu sonsuza kadar takilmasin
      killSignal: 'SIGKILL',
      maxBuffer: 2 * 1024 * 1024, // 2MB - hizli bir print dongusu bile bunu asamaz once timeout dolar
      windowsHide: true
    }, (error, stdout, stderr) => {
      fs.unlink(tmpFile, () => {}); // gecici .py dosyasini temizle
      const timedOut = Boolean(error && error.killed && error.signal === 'SIGKILL');
      resolve({
        ok: !error,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        timedOut,
        exitCode: error ? (typeof error.code === 'number' ? error.code : null) : 0
      });
    });
  });
});
