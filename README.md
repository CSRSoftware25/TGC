# Miyav v1.0.1 - Türkiye için Özel Oyun Sohbet Platformu 🐱

## 🚀 Yeni Sürüm - Tam Backend Altyapısı

Türkiye için özel olarak tasarlanmış oyun sohbet platformu. Discord alternatifi modern ve kullanıcı dostu uygulama. Artık tam sunucu tabanlı altyapı ile!

## ✨ Özellikler

### 🚀 Yeni v1.0.1 Özellikleri
- **GitHub OAuth**: Tek tıkla GitHub hesabıyla giriş
- **Gerçek Zamanlı Sohbet**: Socket.IO ile anlık mesajlaşma
- **Sunucu Tabanlı Veri**: Tüm veriler güvenli sunucuda saklanıyor
- **Otomatik Sunucu**: Uygulama açıldığında sunucu otomatik başlıyor
- **Bildirim Sistemi**: Arkadaş istekleri ve yeni mesaj bildirimleri
- **Dosya Paylaşımı**: Resim ve dosya yükleme sistemi
- **Güvenlik**: Rate limiting, input validation, XSS koruması

### 🎯 Temel Özellikler
- **Güvenli Kayıt/Giriş**: JWT token tabanlı kimlik doğrulama
- **Arkadaş Sistemi**: Kullanıcı arama ve arkadaş ekleme
- **Direkt Mesajlaşma**: Birebir sohbet imkanı
- **Resim Paylaşımı**: Resim gönderme ve PC'ye kaydetme

### 🎮 Oyun Entegrasyonu
- **Oyun Takibi**: Otomatik oyun algılama
- **Durum Gösterimi**: Hangi oyunda olduğunuzu paylaşma
- **Oyun Süresi**: Oyun sürenizi takip etme

### 🔐 Güvenlik
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **Rate Limiting**: API koruması
- **Input Validation**: Giriş verilerinin doğrulanması
- **XSS Protection**: Cross-site scripting koruması
- **Güvenli Arayüz**: Sağ tık ve geliştirici araçları engelleme

### 🎨 Modern Tasarım
- **Glassmorphism**: Modern cam efekti tasarım
- **Responsive**: Tüm ekran boyutlarına uyumlu
- **Dark Theme**: Göz yormayan koyu tema

## ⚠️ v1.0.1 Notları

- ✅ GitHub OAuth ile güvenli giriş
- ✅ Gerçek zamanlı mesajlaşma
- ✅ Sunucu tabanlı veri saklama
- ✅ Otomatik sunucu başlatma
- 🔄 Görüntülü arama (geliştirme aşamasında)
- 🔄 Sesli arama (geliştirme aşamasında)
- 🔄 Grup Sohbetleri (geliştirme aşamasında)
- 🔄 Emoji Desteği (gelecek sürümde)

## 🚀 Gelecek Sürümler

- [x] ✅ Sunucu tabanlı arkadaşlık sistemi
- [x] ✅ Gerçek zamanlı oyun takibi
- [x] ✅ Bildirim sistemi
- [x] ✅ GitHub OAuth girişi
- [ ] Sesli arama özelliği
- [ ] Görüntülü arama özelliği
- [ ] Grup sohbetleri
- [ ] Emoji desteği

## 📦 İndirme

### macOS
- **Dosya**: `Miyav-1.0.1-arm64.dmg` (Apple Silicon)
- **Dosya**: `Miyav-1.0.1-universal.dmg` (Intel + Apple Silicon)
- **Platform**: macOS 10.12+

### Windows
- **Dosya**: `Miyav Setup 1.0.1.exe`
- **Platform**: Windows 10+

### 🚀 Yeni Özellikler
- **Otomatik Sunucu**: Uygulama açıldığında backend otomatik başlar
- **GitHub OAuth**: Tek tıkla GitHub hesabıyla giriş
- **Gerçek Zamanlı**: Socket.IO ile anlık mesajlaşma
- **Güvenli Veri**: MongoDB ile sunucu tabanlı veri saklama

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
git clone https://github.com/CSRSoftware25/Miyav.git
cd Miyav

# Bağımlılıkları yükleyin
npm install

# Server bağımlılıklarını yükleyin
cd server && npm install && cd ..

# Uygulamayı başlatın (server otomatik başlar)
npm start
```

### 🚀 Otomatik Kurulum
Uygulama ilk açılışta:
- ✅ Server'ı otomatik başlatır
- ✅ .env dosyasını oluşturur
- ✅ Dependencies'leri kontrol eder
- ✅ MongoDB bağlantısını kurar

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

- **Geliştirici**: CSR Software
- **Versiyon**: 1.0.1
- **Platform**: macOS, Windows
- **GitHub**: https://github.com/CSRSoftware25/Miyav

---

**Miyav** - Türkiye'nin oyun sohbet platformu 🎮✨
