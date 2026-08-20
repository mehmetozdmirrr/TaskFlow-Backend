# TaskFlow — Görev ve Proje Yönetim Sistemi

TaskFlow, küçük yazılım ekiplerinin görev oluşturmasını, çalışanlara
atamasını, durum ve önceliklerini takip etmesini sağlayan bir REST API ve bu
API'yi kullanan responsive bir web arayüzüdür. Veriler bir veritabanı
yerine `data/tasks.json` dosyasında tutulur; kimlik doğrulama veya
kullanıcı girişi bulunmaz.

## GitHub Repository

[https://github.com/mehmetozdmirrr/TaskFlow-Backend](https://github.com/mehmetozdmirrr/TaskFlow-Backend)

## İçindekiler

- [Özellikler](#özellikler)
- [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Çalıştırma](#çalıştırma)
- [Proje/Klasör Yapısı](#projeklasör-yapısı)
- [Task Veri Modeli](#task-veri-modeli)
- [API Rotaları](#api-rotaları)
- [Cevap Biçimi](#cevap-biçimi)
- [Doğrulama ve Hata Davranışı](#doğrulama-ve-hata-davranışı)
- [JSON Dosyası Kalıcılığı](#json-dosyası-kalıcılığı)
- [Frontend](#frontend)
- [Erişilebilirlik ve Responsive Tasarım](#erişilebilirlik-ve-responsive-tasarım)
- [Postman ile Test](#postman-ile-test)
- [Test ve Doğrulama Özeti](#test-ve-doğrulama-özeti)
- [Bilinen Sınırlamalar](#bilinen-sınırlamalar)
- [Proje Bilgisi](#proje-bilgisi)

## Özellikler

- Görevler için tam CRUD işlemleri (oluşturma, listeleme, detay, güncelleme,
  silme)
- Duruma ve önceliğe göre filtreleme
- Başlık ve açıklamada büyük/küçük harf duyarsız anahtar kelime araması
- Çalışana göre görev listeleme (büyük/küçük harf duyarsız)
- Oluşturulma tarihine göre artan/azalan sıralama
- Sayfalama (`page`, `limit`)
- Tamamlanan, bekleyen ve genel özet raporları
- Tüm istekler için method, endpoint, durum kodu ve süreyi kaydeden logger
- POST/PUT gövdeleri için sunucu taraflı doğrulama
- `data/tasks.json` dosyasında kalıcı veri saklama (veritabanı yok)
- Vanilla HTML/CSS/JavaScript ile responsive, erişilebilir bir web arayüzü

## Kullanılan Teknolojiler

- Node.js (18 veya üzeri)
- Express.js 5
- `dotenv` (ortam değişkenleri için)
- `nodemon` (yalnızca geliştirme bağımlılığı)
- Node.js `fs/promises` modülü ile JSON dosya kalıcılığı
- Vanilla HTML, CSS ve JavaScript (derleme aracı veya framework yok)

Veritabanı, kimlik doğrulama, Docker, dış barındırma/deployment veya
Swagger/OpenAPI bu projede kullanılmamıştır.

## Gereksinimler

- Node.js 18 veya üzeri
- npm

## Kurulum

```bash
cd taskflow-api
npm install
```

## Ortam Değişkenleri

Proje `dotenv` ile `.env` dosyasından ortam değişkeni okur. Örnek dosya
`.env.example` içinde bulunur:

```env
PORT=3000
```

Yerel çalıştırma için `.env.example` dosyasını `.env` olarak kopyalayın
(isteğe bağlıdır; `PORT` tanımlı değilse uygulama varsayılan olarak `3000`
portunu kullanır):

```bash
cp .env.example .env
```

Windows PowerShell'de:

```powershell
Copy-Item .env.example .env
```

`.env` dosyası `.gitignore` içinde hariç tutulmuştur ve bu projede gizli/özel
bir değer içermez.

## Çalıştırma

Normal (üretim benzeri) çalıştırma:

```bash
npm start
```

Geliştirme sırasında dosya değişikliklerinde otomatik yeniden başlatma için:

```bash
npm run dev
```

Sunucu varsayılan olarak **`3000`** portunda başlar. Tarayıcıda:

```text
http://localhost:3000
```

adresine gidildiğinde TaskFlow web arayüzü açılır. API doğrudan aynı adres
üzerinden (`http://localhost:3000/tasks`, `http://localhost:3000/reports/...`)
kullanılabilir.

## Proje/Klasör Yapısı

```text
taskflow-api/
├── src/
│   ├── app.js                     # Express uygulaması ve middleware/route bağlantıları
│   ├── server.js                  # Portu okuyup sunucuyu başlatır
│   ├── routes/
│   │   ├── tasks.js                # Task CRUD + arama + çalışana göre listeleme rotaları
│   │   └── reports.js              # Rapor rotaları
│   ├── middleware/
│   │   ├── logger.js                # İstek loglama
│   │   ├── validateTask.js          # POST/PUT gövde doğrulaması
│   │   ├── notFound.js              # Bilinmeyen endpoint için 404
│   │   └── errorHandler.js          # Merkezi hata işleyici
│   ├── controllers/
│   │   ├── taskController.js        # CRUD + arama + çalışana göre listeleme mantığı
│   │   └── reportController.js      # Rapor mantığı
│   └── utils/
│       ├── file.js                  # JSON dosyası okuma/yazma
│       └── taskQuery.js             # Filtre/arama/sıralama/sayfalama motoru
├── data/
│   └── tasks.json                  # Kalıcı görev verisi
├── public/
│   ├── index.html                  # TaskFlow dashboard arayüzü
│   ├── css/
│   │   └── styles.css               # Responsive stiller
│   └── js/
│       └── app.js                   # Frontend mantığı (fetch tabanlı)
├── docs/
│   ├── postman/                     # Postman collection, environment ve ekran görüntüsü prosedürü
│   ├── screenshots/
│   │   ├── postman/                 # Gerçek Postman ekran görüntüleri (15 adet)
│   │   └── ui/                      # (isteğe bağlı, bu teslimde henüz doldurulmadı)
│   └── TaskFlow_Proje_Tanitim_Dokumani.pdf
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Task Veri Modeli

```json
{
  "id": 1787246767123,
  "title": "Backend API dokümantasyonu hazırla",
  "description": "Tüm endpointlerin istek ve cevap örneklerini yaz.",
  "priority": "high",
  "assignee": "Mehmet Ozdemir",
  "status": "pending",
  "createdAt": "2026-08-20T17:26:07.123Z",
  "updatedAt": "2026-08-20T17:26:07.123Z"
}
```

| Alan | Zorunlu mu | Kural |
| --- | --- | --- |
| `id` | — | Sunucu üretir (`Date.now()` tabanlı, çakışmaya karşı benzersizleştirilir); istemci değiştiremez |
| `title` | Evet | String, trim sonrası 3–100 karakter |
| `description` | Evet | String, trim sonrası 10–500 karakter |
| `assignee` | Evet | String, trim sonrası en az 2 karakter |
| `priority` | Evet (create ve update'te) | `low`, `medium`, `high` değerlerinden biri |
| `status` | Create'te opsiyonel (varsayılan `pending`), update'te zorunlu | `pending`, `in-progress`, `completed` değerlerinden biri |
| `createdAt` | — | Sunucu üretir; güncellemede korunur |
| `updatedAt` | — | Sunucu üretir; her güncellemede yenilenir |

`POST /tasks` isteğinde `status` alanı hiç gönderilmezse sunucu varsayılan
olarak `pending` atar. `status` gönderilir ama geçersiz bir değer içerirse
istek reddedilir: sunucu `400 Bad Request` + `"Validation failed"` döndürür
(sessizce `pending`'e düşmez). Geçerli `status` değerleri `pending`,
`in-progress` ve `completed`'tır. `PUT /tasks/:id` tam güncelleme olarak ele
alınır: `title`, `description`, `assignee`, `priority` ve `status` yeniden
doğrulanır; `id` ve `createdAt` istemciden alınmaz, mevcut kayıttan korunur.

## API Rotaları

Temel yol öneki (`/api` gibi) kullanılmaz; tüm rotalar doğrudan kök yoldan
sunulur.

### Zorunlu CRUD

| Method | Rota | Açıklama | Başarı kodu |
| --- | --- | --- | --- |
| `POST` | `/tasks` | Yeni görev oluşturur | `201` |
| `GET` | `/tasks` | Görevleri listeler (filtre/arama/sıralama/sayfalama destekler) | `200` |
| `GET` | `/tasks/:id` | Tek görevi döndürür | `200` / `404` |
| `PUT` | `/tasks/:id` | Görevi tam olarak günceller | `200` / `404` |
| `DELETE` | `/tasks/:id` | Görevi siler | `200` / `404` |

### Gelişmiş Listeleme

| Method | Rota | Açıklama |
| --- | --- | --- |
| `GET` | `/tasks?status=pending\|in-progress\|completed` | Duruma göre filtreler |
| `GET` | `/tasks?priority=low\|medium\|high` | Önceliğe göre filtreler |
| `GET` | `/tasks?sort=createdAt&order=asc\|desc` | Oluşturulma tarihine göre sıralar |
| `GET` | `/tasks?page=1&limit=10` | Sayfalar (varsayılan `page=1`, `limit=10`) |
| `GET` | `/tasks/search?keyword=...` | `title`/`description` içinde büyük/küçük harf duyarsız arama yapar |
| `GET` | `/tasks/assignee/:name` | Çalışana göre listeler (büyük/küçük harf duyarsız, URL-encode desteklenir) |

`status`, `priority`, `sort`, `order`, `page` ve `limit` parametreleri
`/tasks`, `/tasks/search` ve `/tasks/assignee/:name` üzerinde birlikte
kullanılabilir. Geçersiz veya boş bir query değeri `400` döndürür. Tek
izin verilen `sort` alanı `createdAt`'tır.

Örnek: `GET /tasks/search?keyword=backend&status=pending&sort=createdAt&order=desc&page=1&limit=5`

### Raporlar

| Method | Rota | Açıklama |
| --- | --- | --- |
| `GET` | `/reports/completed` | Tamamlanan görev sayısı |
| `GET` | `/reports/pending` | Bekleyen görev sayısı (devam edenler hariç) |
| `GET` | `/reports/summary` | Toplam, bekleyen, devam eden, tamamlanan ve yüksek öncelikli görev sayıları |

Rapor endpoint'leri her istekte güncel `data/tasks.json` içeriğini okur ve
hiçbir zaman dosyaya yazmaz.

## Cevap Biçimi

Tekil kayıt cevabı (`POST`/`GET :id`/`PUT`/`DELETE`):

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { "...": "task nesnesi" }
}
```

Liste cevabı (`GET /tasks`, `GET /tasks/search`, `GET /tasks/assignee/:name`):

```json
{
  "success": true,
  "data": [ "...", "..." ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Doğrulama hatası:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Title is required"]
}
```

Bulunamadı hatası:

```json
{
  "success": false,
  "message": "Task not found",
  "errors": []
}
```

Beklenen HTTP durum kodları:

- `200 OK` — listeleme, detay, güncelleme, silme, raporlar
- `201 Created` — başarılı görev oluşturma
- `400 Bad Request` — doğrulama hatası veya geçersiz query parametresi
- `404 Not Found` — görev veya endpoint bulunamadı
- `500 Internal Server Error` — beklenmeyen sunucu hatası (stack trace veya
  dosya yolu sızdırılmaz)

## Doğrulama ve Hata Davranışı

- `POST`/`PUT` istekleri `validateTask` middleware'inden geçer; tüm hatalar
  tek bir `errors` dizisinde toplanır ve `400` ile döndürülür.
- Geçersiz `status` veya `priority` değerleri, izin verilen değerleri
  listeleyen bir hata mesajıyla `400` döndürür.
- Olmayan bir görev ID'sine yapılan `GET`/`PUT`/`DELETE` isteği `404` +
  `"Task not found"` döndürür.
- Bilinmeyen bir endpoint'e yapılan istek `404` +
  `"Endpoint not found: <METHOD> <yol>"` döndürür.
- Bozuk (parse edilemeyen) JSON gövdesi `400` + `"Invalid JSON payload"`
  döndürür; sunucu çökmez ve stack trace sızdırılmaz.
- Gelişmiş sorgu parametrelerinde (`status`, `priority`, `sort`, `order`,
  `page`, `limit`, `keyword`) geçersiz veya boş bir değer `400` + ilgili
  alanı belirten bir hata mesajı döndürür.

## JSON Dosyası Kalıcılığı

- Tüm görev verisi `data/tasks.json` dosyasında, 2 boşluklu girinti ile
  okunabilir biçimde tutulur.
- Dosya `src/utils/file.js` üzerinden `readTasks()`/`writeTasks()`
  fonksiyonlarıyla okunup yazılır; hiçbir rota veya controller doğrudan `fs`
  kullanmaz.
- Her başarılı `POST`, `PUT` ve `DELETE` işleminden sonra dosyaya yazılır.
- Liste/arama/rapor istekleri dosyaya asla yazmaz.
- Sunucu yeniden başlatıldığında veriler `data/tasks.json` üzerinden
  korunur.
- Teslim anında `data/tasks.json` kasıtlı olarak boş bir dizi (`[]`)
  içerir; uygulamayı ilk kez çalıştıran kişi temiz bir veri setiyle
  başlar.

## Frontend

Frontend, `express.static('public')` ile aynı Express uygulamasından
sunulur; ayrı bir build sistemi veya framework kullanılmaz. Tüm veriler
`fetch()` ile REST API'den alınır.

Temel özellikler:

- Toplam, bekleyen, devam eden, tamamlanan ve yüksek öncelikli görev
  sayılarını gösteren 5 istatistik kartı (`GET /reports/summary`'ye bağlı)
- Görev oluşturma modalı ve düzenleme modalı
- Durum ve öncelik rozetleri
- Silme işlemi için ayrı bir onay modalı (yanlışlıkla tek tıklamayla silme
  yapılamaz)
- Anahtar kelime araması ve çalışana göre filtre (arka planda `/tasks/search`
  ve `/tasks/assignee/:name` rotalarına karşılık gelir; ikisi aynı anda
  kullanılamaz, arayüz aktif modu kullanıcıya bir ipucu metniyle bildirir)
- Durum/öncelik filtreleri ve sayfalama kontrolleri (10/20/50 sayfa boyutu
  seçenekleri)
- Artan/azalan sıralama seçici (`sort=createdAt` sabit gönderilir)
- Başarılı/başarısız işlemler için toast bildirimleri
- Loading, boş (filtrelenmiş/filtrelenmemiş) ve hata durumları için ayrı
  paneller
- Sayfalama, `meta.totalPages` sıfır olduğunda tamamen gizlenir

## Erişilebilirlik ve Responsive Tasarım

- Tüm form alanlarında `<label for>` ile ilişkilendirilmiş görünür
  etiketler
- Modallar `role="dialog"` / `role="alertdialog"` ve `aria-modal="true"`
  kullanır; `Escape` ile kapatılabilir
- Klavye ile odaklanılabilir, görünür `:focus-visible` stiline sahip
  butonlar
- "İçeriğe geç" atlama bağlantısı (skip link)
- `prefers-reduced-motion` desteği
- Durum listesi ve sonuç sayacı `aria-live="polite"` ile duyurulur
- Kesme noktaları: `1024px`, `720px` ve `480px` — masaüstü, tablet ve mobil
  görünümlerde yatay taşma yoktur; uzun başlık/açıklamalar arayüzü bozmaz

## Postman ile Test

Postman dosyaları `docs/postman/` altında bulunur:

- `TaskFlow.postman_collection.json` — Postman Collection v2.1; `CRUD`,
  `Advanced Listing`, `Reports`, `Validation and Errors`, `Persistence
  Verification` ve `Cleanup - Remove Seed Data` klasörlerini içerir
- `TaskFlow.postman_environment.json` — `baseUrl = http://localhost:3000`
  değişkenini içeren ortam dosyası
- `SCREENSHOT_CHECKLIST.md` — ekran görüntüsü alma prosedürünün tam
  adımları

### Import ve çalıştırma sırası

1. Postman masaüstü uygulamasını açın.
2. `TaskFlow.postman_collection.json` dosyasını import edin.
3. `TaskFlow.postman_environment.json` dosyasını import edin ve sağ üstten
   **TaskFlow Local** ortamını seçin.
4. `taskflow-api/` klasöründe `npm start` (veya `npm run dev`) ile sunucuyu
   başlatın.
5. Klasörleri sırayla çalıştırın: **CRUD** → **Advanced Listing** (ilk 5
   istek kontrollü test verisini oluşturur) → **Reports** → **Validation
   and Errors** → **Persistence Verification** → **Cleanup - Remove Seed
   Data** (test verisini temizler, `tasks.json`'u tekrar `[]` yapar).

Tam adımlar ve ekran görüntüsü dosya adları için
`docs/postman/SCREENSHOT_CHECKLIST.md` dosyasına bakın.

### Ekran görüntüsü kanıtı

`docs/screenshots/postman/` klasöründe, gerçek bir Postman koşumunda
alınmış 15 ekran görüntüsü bulunur. Aşağıda temsili bir seçki paylaşılmıştır;
kalan görüntüler aynı klasörde ek kanıt olarak mevcuttur.

| Senaryo | Beklenen durum | Ekran görüntüsü |
| --- | --- | --- |
| Görev oluşturma | `201` | [`docs/screenshots/postman/01-create-task-201.png`](docs/screenshots/postman/01-create-task-201.png) |
| Görevleri listeleme | `200` | [`docs/screenshots/postman/02-list-tasks-200.png`](docs/screenshots/postman/02-list-tasks-200.png) |
| Görev güncelleme | `200` | [`docs/screenshots/postman/04-update-task-200.png`](docs/screenshots/postman/04-update-task-200.png) |
| Doğrulama hatası | `400` | [`docs/screenshots/postman/06-validation-error-400.png`](docs/screenshots/postman/06-validation-error-400.png) |
| Görev bulunamadı | `404` | [`docs/screenshots/postman/07-task-not-found-404.png`](docs/screenshots/postman/07-task-not-found-404.png) |
| Birleşik filtre (durum + öncelik) | `200` | [`docs/screenshots/postman/08-combined-filter-200.png`](docs/screenshots/postman/08-combined-filter-200.png) |
| Özet raporu | `200` | [`docs/screenshots/postman/12-summary-report-200.png`](docs/screenshots/postman/12-summary-report-200.png) |

Kalan 8 ekran görüntüsü (detay getirme, silme, çalışana göre listeleme,
anahtar kelime araması, sayfalama, tamamlanan/bekleyen raporları, bozuk
JSON) `docs/screenshots/postman/` klasöründe ek kanıt olarak durur.

Frontend/UI ekran görüntüleri (`docs/screenshots/ui/`) bu teslimde henüz
eklenmemiştir; brief'te bu görüntüler zorunlu değil, önerilen ek kanıt
olarak listelenir.

## Test ve Doğrulama Özeti

Bu proje üç ayrı doğrulama katmanından geçmiştir; hiçbiri diğerinin
yerine geçmez:

1. **Otomatik HTTP doğrulaması** — geliştirme sırasında `node --check` ile
   sözdizimi kontrolleri ve `curl`/Node.js ile CRUD, doğrulama/hata,
   gelişmiş listeleme, rapor ve kalıcılık davranışları uçtan uca test
   edildi; harici bir test kütüphanesi (Jest vb.) kullanılmadı.
2. **Manuel tarayıcı doğrulaması** — masaüstü ve mobil düzen, oluşturma/
   düzenleme/silme akışları, canlı istatistik yenilemesi, Türkçe karakter
   render'ı, filtrelenmiş/filtrelenmemiş boş durumlar, toast bildirimleri
   ve yatay taşma olmaması Chrome'da gerçek kullanıcı tarafından manuel
   olarak doğrulandı.
3. **Manuel Postman doğrulaması** — collection, Postman masaüstü
   uygulamasına gerçekten import edilip çalıştırıldı; 15 gerçek ekran
   görüntüsü `docs/screenshots/postman/` altına kaydedildi.

Otomatik denetim, JSON dosya kalıcılığını (yeniden başlatma sonrası veri
korunumu), raporların dosyaya yazmadığını ve tüm geçersiz sorgu/gövde
kombinasyonlarının `400`/`404` döndürdüğünü doğruladı.

## Bilinen Sınırlamalar

- Veriler tek bir JSON dosyasında tutulur; eşzamanlı yüksek trafik veya
  çok kullanıcılı production senaryoları için uygun değildir.
- Kimlik doğrulama, yetkilendirme veya kullanıcı hesabı yoktur.
- Sıralama yalnızca `createdAt` alanına göre yapılabilir.
- Arama (`keyword`) ve çalışana göre filtre (`assignee`) frontend'de aynı
  anda kullanılamaz; biri seçildiğinde diğeri devre dışı kalır.
- Sayfalama için üst bir `limit` sınırı tanımlanmamıştır.
- Rate limiting, WebSocket/gerçek zamanlı bildirim ve dosya yükleme bu
  projenin kapsamı dışındadır.

## Proje Bilgisi

- **Proje:** TaskFlow — Görev ve Proje Yönetim Sistemi
- **Yazar:** Mehmet Özdemir
