// =========================================================
// LABİRENT OYUNU - SONSUSZ MOD (script.js)
// =========================================================

// Oyun ayarları
const BOYUT = 31; // 31x31 labirent
const DESKTOP_CELL_PX = 18;

// ✅ Süre 60 saniye
const LEVEL_SURE = 60;

// ✅ Puan çarpanı (istersen sonra 5/10/20 yaparız)
const PUAN_CARPANI = 10;

// Oyun durumu
let oyunBittiMi = false;
let kalanSure = LEVEL_SURE;
let zamanlayiciInterval = null;
let toplamPuan = 0;
let level = 1;

// Oyuncu konumu
let oyuncuX = 0;
let oyuncuY = 0;
let oyuncuYon = "sag"; // "yukari", "asagi", "sol", "sag"

// ✅ Giriş/Çıkış (duvar üstünde) + iç kapılar
let baslangic = { x: 0, y: 1 };
let bitis = { x: BOYUT - 1, y: BOYUT - 2 };
let girisIci = { x: 1, y: 1 };
let cikisIci = { x: BOYUT - 2, y: BOYUT - 2 };

// DOM elemanları
const oyunKutusu = document.getElementById("oyun-kutusu");
const sureGostergesi = document.getElementById("sure-gostergesi");
const toplamPuanGostergesi = document.getElementById("toplam-puan-gostergesi");
const levelGostergesi = document.getElementById("level-gostergesi");
const bilgiPaneli = document.getElementById("bilgi-paneli");

// ---------------------------------------------------------
// 1) RESPONSIVE: hücre boyunu ekrana göre ayarla (scale yok!)
// ---------------------------------------------------------
function responsiveBoyutAyarla() {
    document.documentElement.style.setProperty("--cols", BOYUT);
    document.documentElement.style.setProperty("--rows", BOYUT);

    const panelH = bilgiPaneli ? bilgiPaneli.getBoundingClientRect().height : 0;

    const padding = 16;
    const availW = window.innerWidth - padding;
    const availH = window.innerHeight - panelH - padding - 20;

    const mobilMi = window.matchMedia("(max-width: 600px)").matches;

    let cellPx = DESKTOP_CELL_PX;

    if (mobilMi) {
        const maxKareBoy = Math.max(100, Math.min(availW, availH));
        cellPx = Math.floor(maxKareBoy / BOYUT);
        cellPx = Math.max(10, Math.min(22, cellPx));
    }

    document.documentElement.style.setProperty("--cell-size", `${cellPx}px`);
}

// ---------------------------------------------------------
// 2) DUVAR ÜSTÜNDE RASTGELE BAŞLANGIÇ / KARŞI DUVARDA BİTİŞ
// ---------------------------------------------------------
function duvarKapilariSec() {
    // 0=üst,1=sağ,2=alt,3=sol
    const kenar = Math.floor(Math.random() * 4);

    const rand = () => Math.floor(Math.random() * (BOYUT - 2)) + 1;

    let bx, by, ex, ey;
    let gix, giy, cix, ciy;

    if (kenar === 0) {
        // ÜST duvar (y=0) -> ALT duvar (y=BOYUT-1)
        bx = rand(); by = 0;
        gix = bx;   giy = 1;

        ex = rand(); ey = BOYUT - 1;
        cix = ex;    ciy = BOYUT - 2;
    } else if (kenar === 2) {
        // ALT -> ÜST
        bx = rand(); by = BOYUT - 1;
        gix = bx;   giy = BOYUT - 2;

        ex = rand(); ey = 0;
        cix = ex;    ciy = 1;
    } else if (kenar === 3) {
        // SOL (x=0) -> SAĞ (x=BOYUT-1)
        bx = 0;      by = rand();
        gix = 1;     giy = by;

        ex = BOYUT - 1; ey = rand();
        cix = BOYUT - 2; ciy = ey;
    } else {
        // SAĞ -> SOL
        bx = BOYUT - 1; by = rand();
        gix = BOYUT - 2; giy = by;

        ex = 0;          ey = rand();
        cix = 1;         ciy = ey;
    }

    baslangic = { x: bx, y: by };
    bitis = { x: ex, y: ey };
    girisIci = { x: gix, y: giy };
    cikisIci = { x: cix, y: ciy };
}

