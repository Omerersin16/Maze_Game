// =========================================================
// LABİRENT OYUNU - SONSUSZ MOD (script.js)
// =========================================================

const BOYUT = 31;
const DESKTOP_CELL_PX = 18;

let oyunBittiMi = false;
let kalanSure = 45;
let zamanlayiciInterval = null;
let cezaSayisi = 0;
let toplamPuan = 0;
let level = 1;

let oyuncuX = 0;
let oyuncuY = 0;
let oyuncuYon = "sag";

const oyunKutusu = document.getElementById("oyun-kutusu");
const sureGostergesi = document.getElementById("sure-gostergesi");
const cezaGostergesi = document.getElementById("ceza-gostergesi");
const toplamPuanGostergesi = document.getElementById("toplam-puan-gostergesi");
const levelGostergesi = document.getElementById("level-gostergesi");
const bilgiPaneli = document.getElementById("bilgi-paneli");

// ---------------------------------------------------------
// 1) Responsive boyut
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
// 2) Labirent üretme
// ---------------------------------------------------------
function labirentOlustur() {
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

    maze[1][1] = 0;
    carve(1, 1);

    maze[BOYUT - 2][BOYUT - 2] = 0;

    return maze;
}

// ---------------------------------------------------------
// 3) Çizdirme
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

            if (currentMaze[y][x] === 1) hucre.classList.add("duvar");

            if (x === 1 && y === 1) hucre.classList.add("baslangic");
            if (x === BOYUT - 2 && y === BOYUT - 2) hucre.classList.add("bitis");

            oyunKutusu.appendChild(hucre);
        }
    }

    oyuncuX = 1;
    oyuncuY = 1;
    oyuncuYon = "sag";
    oyuncuyuCiz();
}

// ---------------------------------------------------------
// 4) Oyuncu çiz
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
// 5) Hareket (DONMA FIX burada)
// ---------------------------------------------------------
function oyuncuyuHareketEttir(dx, dy, yon, izBirak = true) {
    if (oyunBittiMi) return;

    const yeniX = oyuncuX + dx;
    const yeniY = oyuncuY + dy;

    // ✅ DONMA FIX 1: Önce sınır kontrolü (out-of-bounds olursa patlamasın)
    if (yeniX < 0 || yeniX >= BOYUT || yeniY < 0 || yeniY >= BOYUT) {
        cezaSayisi++;
        cezaGostergesi.textContent = cezaSayisi;
        return;
    }

    // duvar mı?
    if (currentMaze[yeniY][yeniX] === 1) {
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

    oyuncuX = yeniX;
    oyuncuY = yeniY;
    oyuncuYon = yon;

    oyuncuyuCiz();

    // bitiş
    if (oyuncuX === BOYUT - 2 && oyuncuY === BOYUT - 2) {
        level++;
        levelGostergesi.textContent = level;

        toplamPuan += Math.max(0, kalanSure);
        toplamPuanGostergesi.textContent = toplamPuan;

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

        if (kalanSure <= 10) sureGostergesi.classList.add("kritik");

        if (kalanSure <= 0) {
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
// 7) Klavye
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (oyunBittiMi) return;

    if (e.key === "ArrowUp") oyuncuyuHareketEttir(0, -1, "yukari");
    if (e.key === "ArrowDown") oyuncuyuHareketEttir(0, 1, "asagi");
    if (e.key === "ArrowLeft") oyuncuyuHareketEttir(-1, 0, "sol");
    if (e.key === "ArrowRight") oyuncuyuHareketEttir(1, 0, "sag");
});

// ---------------------------------------------------------
// 8) Swipe (kısa = 1, basılı = sürekli) + DONMA FIX 2
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
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "sag" : "sol";
    return dy > 0 ? "asagi" : "yukari";
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
    // multi-touch karışmasın: sadece 1 parmak takip
    if (aktifPointerId !== null) return;

    swipeAktif = true;
    aktifPointerId = e.pointerId;

    // ✅ DONMA FIX 2: pointer capture (parmak dışarı çıksa bile up yakalanır)
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
    if (aktifPointerId !== e.pointerId && e.type !== "pointerup") return;

    if (!holdMode && swipeYonu) {
        const [dx, dy, yon] = yonuHareketeCevir(swipeYonu);
        oyuncuyuHareketEttir(dx, dy, yon);
    }

    // capture bırak
    try {
        if (aktifPointerId !== null) oyunKutusu.releasePointerCapture(aktifPointerId);
    } catch (_) {}

    swipeSifirla();
    e.preventDefault();
}

oyunKutusu.addEventListener("pointerup", pointerBitir, { passive: false });
oyunKutusu.addEventListener("pointercancel", pointerBitir, { passive: false });

// ✅ ekstra güvenlik: parmak ekrandan kalktı ama element yakalayamadıysa
window.addEventListener("pointerup", (e) => {
    if (aktifPointerId === e.pointerId) pointerBitir(e);
}, { passive: false });

// ---------------------------------------------------------
// 9) Resize
// ---------------------------------------------------------
window.addEventListener("resize", () => {
    responsiveBoyutAyarla();
});

// ---------------------------------------------------------
// 10) Başlat
// ---------------------------------------------------------
haritaUret();
zamanlayiciBaslat();
