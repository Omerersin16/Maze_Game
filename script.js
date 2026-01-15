const oyunKutusu = document.getElementById('oyun-kutusu');
const sureGostergesi = document.getElementById('sure-gostergesi');
const cezaGostergesi = document.getElementById('ceza-gostergesi');
const toplamPuanGostergesi = document.getElementById('toplam-puan-gostergesi');
const levelGostergesi = document.getElementById('level-gostergesi');

// AYARLAR
const BOYUT = 31; 
const HUCRE_BOYUTU = "18px"; 
const BASLANGIC_SURESI = 45; 
const BASE_PUAN = 100; 

// OYUN DURUM DEĞİŞKENLERİ
let harita = [];
let oyuncuPos = { y: 0, x: 0 }; 
let baslangicPos = { y: 0, x: 0 }; 
let bitisPos = { y: 0, x: 0 }; 
let divKutulari = []; 
let suankiAci = 0; 
let oyunBittiMi = false; 

// LEVEL VE PUAN DEĞİŞKENLERİ
let currentLevel = 1;
let genelToplamPuan = 0;

// SAYAÇ VE PUANLAMA
let kalanSure = BASLANGIC_SURESI;
let sayacInterval;
let ilkHareketYapildi = false; 
let geriHamleSayisi = 0; 

function haritaUret() {
    harita = [];
    oyunBittiMi = false;
    geriHamleSayisi = 0; 
    oyunKutusu.innerHTML = '';
    
    // Panelleri Güncelle
    clearInterval(sayacInterval);
    kalanSure = BASLANGIC_SURESI;
    
    sureGostergesi.innerText = kalanSure;
    sureGostergesi.classList.remove('kritik');
    cezaGostergesi.innerText = "0";
    levelGostergesi.innerText = currentLevel;

    // --- OTOMATİK BAŞLATMA MANTIĞI ---
    // Level 1 ise: Oyuncu tuşa basınca süre başlar.
    // Level > 1 ise: Süre HEMEN başlar.
    if (currentLevel > 1) {
        ilkHareketYapildi = true; 
        sayaciBaslat(); 
    } else {
        ilkHareketYapildi = false; // Level 1'de bekle
    }

    // Grid Ayarı
    oyunKutusu.style.gridTemplateColumns = `repeat(${BOYUT}, ${HUCRE_BOYUTU})`;
    oyunKutusu.style.gridTemplateRows = `repeat(${BOYUT}, ${HUCRE_BOYUTU})`;

    // Harita Oluşturma (Duvarlar, Madenci Algoritması, Giriş/Çıkış) - Standart Kodlar
    for (let y = 0; y < BOYUT; y++) {
        let satir = [];
        for (let x = 0; x < BOYUT; x++) { satir.push(1); }
        harita.push(satir);
    }

    const yonler = [{ y: 0, x: 2 }, { y: 0, x: -2 }, { y: 2, x: 0 }, { y: -2, x: 0 }];
    let yigin = [];
    let baslangicKazma = { y: 1, x: 1 }; 
    harita[baslangicKazma.y][baslangicKazma.x] = 0; 
    yigin.push(baslangicKazma);

    while (yigin.length > 0) {
        let mevcut = yigin[yigin.length - 1]; 
        let komsular = [];
        for (let i = 0; i < yonler.length; i++) {
            let dy = yonler[i].y;
            let dx = yonler[i].x;
            let hedefY = mevcut.y + dy;
            let hedefX = mevcut.x + dx;
            if (hedefY > 0 && hedefY < BOYUT - 1 && hedefX > 0 && hedefX < BOYUT - 1 && harita[hedefY][hedefX] === 1) {
                komsular.push({ y: hedefY, x: hedefX, dy: dy, dx: dx });
            }
        }
        if (komsular.length > 0) {
            let index = Math.floor(Math.random() * komsular.length);
            let secilen = komsular[index];
            harita[mevcut.y + (secilen.dy / 2)][mevcut.x + (secilen.dx / 2)] = 0;
            harita[secilen.y][secilen.x] = 0;
            yigin.push({ y: secilen.y, x: secilen.x });
        } else {
            yigin.pop();
        }
    }

    let girisKenari = Math.floor(Math.random() * 4);
    let cikisKenari = (girisKenari + 2) % 4; 
    oyuncuPos = kenardanNoktaSec(girisKenari);
    baslangicPos = { ...oyuncuPos }; 
    harita[oyuncuPos.y][oyuncuPos.x] = 0; 
    bitisPos = kenardanNoktaSec(cikisKenari);
    harita[bitisPos.y][bitisPos.x] = 0; 
    baslangicAcisiniAyarla();
    
    sahneyiCiz();
}

