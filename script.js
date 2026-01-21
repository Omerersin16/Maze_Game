// =========================================================
// LABİRENT OYUNU - SONSUSZ MOD (script.js)
// =========================================================

// Oyun ayarları
const BOYUT = 31; // 31x31 labirent

// Desktop'ta hedeflediğimiz "ideal" hücre boyu (mobilde dinamik ayarlanacak)
const DESKTOP_CELL_PX = 18;

// Oyun durumu
let oyunBittiMi = false;
let kalanSure = 45;
let zamanlayiciInterval = null;
let cezaSayisi = 0;
let toplamPuan = 0;
let level = 1;

// Oyuncu konumu
let oyuncuX = 0;
let oyuncuY = 0;
let oyuncuYon = "sag"; // "yukari", "asagi", "sol", "sag"

// DOM elemanları
const oyunKutusu = document.getElementById("oyun-kutusu");
const sureGostergesi = document.getElementById("sure-gostergesi");
const cezaGostergesi = document.getElementById("ceza-gostergesi");
const toplamPuanGostergesi = document.getElementById("toplam-puan-gostergesi");
const levelGostergesi = document.getElementById("level-gostergesi");
const bilgiPaneli = document.getElementById("bilgi-paneli");
const mobilKontrol = document.getElementById("mobil-kontrol");

// ---------------------------------------------------------
// 1) RESPONSIVE: Mobilde "telefon olduğunu anlamıyor" problemi
// ---------------------------------------------------------
// Bunun en kritik kısmı index.html içindeki:
// <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
// Eğer bu satır yoksa, telefon sayfayı masaüstü gibi ölçekler ve media query'ler şaşar.
//
// Biz burada da labirent hücre boyunu otomatik hesaplayıp
// labirenti ekrana sığdırıyoruz (transform scale yok!).
function responsiveBoyutAyarla() {
    // CSS değişkenleri: --cell-size, --cols, --rows
    document.documentElement.style.setProperty("--cols", BOYUT);
    document.documentElement.style.setProperty("--rows", BOYUT);

    // Panel + kontrol yüksekliğini ölç (mobilde "ekrana sığma" için)
    const panelH = bilgiPaneli ? bilgiPaneli.getBoundingClientRect().height : 0;
    const kontrolH = mobilKontrol ? mobilKontrol.getBoundingClientRect().height : 0;

    // Kenarlardan nefes payı
    const padding = 16;

    // Kullanılabilir alan (kareyi bozmayacağız -> min alınır)
    const availW = window.innerWidth - padding;
    const availH = window.innerHeight - panelH - kontrolH - padding - 20; // 20: aralara pay

    // Desktop mu mobil mi? (çok kaba ama iş görüyor)
    const mobilMi = window.matchMedia("(max-width: 600px)").matches;

    // Desktop'ta 18px, mobilde ekrana göre hesapla
    let cellPx = DESKTOP_CELL_PX;

    if (mobilMi) {
        const maxKareBoy = Math.max(100, Math.min(availW, availH)); // en az 100 olsun
        cellPx = Math.floor(maxKareBoy / BOYUT);

        // Çok küçülmesin / çok büyümesin
        cellPx = Math.max(10, Math.min(22, cellPx));
    }

    // CSS'ye yaz
    document.documentElement.style.setProperty("--cell-size", `${cellPx}px`);
}

// ---------------------------------------------------------
// 2) Labirent üretme (Recursive backtracking)
// ---------------------------------------------------------
function labirentOlustur() {
    // 1 = duvar, 0 = yol
    const maze = Array.from({ length: BOYUT }, () => Array(BOYUT).fill(1));

    function carve(x, y) {
        const directions = [
            [0, -2], // yukarı
            [0,  2], // aşağı
            [-2, 0], // sol
            [2,  0]  // sağ
        ];

        // yönleri karıştır
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            // sınırlar içinde mi?
            if (nx > 0 && nx < BOYUT - 1 && ny > 0 && ny < BOYUT - 1) {
                // hedef hücre duvar ise aç
                if (maze[ny][nx] === 1) {
                    maze[ny][nx] = 0;
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(nx, ny);
                }
            }
        }
    }

    // Başlangıç (0,0) yerine içerden başlatmak daha sağlam
    maze[1][1] = 0;
    carve(1, 1);

    // Çıkış noktası (BOYUT-2, BOYUT-2)
    maze[BOYUT - 2][BOYUT - 2] = 0;

    return maze;
}

// ---------------------------------------------------------
// 3) Ekrana çizdirme
// ---------------------------------------------------------
let currentMaze = null;

