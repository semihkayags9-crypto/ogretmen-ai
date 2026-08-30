// preload.js
// Renderer (index.html/renderer.js) ile main.js arasinda guvenli bir kopru kurar.
// nodeIntegration kapali oldugu icin renderer'a sadece burada tanimladigimiz
// fonksiyonlar acik olur.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ogretmenAPI', {
  // Kullanicinin yazdigi/soyledigi metni AI'a gonderir, cevabi dondurur.
  askAI: (text) => ipcRenderer.invoke('ai:ask', text),
  // Metni Piper TTS ile sese cevirir (kurulu degilse ok:false doner,
  // renderer bu durumda Chromium'un yerlesik sesine geri doner).
  speak: (text) => ipcRenderer.invoke('tts:speak', text),
  // Sohbet gecmisini sifirlar (yeni bir ders/oturum baslatmak icin).
  resetChat: () => ipcRenderer.invoke('ai:reset'),
  // Anahtarin kendisini renderer'a vermeden sadece durumunu bildirir ve kaydeder.
  getApiKeyStatus: () => ipcRenderer.invoke('settings:get-api-key-status'),
  saveApiKey: (apiKey) => ipcRenderer.invoke('settings:save-api-key', apiKey),
  // Bir sablonun denendigini/tamamlandigini kalici cocuk-profiline bildirir
  // (kind: 'attempt' | 'completed'). AI cagirmaz, aninda/ucretsiz.
  reportTemplateProgress: (templateId, kind) => ipcRenderer.invoke('progress:template-event', templateId, kind),
  // Kaydedilmis bir ses parcasini (ArrayBuffer) Groq Whisper ile metne cevirir.
  // Electron'un icindeki ciplak Chromium'da webkitSpeechRecognition GUVENILIR
  // CALISMIYOR (Google'in bulut konusma servisi icin gereken API anahtari
  // ciplak Chromium'da yok) - bunun yerine gercek ses kaydedilip Groq'un
  // /audio/transcriptions ucuna gonderiliyor.
  transcribeAudio: (arrayBuffer, mimeType, language) => ipcRenderer.invoke('audio:transcribe', arrayBuffer, mimeType, language)
});