// ---------------------------------------------------------
// 3) Labirent üretme (Recursive backtracking)
// ---------------------------------------------------------
function labirentOlustur() {
    // 1 = duvar, 0 = yol
    const maze = Array.from({ length: BOYUT }, () => Array(BOYUT).fill(1));

    function carve(x, y) {
        const directions = [
            [0, -2],
            [0,  2],
            [-2, 0],
            [2,  0]
        ];

        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < BOYUT - 1 && ny > 0 && ny < BOYUT - 1) {
                if (maze[ny][nx] === 1) {
                    maze[ny][nx] = 0;
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(nx, ny);
                }
            }
        }
    }

    // üret
    maze[1][1] = 0;
    carve(1, 1);

    // ✅ kapıları seç
    duvarKapilariSec();

    // ✅ kapıları aç (duvar + iç hücre)
    maze[baslangic.y][baslangic.x] = 0;
    maze[girisIci.y][girisIci.x] = 0;

    maze[bitis.y][bitis.x] = 0;
    maze[cikisIci.y][cikisIci.x] = 0;

    return maze;
}

// ---------------------------------------------------------
// 4) Ekrana çizdirme
// ---------------------------------------------------------
let currentMaze = null;

function haritaUret() {
    responsiveBoyutAyarla();

    currentMaze = labirentOlustur();

    oyunKutusu.innerHTML = "";
    oyunKutusu.style.gridTemplateColumns = `repeat(${BOYUT}, var(--cell-size))`;
    oyunKutusu.style.gridTemplateRows = `repeat(${BOYUT}, var(--cell-size))`;

    for (let y = 0; y < BOYUT; y++) {
        for (let x = 0; x < BOYUT; x++) {
            const hucre = document.createElement("div");
            hucre.classList.add("hucre");

            if (currentMaze[y][x] === 1) {
                hucre.classList.add("duvar");
            }

            // kapılar duvar üstünde
            if (x === baslangic.x && y === baslangic.y) hucre.classList.add("baslangic");
            if (x === bitis.x && y === bitis.y) hucre.classList.add("bitis");

            oyunKutusu.appendChild(hucre);
        }
    }

    // ✅ oyuncu artık DOĞRUDAN başlangıç kapısında başlasın
oyuncuX = baslangic.x;
oyuncuY = baslangic.y;

    oyuncuYon = "sag";
    oyuncuyuCiz();
}

// ---------------------------------------------------------
// 5) Oyuncuyu çizdirme
// ---------------------------------------------------------
function oyuncuyuCiz() {
    const eski = document.querySelector(".ucgen-karakter");
    if (eski) eski.remove();

    const index = oyuncuY * BOYUT + oyuncuX;
    const hucre = oyunKutusu.children[index];

    const oyuncu = document.createElement("div");
    oyuncu.classList.add("ucgen-karakter");

    let rotateDeg = 0;
    if (oyuncuYon === "yukari") rotateDeg = 0;
    if (oyuncuYon === "sag") rotateDeg = 90;
    if (oyuncuYon === "asagi") rotateDeg = 180;
    if (oyuncuYon === "sol") rotateDeg = 270;

    oyuncu.style.transform = `rotate(${rotateDeg}deg)`;
    hucre.appendChild(oyuncu);
}

// ---------------------------------------------------------
// 6) Hareket (✅ ceza yok: duvara çarparsa sadece durur)
// ---------------------------------------------------------
function oyuncuyuHareketEttir(dx, dy, yon, izBirak = true) {
    if (oyunBittiMi) return;

    const yeniX = oyuncuX + dx;
    const yeniY = oyuncuY + dy;

    // sınır dışı -> dur
    if (yeniX < 0 || yeniX >= BOYUT || yeniY < 0 || yeniY >= BOYUT) {
        return;
    }

    // duvar -> dur
    if (currentMaze[yeniY][yeniX] === 1) {
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

    oyuncuX = yeniX;
    oyuncuY = yeniY;
    oyuncuYon = yon;

    oyuncuyuCiz();

    // ✅ çıkış (duvar üstündeki bitiş hücresi)
    if (oyuncuX === bitis.x && oyuncuY === bitis.y) {
        level++;
        levelGostergesi.textContent = level;

        // ✅ süreye göre bonus puan
        toplamPuan += Math.max(0, kalanSure) * PUAN_CARPANI;
        toplamPuanGostergesi.textContent = toplamPuan;

        yeniLevelBaslat();
    }
}

// ---------------------------------------------------------
// 7) Zaman (60 saniye) - ✅ ceza yok
// ---------------------------------------------------------
function zamanlayiciBaslat() {
    clearInterval(zamanlayiciInterval);

    kalanSure = LEVEL_SURE;
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
            // süre bitti -> aynı level yeniden
            yeniLevelBaslat();
        }
    }, 1000);
}