function kenardanNoktaSec(kenarIndex) {
    let aday = { y: 0, x: 0 };
    let gecerli = false;
    let deneme = 0;
    while (!gecerli && deneme < 1000) {
        deneme++;
        let rastgeleIndex = Math.floor(Math.random() * (BOYUT - 2)) + 1;
        if (kenarIndex === 0) { aday = { y: 0, x: rastgeleIndex }; if (harita[1][rastgeleIndex] === 0) gecerli = true; } 
        else if (kenarIndex === 1) { aday = { y: rastgeleIndex, x: BOYUT - 1 }; if (harita[rastgeleIndex][BOYUT - 2] === 0) gecerli = true; }
        else if (kenarIndex === 2) { aday = { y: BOYUT - 1, x: rastgeleIndex }; if (harita[BOYUT - 2][rastgeleIndex] === 0) gecerli = true; }
        else if (kenarIndex === 3) { aday = { y: rastgeleIndex, x: 0 }; if (harita[rastgeleIndex][1] === 0) gecerli = true; }
    }
    return aday;
}

function baslangicAcisiniAyarla() {
    if (oyuncuPos.y === 0) suankiAci = 180;      
    else if (oyuncuPos.y === BOYUT-1) suankiAci = 0; 
    else if (oyuncuPos.x === 0) suankiAci = 90;  
    else if (oyuncuPos.x === BOYUT-1) suankiAci = -90; 
}

function sayaciBaslat() {
    sayacInterval = setInterval(() => {
        if (oyunBittiMi) return;
        kalanSure--;
        sureGostergesi.innerText = kalanSure;
        if (kalanSure <= 10) sureGostergesi.classList.add('kritik');
        
        if (kalanSure <= 0) {
            oyunuKaybet(); // Süre bitince oyun biter
        }
    }, 1000);
}

function oyunuKaybet() {
    clearInterval(sayacInterval);
    oyunBittiMi = true;
    sureGostergesi.innerText = "BİTTİ";
    
    // OYUN SONU MESAJI
    setTimeout(() => {
        alert(
            `OYUN BİTTİ! ☠️\n\n` +
            `Ulaşılan Level: ${currentLevel}\n` +
            `Toplam Puan: ${genelToplamPuan}\n\n` +
            `Tamam'a basarsan en baştan başlar!`
        );
        // OYUNU SIFIRLA
        currentLevel = 1;
        genelToplamPuan = 0;
        toplamPuanGostergesi.innerText = "0";
        haritaUret(); // Başa dön
    }, 100);
}

function puanHesapla() {
    let hamCeza = geriHamleSayisi * 0.1;
    let yuvarlanmisCeza = Math.round(hamCeza);
    let levelPuani = BASE_PUAN + kalanSure - yuvarlanmisCeza;
    if (levelPuani < 0) levelPuani = 0;
    
    return { puan: levelPuani, ceza: yuvarlanmisCeza };
}

function sahneyiCiz() {
    oyunKutusu.innerHTML = '';
    divKutulari = [];
    for (let y = 0; y < BOYUT; y++) {
        let satirDivleri = [];
        for (let x = 0; x < BOYUT; x++) {
            let kutu = document.createElement('div');
            kutu.classList.add('hucre'); 
            if (harita[y][x] === 1) kutu.classList.add('duvar');
            else if (y === baslangicPos.y && x === baslangicPos.x) kutu.classList.add('baslangic');
            else if (y === bitisPos.y && x === bitisPos.x) kutu.classList.add('bitis');
            oyunKutusu.appendChild(kutu);
            satirDivleri.push(kutu);
        }
        divKutulari.push(satirDivleri);
    }
    oyuncuyuGuncelle();
}

function oyuncuyuGuncelle() {
    let hedefKutu = divKutulari[oyuncuPos.y][oyuncuPos.x];
    let eskiKarakter = hedefKutu.querySelector('.ucgen-karakter');
    if(eskiKarakter) eskiKarakter.remove();
    hedefKutu.innerHTML += `<div class="ucgen-karakter" style="transform: rotate(${suankiAci}deg);"></div>`;
}