function haritaUret() {
    // responsive ayarı önce yapalım ki çizim doğru boyutta olsun
    responsiveBoyutAyarla();

    currentMaze = labirentOlustur();

    oyunKutusu.innerHTML = "";
    oyunKutusu.style.gridTemplateColumns = `repeat(${BOYUT}, 1fr)`;
    oyunKutusu.style.gridTemplateRows = `repeat(${BOYUT}, 1fr)`;

    for (let y = 0; y < BOYUT; y++) {
        for (let x = 0; x < BOYUT; x++) {
            const hucre = document.createElement("div");
            hucre.classList.add("hucre");

            if (currentMaze[y][x] === 1) {
                hucre.classList.add("duvar");
            }

            // başlangıç ve bitiş
            if (x === 1 && y === 1) hucre.classList.add("baslangic");
            if (x === BOYUT - 2 && y === BOYUT - 2) hucre.classList.add("bitis");

            oyunKutusu.appendChild(hucre);
        }
    }

    // oyuncuyu başlangıca koy
    oyuncuX = 1;
    oyuncuY = 1;
    oyuncuYon = "sag";
    oyuncuyuCiz();
}

// ---------------------------------------------------------
// 4) Oyuncuyu çizdirme
// ---------------------------------------------------------
function oyuncuyuCiz() {
    // önceki oyuncu varsa sil
    const eski = document.querySelector(".ucgen-karakter");
    if (eski) eski.remove();

    const index = oyuncuY * BOYUT + oyuncuX;
    const hucre = oyunKutusu.children[index];

    const oyuncu = document.createElement("div");
    oyuncu.classList.add("ucgen-karakter");

    // yönüne göre döndür
    let rotateDeg = 0;
    if (oyuncuYon === "yukari") rotateDeg = 0;
    if (oyuncuYon === "sag") rotateDeg = 90;
    if (oyuncuYon === "asagi") rotateDeg = 180;
    if (oyuncuYon === "sol") rotateDeg = 270;
    oyuncu.style.transform = `rotate(${rotateDeg}deg)`;

    hucre.appendChild(oyuncu);
}

// ---------------------------------------------------------
// 5) Hareket
// ---------------------------------------------------------
function oyuncuyuHareketEttir(dx, dy, yon, izBirak = true) {
    if (oyunBittiMi) return;

    const yeniX = oyuncuX + dx;
    const yeniY = oyuncuY + dy;

    // duvar mı?
    if (currentMaze[yeniY][yeniX] === 1) {
        // hata/ceza
        cezaSayisi++;
        cezaGostergesi.textContent = cezaSayisi;
        return;
    }

    // iz bırak
    if (izBirak) {
        const eskiIndex = oyuncuY * BOYUT + oyuncuX;
        const eskiHucre = oyunKutusu.children[eskiIndex];
        const iz = document.createElement("div");
        iz.classList.add("iz");
        eskiHucre.appendChild(iz);
    }

    // konumu güncelle
    oyuncuX = yeniX;
    oyuncuY = yeniY;
    oyuncuYon = yon;

    oyuncuyuCiz();

    // bitişe ulaştı mı?
    if (oyuncuX === BOYUT - 2 && oyuncuY === BOYUT - 2) {
        level++;
        levelGostergesi.textContent = level;

        // puan örneği: kalan süre kadar puan
        toplamPuan += Math.max(0, kalanSure);
        toplamPuanGostergesi.textContent = toplamPuan;

        // yeni level başlat
        yeniLevelBaslat();
    }
}

// ---------------------------------------------------------
// 6) Zaman
// ---------------------------------------------------------
function zamanlayiciBaslat() {
    clearInterval(zamanlayiciInterval);

    kalanSure = 45;
    sureGostergesi.textContent = kalanSure;
    sureGostergesi.classList.remove("kritik");

    zamanlayiciInterval = setInterval(() => {
        if (oyunBittiMi) return;

        kalanSure--;
        sureGostergesi.textContent = kalanSure;

        if (kalanSure <= 10) {
            sureGostergesi.classList.add("kritik");
        }

        if (kalanSure <= 0) {
            // süre bitti: aynı leveli yeniden üret
            cezaSayisi++;
            cezaGostergesi.textContent = cezaSayisi;
            yeniLevelBaslat();
        }
    }, 1000);
}

function yeniLevelBaslat() {
    haritaUret();
    zamanlayiciBaslat();
}

// ---------------------------------------------------------
// 7) Klavye kontrolleri
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (oyunBittiMi) return;

    if (e.key === "ArrowUp") oyuncuyuHareketEttir(0, -1, "yukari");
    if (e.key === "ArrowDown") oyuncuyuHareketEttir(0, 1, "asagi");
    if (e.key === "ArrowLeft") oyuncuyuHareketEttir(-1, 0, "sol");
    if (e.key === "ArrowRight") oyuncuyuHareketEttir(1, 0, "sag");
});

// ---------------------------------------------------------
// 8) Mobil buton kontrolleri
// ---------------------------------------------------------
function butonBagla(btnId, dx, dy, yon) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    // Dokunmatik: gecikmesiz
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        oyuncuyuHareketEttir(dx, dy, yon);
    }, { passive: false });

    // Mouse: tıklama
    btn.addEventListener("click", () => {
        oyuncuyuHareketEttir(dx, dy, yon);
    });
}

