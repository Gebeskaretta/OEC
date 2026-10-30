# Otomachine Engine Creator (v1.1)

Automation tarzı 3D motor simülatörü ve tasarım oyunu. Three.js ve Capacitor ile geliştirilmiştir.

## 🚀 GitHub Actions ile Otomatik APK Derleme

Bu depoda GitHub Actions entegrasyonu kurulmuştur:

1. **Otomatik Derleme:** Projeyi GitHub'a push ettiğinizde veya pull request açtığınızda `.github/workflows/build-apk.yml` otomatik çalışır.
2. **Manuel Tetikleme (Tek Tık):**
   - GitHub deponuzda **Actions** sekmesine gidin.
   - Sol menüden **"Android APK Otomatik Derleme (Capacitor)"** seçin.
   - Sağdaki **"Run workflow"** butonuna tıklayın.
3. **APK'yı İndirme:**
   - Derleme tamamlandığında iş akışının içine girin.
   - En alttaki **Artifacts** bölümünden **`Otomachine-Engine-Creator-v1.1-APK`** dosyasını indirip Android cihazınıza yükleyebilirsiniz.

---

## 🛠️ Yerel Geliştirme ve Capacitor Komutları

```bash
# Bağımlılıkları yükleme
npm install

# Geliştirici sunucusu
npm run dev

# Web derlemesi
npm run build

# Capacitor ile Android projesini senkronize etme
npm run cap:build

# Android Studio'da açma
npx cap open android
```

## 📱 Özellikler
- Tamamen Türkçe arayüz
- Yatay (Landscape) odaklı mobil uyumluluk
- WebGL & Three.js prosedürel 3D motor modelleme (Bloğu, Pistonlar, Krank, Turbo, Egzoz, ITB vb.)
- Web Audio API ile gerçek zamanlı motor sesi ve devir sentezi
- Dyno testi, tork/beygir gücü eğrisi ve parça dayanıklılık limitleri
- LocalStorage garaj kayıt sistemi ve JSON içe/dışa aktarma