function hareketEt(dy, dx, aci) {
    if (oyunBittiMi) return;

    // Level 1 ise ilk harekette süre başlar
    if (!ilkHareketYapildi) {
        ilkHareketYapildi = true;
        sayaciBaslat();
    }

    let yeniY = oyuncuPos.y + dy;
    let yeniX = oyuncuPos.x + dx;

    if (yeniY >= 0 && yeniY < BOYUT && yeniX >= 0 && yeniX < BOYUT) {
        if (harita[yeniY][yeniX] !== 1) {
            
            let eskiKutu = divKutulari[oyuncuPos.y][oyuncuPos.x];
            let karakter = eskiKutu.querySelector('.ucgen-karakter');
            if(karakter) karakter.remove();

            if (!eskiKutu.querySelector('.iz') && !eskiKutu.classList.contains('bitis') && !eskiKutu.classList.contains('baslangic')) {
                let iz = document.createElement('div');
                iz.classList.add('iz');
                eskiKutu.appendChild(iz);
            }

            let hedefKutu = divKutulari[yeniY][yeniX];
            if (hedefKutu.querySelector('.iz') || hedefKutu.classList.contains('baslangic')) {
                geriHamleSayisi++;
                cezaGostergesi.innerText = geriHamleSayisi;
            }

            oyuncuPos.y = yeniY;
            oyuncuPos.x = yeniX;
            suankiAci = aci;
            oyuncuyuGuncelle();

            // --- LEVEL BİTİŞ KONTROLÜ ---
            if (oyuncuPos.y === bitisPos.y && oyuncuPos.x === bitisPos.x) {
                clearInterval(sayacInterval); 
                oyunBittiMi = true; // Geçici olarak durdur
                
                // Puan Hesapla ve Ekle
                let sonuc = puanHesapla();
                genelToplamPuan += sonuc.puan;
                toplamPuanGostergesi.innerText = genelToplamPuan;
                
                // Bilgi Ver ve Sonraki Levele Geç
                setTimeout(() => {
                    alert(
                        `LEVEL ${currentLevel} TAMAMLANDI! 🎉\n` +
                        `Level Puanı: ${sonuc.puan}\n` +
                        `Toplam Puan: ${genelToplamPuan}\n\n` +
                        `Hazır ol! Yeni level başlıyor...`
                    );
                    
                    // YENİ LEVELE GEÇİŞ
                    currentLevel++;
                    haritaUret(); // Bu fonksiyon içinde süre otomatik başlayacak (Level > 1 olduğu için)
                    
                }, 50);
            }
        }
    }
}

document.addEventListener('keydown', (e) => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if (e.key === 'ArrowUp' || e.key === 'w')    hareketEt(-1, 0, 0); 
    if (e.key === 'ArrowRight' || e.key === 'd') hareketEt(0, 1, 90); 
    if (e.key === 'ArrowDown' || e.key === 's')  hareketEt(1, 0, 180); 
    if (e.key === 'ArrowLeft' || e.key === 'a')  hareketEt(0, -1, -90); 
});

// --- MOBİL KONTROLLER ---

// HTML'deki butonları seç
const btnY = document.getElementById('btn-yukari');
const btnA = document.getElementById('btn-asagi');
const btnSol = document.getElementById('btn-sol');
const btnSag = document.getElementById('btn-sag');

// Dokunma (Touch) ve Tıklama (Click) Olaylarını Ekle
// preventDefault() kullanıyoruz ki butona basınca ekran yakınlaşmasın/kaymasın.

function butonBagla(btn, dy, dx, aci) {
    const islem = (e) => {
        if(e.cancelable) e.preventDefault(); // Ekran kaymasını önle
        hareketEt(dy, dx, aci);
    };
    
    btn.addEventListener('touchstart', islem, {passive: false});
    btn.addEventListener('mousedown', islem); // PC'de mouse ile test için
}

// Yönleri Tanımla (Aynı klavye mantığı)
butonBagla(btnY, -1, 0, 0);    // Yukarı
butonBagla(btnA, 1, 0, 180);   // Aşağı
butonBagla(btnSag, 0, 1, 90);  // Sağ
butonBagla(btnSol, 0, -1, -90); // Sol

// Başlat
haritaUret();