butonBagla("btn-yukari", 0, -1, "yukari");
butonBagla("btn-asagi", 0, 1, "asagi");
butonBagla("btn-sol", -1, 0, "sol");
butonBagla("btn-sag", 1, 0, "sag");

// ---------------------------------------------------------
// 9) MOBİL KAYDIRMA (Swipe) Kontrolü
// ---------------------------------------------------------
// İstek:
// - Kısa kaydır-bırak => tek kare hareket
// - Uzun basılı tutup (yön belirleyip) bırakana kadar => sürekli hareket
//
// Mantık:
// - Parmağın ekrana değdiği an zamanı alıyoruz.
// - Yeterli kaydırma olduysa yönü seçiyoruz.
// - Eğer parmak 250ms+ ekranda kalırsa "hold mode" açılır ve interval ile yürür.
// - Parmağı çekince interval durur. Eğer hold mode açılmadıysa 1 kere hareket eder.
let swipeAktif = false;
let swipeBaslangicX = 0;
let swipeBaslangicY = 0;
let swipeYonu = null;
let holdMode = false;
let holdTimer = null;
let moveInterval = null;

const SWIPE_ESIK = 12;      // px
const HOLD_SURE = 250;      // ms
const MOVE_HIZ = 120;       // ms (ne kadar küçükse o kadar hızlı)

function yonBul(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "sag" : "sol";
    } else {
        return dy > 0 ? "asagi" : "yukari";
    }
}

function yonuHareketeCevir(yon) {
    if (yon === "yukari") return [0, -1, "yukari"];
    if (yon === "asagi") return [0,  1, "asagi"];
    if (yon === "sol")   return [-1, 0, "sol"];
    return [1, 0, "sag"];
}

function intervalBaslat() {
    if (!swipeYonu) return;
    if (moveInterval) return;

    // İlk adım hemen
    const [dx, dy, yon] = yonuHareketeCevir(swipeYonu);
    oyuncuyuHareketEttir(dx, dy, yon);

    // Sonra sürekli
    moveInterval = setInterval(() => {
        const [dx2, dy2, yon2] = yonuHareketeCevir(swipeYonu);
        oyuncuyuHareketEttir(dx2, dy2, yon2);
    }, MOVE_HIZ);
}

function intervalDurdur() {
    clearInterval(moveInterval);
    moveInterval = null;
}

function swipeSifirla() {
    swipeAktif = false;
    swipeYonu = null;
    holdMode = false;
    clearTimeout(holdTimer);
    holdTimer = null;
    intervalDurdur();
}

oyunKutusu.addEventListener("pointerdown", (e) => {
    // sadece ana parmak için
    if (e.pointerType === "mouse" && e.button !== 0) return;

    swipeAktif = true;
    swipeBaslangicX = e.clientX;
    swipeBaslangicY = e.clientY;
    swipeYonu = null;
    holdMode = false;

    // 250ms sonra hâlâ basılıysa hold mode aktif
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        holdMode = true;
        if (swipeYonu) intervalBaslat();
    }, HOLD_SURE);

    // iOS/Android'de seçim/scroll olmasın
    e.preventDefault();
}, { passive: false });

oyunKutusu.addEventListener("pointermove", (e) => {
    if (!swipeAktif) return;

    const dx = e.clientX - swipeBaslangicX;
    const dy = e.clientY - swipeBaslangicY;

    // Eşiği geçmediyse bekle
    if (!swipeYonu && (Math.abs(dx) < SWIPE_ESIK && Math.abs(dy) < SWIPE_ESIK)) return;

    // Yön seç
    const yeniYon = yonBul(dx, dy);

    // Yön değiştiyse güncelle
    swipeYonu = yeniYon;

    // Hold mode açıksa interval ile yürüsün
    if (holdMode) {
        intervalBaslat();
    }

    e.preventDefault();
}, { passive: false });

function pointerBitir(e) {
    if (!swipeAktif) return;

    // Eğer hold mode'a girmediysek => tek hamle
    if (!holdMode && swipeYonu) {
        const [dx, dy, yon] = yonuHareketeCevir(swipeYonu);
        oyuncuyuHareketEttir(dx, dy, yon);
    }

    swipeSifirla();
    e.preventDefault();
}

oyunKutusu.addEventListener("pointerup", pointerBitir, { passive: false });
oyunKutusu.addEventListener("pointercancel", pointerBitir, { passive: false });

// ---------------------------------------------------------
// 10) Resize: Ekran değişince labirent boyutu güncellensin
// ---------------------------------------------------------
window.addEventListener("resize", () => {
    // Hücre boyunu güncelle
    responsiveBoyutAyarla();
});

// ---------------------------------------------------------
// 11) Başlat
// ---------------------------------------------------------
haritaUret();
zamanlayiciBaslat();