function yeniLevelBaslat() {
    haritaUret();
    zamanlayiciBaslat();
}

// ---------------------------------------------------------
// 8) Klavye kontrolleri
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (oyunBittiMi) return;

    if (e.key === "ArrowUp") oyuncuyuHareketEttir(0, -1, "yukari");
    if (e.key === "ArrowDown") oyuncuyuHareketEttir(0, 1, "asagi");
    if (e.key === "ArrowLeft") oyuncuyuHareketEttir(-1, 0, "sol");
    if (e.key === "ArrowRight") oyuncuyuHareketEttir(1, 0, "sag");
});

// ---------------------------------------------------------
// 9) MOBİL KAYDIRMA (Swipe) Kontrolü
// - kısa swipe -> 1 adım
// - basılı tut -> sürekli gider (duvara gelince durur)
// ---------------------------------------------------------
let swipeAktif = false;
let swipeBaslangicX = 0;
let swipeBaslangicY = 0;
let swipeYonu = null;
let holdMode = false;
let holdTimer = null;
let moveInterval = null;
let aktifPointerId = null;

const SWIPE_ESIK = 12;
const HOLD_SURE = 250;
const MOVE_HIZ = 120;

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

    const [dx, dy, yon] = yonuHareketeCevir(swipeYonu);
    oyuncuyuHareketEttir(dx, dy, yon);

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
    aktifPointerId = null;
    clearTimeout(holdTimer);
    holdTimer = null;
    intervalDurdur();
}

oyunKutusu.addEventListener("pointerdown", (e) => {
    if (aktifPointerId !== null) return;

    swipeAktif = true;
    aktifPointerId = e.pointerId;
    oyunKutusu.setPointerCapture(e.pointerId);

    swipeBaslangicX = e.clientX;
    swipeBaslangicY = e.clientY;
    swipeYonu = null;
    holdMode = false;

    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        holdMode = true;
        if (swipeYonu) intervalBaslat();
    }, HOLD_SURE);

    e.preventDefault();
}, { passive: false });

oyunKutusu.addEventListener("pointermove", (e) => {
    if (!swipeAktif) return;
    if (aktifPointerId !== e.pointerId) return;

    const dx = e.clientX - swipeBaslangicX;
    const dy = e.clientY - swipeBaslangicY;

    if (!swipeYonu && (Math.abs(dx) < SWIPE_ESIK && Math.abs(dy) < SWIPE_ESIK)) return;

    swipeYonu = yonBul(dx, dy);

    if (holdMode) intervalBaslat();

    e.preventDefault();
}, { passive: false });

function pointerBitir(e) {
    if (!swipeAktif) return;

    if (!holdMode && swipeYonu) {
        const [dx, dy, yon] = yonuHareketeCevir(swipeYonu);
        oyuncuyuHareketEttir(dx, dy, yon);
    }

    try {
        if (aktifPointerId !== null) oyunKutusu.releasePointerCapture(aktifPointerId);
    } catch (_) {}

    swipeSifirla();
    e.preventDefault();
}

oyunKutusu.addEventListener("pointerup", pointerBitir, { passive: false });
oyunKutusu.addEventListener("pointercancel", pointerBitir, { passive: false });

window.addEventListener("pointerup", (e) => {
    if (aktifPointerId === e.pointerId) pointerBitir(e);
}, { passive: false });

// ---------------------------------------------------------
// 10) Resize
// ---------------------------------------------------------
window.addEventListener("resize", () => {
    responsiveBoyutAyarla();
});

// ---------------------------------------------------------
// 11) Başlat
// ---------------------------------------------------------
haritaUret();
zamanlayiciBaslat();
