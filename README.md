# Turkish Gaming Chat v1.0 Beta 🎮

## 🐱 İlk Beta Sürümü

Türkiye için özel olarak tasarlanmış oyun sohbet platformu. Discord alternatifi modern ve kullanıcı dostu uygulama.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Basit Kayıt/Giriş**: Kullanıcı adı, görünen ad ve şifre
- **Arkadaş Sistemi**: Kullanıcı adı ile arkadaş ekleme
- **Direkt Mesajlaşma**: Birebir sohbet imkanı
- **Resim Paylaşımı**: Resim gönderme ve PC'ye kaydetme

### 🎮 Oyun Entegrasyonu
- **Oyun Takibi**: Otomatik oyun algılama
- **Durum Gösterimi**: Hangi oyunda olduğunuzu paylaşma
- **Oyun Süresi**: Oyun sürenizi takip etme

### 🔐 Güvenlik
- **Güvenli Arayüz**: Sağ tık ve geliştirici araçları engelleme
- **Şifre Değiştirme**: Kullanıcı ayarlarından şifre güncelleme

### 🎨 Modern Tasarım
- **Glassmorphism**: Modern cam efekti tasarım
- **Responsive**: Tüm ekran boyutlarına uyumlu
- **Dark Theme**: Göz yormayan koyu tema

## ⚠️ Beta Notları

- Görüntülü arama (henüz aktif değil)
- Sesli arama geliştirme aşamasında (sıkıntıları olabilir)
- Grup Sohbetleri: Çoklu kullanıcı sohbetleri (yapım aşamasında)
- Emoji Desteği: Zengin emoji kütüphanesi (şuanlık yok)

## 🚀 Gelecek Sürümler

- [ ] Sesli arama özelliği
- [ ] Görüntülü arama özelliği
- [ ] Sunucu tabanlı arkadaşlık sistemi
- [ ] Gerçek zamanlı oyun takibi
- [ ] Bildirim sistemi

## 📦 İndirme

### macOS
- **Dosya**: `Miyav-1.0.0-arm64.dmg` (Apple Silicon)
- **Dosya**: `Miyav-1.0.0-universal.dmg` (Intel + Apple Silicon)
- **Platform**: macOS 10.12+

### Windows
- **Dosya**: `Miyav Setup 1.0.0.exe`
- **Platform**: Windows 10+

## 🔒 macOS Güvenlik Uyarısı

macOS'ta "hasar görmüş" uyarısı alırsanız:

### Terminal ile Çözüm:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Miyav.app
```

### Finder ile Çözüm:
1. Applications klasörüne gidin
2. Miyav.app'e sağ tıklayın
3. "Get Info" (Bilgi Al) seçin
4. "Open Anyway" (Yine de Aç) butonuna tıklayın

### Güvenlik Ayarları:
1. System Preferences → Security & Privacy
2. "General" sekmesi
3. "Allow apps downloaded from" altında "App Store and identified developers" seçin

## 🔧 Kurulum

### Geliştirme Ortamı

```bash
# Projeyi klonlayın
git clone [repository-url]
cd CSRChat

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start
```

### Build Alma

```bash
# macOS için
npm run build:mac

# Windows için
npm run build:win

# Universal macOS build
npm run build:mac -- --universal
```

## 🐛 Bilinen Sorunlar

### macOS Güvenlik Uyarısı
Mac'te "hasar gördüğü için açılmıyor" hatası alırsanız Terminal'e şunu yazın:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Turkish\ Gaming\ Chat.app
```

## 📝 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 İletişim

- **Geliştirici**: Turkish Gaming Chat Team
- **Versiyon**: 1.0.0 Beta
- **Platform**: macOS, Windows

---

**Turkish Gaming Chat** - Türkiye'nin oyun sohbet platformu 🎮✨ 