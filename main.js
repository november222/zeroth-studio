/* ============================================================
   Zeroth Studio — một pin-stage, một timeline GSAP
   ============================================================ */
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* Chống rung/giật khi cuộn:
   - normalizeScroll: GSAP tự xử lý cuộn (đồng bộ), bỏ async-scroll của trình
     duyệt vốn gây jitter khi pin + scrub, nhất là trên mobile.
   - ignoreMobileResize: thanh địa chỉ mobile ẩn/hiện không kích hoạt refresh
     (nguồn gây "nảy" khối). */
ScrollTrigger.config({ ignoreMobileResize: true });
ScrollTrigger.normalizeScroll(true);

const SCROLL_LEN = 7900; // px cuộn cho toàn chuỗi

/* ---------- refs ---------- */
const logoDisc      = document.querySelector('.logo__disc');
const logo          = document.querySelector('.logo');
const cameraBox     = document.querySelector('.camera-box');
const cameraScene   = document.querySelector('.camera-scene');
const lensSvg       = document.querySelector('.lens');
const lensCore      = document.querySelector('.lens__core');
const camBody       = document.querySelector('.cam-body');
const camPrism      = document.querySelector('.cam-prism');
const camLens       = document.querySelector('.cam-lens');

/* ---------- kích thước máy ảnh (px, không gian của .camera-box) ---------- */
const CAM = {
  body:  { w: 310, h: 188, d: 96 },
  prism: { w: 100, h: 48,  d: 64 },
  barrel: 64,                       // chiều dài trụ ống kính
};
const bodyHW = CAM.body.w / 2, bodyHH = CAM.body.h / 2, bodyHD = CAM.body.d / 2;
const prismHH = CAM.prism.h / 2, prismHD = CAM.prism.d / 2;
const barrelHalf = CAM.barrel / 2;                 // 32
const lensOut  = bodyHD + barrelHalf;              // cam-lens translateZ đích = 78
const prismTop = -(bodyHH + prismHH);              // cam-prism translateY đích = -110
// tâm ống ngắm trong không gian .camera-box (320px, tâm ở 160)
const EYE_Y = 160 + prismTop;                      // 50px từ đỉnh
const EYE_Z = -prismHD;                            // -30px

/* ---------- lõi lens: đích của đĩa rơi = rect thật của .lens__core ---------- */
const coreRect = () => lensCore.getBoundingClientRect();
const logoRect = () => logo.getBoundingClientRect();

/* đĩa trắng: nằm sẵn trùng .logo (position:absolute; inset:0), CHỮ Z ĐEN đè lên
   trên (z-index). Chỉ animate TRANSFORM (x/y/scale) để "trôi" xuống lens —
   không đụng left/top/width/height nên không reflow từng frame. */
function placeDisc() {
  gsap.set(logoDisc, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
}
ScrollTrigger.addEventListener('refreshInit', placeDisc);

/* ---------- vạch chia quanh ống kính (thước đo bản vẽ) ---------- */
const teeth = lensSvg.querySelector('.lens__teeth');
const TEETH = 24;
for (let i = 0; i < TEETH; i++) {
  const a = (i / TEETH) * Math.PI * 2;
  const r1 = 122;
  const r2 = i % 2 === 0 ? 138 : 130;
  const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ln.setAttribute('x1', (150 + Math.cos(a) * r1).toFixed(2));
  ln.setAttribute('y1', (150 + Math.sin(a) * r1).toFixed(2));
  ln.setAttribute('x2', (150 + Math.cos(a) * r2).toFixed(2));
  ln.setAttribute('y2', (150 + Math.sin(a) * r2).toFixed(2));
  teeth.appendChild(ln);
}

/* ---------- nan dọc của trụ ống kính (10 thanh chạy theo trục Z) ---------- */
const ribsWrap = camLens.querySelector('.lribs');
const RIBS = 10;
for (let i = 0; i < RIBS; i++) {
  const el = document.createElement('i');
  el.style.transform =
    `rotateZ(${(i / RIBS) * 360}deg) translateY(-88px) rotateY(90deg)`;
  ribsWrap.appendChild(el);
}

/* ---------- vòng + tâm ngắm SVG: chuẩn bị stroke-dash để "vẽ dần" ---------- */
gsap.utils.toArray('.lens__ring').forEach((r) => {
  const len = 2 * Math.PI * r.r.baseVal.value;
  r.style.strokeDasharray = len;
  r.style.strokeDashoffset = len;
});
gsap.utils.toArray('.lens__cross-line').forEach((ln) => {
  const len = ln.getTotalLength();
  ln.style.strokeDasharray = len;
  ln.style.strokeDashoffset = len;
});

/* ============================================================
   TRẠNG THÁI ĐẦU
   ============================================================ */
// Mỗi hộp con: 6 mặt căn tâm (xPercent/yPercent) + góc xoay CỐ ĐỊNH, dịch = 0.
// Ở z/x/y = 0 mặt xoay 90° tự vô hình (edge-on) -> "nở" chỉ cần animate 1 trục.
function primeWireBox(root) {
  const P = (s) => root.querySelector('.pane--' + s);
  gsap.set(P('ft'), { xPercent: -50, yPercent: -50, rotationY: 0,   z: 0 });
  gsap.set(P('bk'), { xPercent: -50, yPercent: -50, rotationY: 180, z: 0 });
  gsap.set(P('tp'), { xPercent: -50, yPercent: -50, rotationX: 90,  y: 0 });
  gsap.set(P('bt'), { xPercent: -50, yPercent: -50, rotationX: -90, y: 0 });
  gsap.set(P('lf'), { xPercent: -50, yPercent: -50, rotationY: -90, x: 0 });
  gsap.set(P('rt'), { xPercent: -50, yPercent: -50, rotationY: 90,  x: 0 });
}
primeWireBox(camBody);
primeWireBox(camPrism);

// hộp con căn tâm .camera-box
gsap.set(camBody,  { xPercent: -50, yPercent: -50 });
gsap.set(camLens,  { xPercent: -50, yPercent: -50, z: 0 });
gsap.set(camPrism, { xPercent: -50, yPercent: -50, y: 0, z: 0 });

// vòng + nan trụ ống kính: gộp tại tâm, ẩn
gsap.set('.lring', { z: 0, autoAlpha: 0 });
gsap.set('.lens-cap', { z: 0 });
gsap.set('.lribs i', { autoAlpha: 0 });

// núm xoay = TRỤ CSS 3D: thành trụ = k.seg tấm phẳng xếp vòng (rotateY + translateZ),
// vành đỉnh/đáy = 2 hình tròn nằm ngang (rotationX 90). Cả cụm chìm dưới nóc,
// trồi lên lúc "nở". KHÔNG animate opacity/autoAlpha trên .knob (sẽ làm phẳng);
// bật/tắt bằng visibility.
const KNOBS = [
  { sel: '.knob--shutter', d: 46, h: 14, seg: 16, x: 100,  z: -4 },
  { sel: '.knob--rewind',  d: 36, h: 12, seg: 14, x: -102, z: -2 },
  { sel: '.knob--btn',     d: 16, h: 8,  seg: 10, x: 58,   z: 26 },
];
KNOBS.forEach((k) => {
  const g = document.querySelector(k.sel);
  const R = k.d / 2;
  const chord = 2 * R * Math.sin(Math.PI / k.seg) + 0.6;
  g.style.setProperty('--kd', k.d + 'px');
  g.style.setProperty('--kh', k.h + 'px');
  g.style.setProperty('--kseg', chord.toFixed(1) + 'px');
  const cyl = g.querySelector('.knob__cyl');
  for (let i = 0; i < k.seg; i++) {
    const s = document.createElement('i');
    s.style.transform = `rotateY(${((i / k.seg) * 360).toFixed(1)}deg) translateZ(${R.toFixed(1)}px)`;
    cyl.appendChild(s);
  }
  k.yUp = -bodyHH - k.h / 2 + 8;        // đích: đáy trụ cắm nhẹ vào mặt nóc
  gsap.set(k.sel, { xPercent: -50, yPercent: -50, x: k.x, z: k.z, y: k.yUp + 18, visibility: 'hidden' });
  // Căn tâm lid/foot/pip = CSS margin (giống các mảnh thành trụ). KHÔNG dùng
  // xPercent/yPercent nữa -> tránh CĂN TÂM 2 LẦN làm lệch vân với khối trụ.
  gsap.set(k.sel + ' .knob__lid',  { rotationX: 90, y: -k.h / 2 });
  gsap.set(k.sel + ' .knob__foot', { rotationX: 90, y: k.h / 2 });
  gsap.set(k.sel + ' .knob__pip',  { rotationX: 90, y: -k.h / 2, transformOrigin: '50% 0%' });
  // .knob__cyl: KHÔNG gsap.set (GSAP ghi matrix() 2D -> làm phẳng thành trụ)
});

// tâm xoay/scale của cả máy ảnh = TÂM KHỐI (= vị trí điểm trắng lõi lens).
// will-change bật lúc xoay, JS TẮT ngay trước cú zoom scale:10 để mobile không
// giữ lại texture khổng lồ (nguồn gốc "mất nét khi cuộn ngược" trên Samsung).
gsap.set(cameraBox, { transformOrigin: '50% 50%', willChange: 'transform' });
gsap.set('.whiteout', { opacity: 0 });

// mọi mảnh khối (trừ SVG lens đang là "lens phẳng") ẩn tới lúc "nở"
gsap.set(camBody.querySelectorAll('.pane'), { autoAlpha: 0 });
gsap.set(camPrism.querySelectorAll('.pane'), { autoAlpha: 0 });

gsap.set('.lens__core',  { autoAlpha: 0, transformOrigin: '50% 50%' });
gsap.set('.lens__rings', { autoAlpha: 0 });
gsap.set('.lens__cross', { autoAlpha: 0 });
gsap.set('.lens__teeth', { autoAlpha: 0 });
gsap.set('.lens__teeth line', { autoAlpha: 0 });
gsap.set('.lens-caption', { autoAlpha: 0, y: 16 });
gsap.set('.finale', { autoAlpha: 0, y: 24 });

// chú thích 3D: cùng một ô neo, ban đầu GẬP LẠI quanh cạnh trái (edge-on, vô
// hình) + lùi nhẹ theo trục Z. Tới nhịp sẽ "lật" mở ra hướng người xem.
gsap.set('.anno', {
  autoAlpha: 0, rotationY: 92, rotationX: 5, z: -46,
  transformOrigin: '0% 50%',
});
gsap.set('.titleblock', { autoAlpha: 0, y: 12 });

// gợi ý cuộn: hiện sẵn, timeline sẽ làm tan đi ngay khi bắt đầu cuộn
gsap.set('.scroll-cue', { autoAlpha: 1 });

placeDisc();

/* ============================================================
   TIMELINE DUY NHẤT (đơn vị 0..~100, scrub ánh xạ theo cuộn)
   ============================================================ */
/* Cuộn NGƯỢC (color page -> máy ảnh): ép trình duyệt raster lại khối 3D một lần
   khi đổi hướng. Trên mobile, layer đã bị phóng to lúc zoom có thể được tái dùng
   ở dạng texture cũ đã suy giảm -> mất nét. Nhấp will-change buộc bỏ & dựng lại
   lớp với ảnh mới. Chỉ chạy 1 lần mỗi lần đảo hướng nên không tốn kém. */
function repaint3D() {
  [cameraBox, camBody, camPrism, camLens].forEach((el) => {
    const keep = el.style.willChange;
    el.style.willChange = 'auto';
    void el.offsetWidth;                 // buộc reflow -> huỷ layer cũ
    el.style.willChange = keep || '';
  });
}
let lastScrubDir = 1;

const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '.pin-stage',
    start: 'top top',
    end: '+=' + SCROLL_LEN,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (self.direction !== lastScrubDir) {
        lastScrubDir = self.direction;
        if (self.direction === -1 && self.progress < 0.9) repaint3D();
      }
    },
  },
});

/* --- 0. Gợi ý cuộn tan đi ngay khi người dùng bắt đầu cuộn --- */
tl.to('.scroll-cue', { autoAlpha: 0, duration: 2, ease: 'power1.in' }, 0);

/* --- 1. Đĩa trắng "trôi" khỏi menu xuống vị trí lens ---
   Đích = rect THẬT của .lens__core (ở progress 0 khối chưa biến dạng nên
   getBoundingClientRect cho đúng vị trí/kích thước sẽ crossfade).
   Chữ Z ở lại chỗ logo (không đi theo đĩa). */
tl.fromTo(logoDisc,
  { x: 0, y: 0, scale: 1 },
  {
    x: () => (coreRect().left + coreRect().width / 2) - (logoRect().left + logoRect().width / 2),
    y: () => (coreRect().top + coreRect().height / 2) - (logoRect().top + logoRect().height / 2),
    scale: () => coreRect().width / logoRect().width,
    ease: 'power1.inOut',
    immediateRender: true,
    duration: 8,
  }, 0);

// chữ "Z" đen -> trắng ngay khi đĩa bắt đầu trôi (lộ ra trên nền tối + vòng viền)
tl.to('.logo__z', { color: '#e8f2ff', duration: 1 }, 0.4);

/* --- 2. Crossfade tức thời: đĩa HTML -> circle trong SVG lens --- */
tl.set('.lens__core', { autoAlpha: 1 }, 7.5);
tl.to(logoDisc, { autoAlpha: 0, duration: 1.0 }, 7.6);

/* --- 3. Xây "lens" sơ đồ: tâm ngắm + 3 vòng đồng tâm vẽ dần + vạch chia --- */
tl.set('.lens__cross', { autoAlpha: 1 }, 8.4);
tl.to('.lens__cross-line', { strokeDashoffset: 0, duration: 4, ease: 'power1.inOut' }, 8.4);

tl.set('.lens__rings', { autoAlpha: 1 }, 8.8);
tl.to('.lens__ring--1', { strokeDashoffset: 0, duration: 6, ease: 'power1.inOut' }, 9.0);
tl.to('.lens__ring--2', { strokeDashoffset: 0, duration: 5, ease: 'power1.inOut' }, 10.5);
tl.to('.lens__ring--3', { strokeDashoffset: 0, duration: 4, ease: 'power1.inOut' }, 12.0);

tl.set('.lens__teeth', { autoAlpha: 1 }, 13);
tl.to('.lens__teeth line', { autoAlpha: 1, duration: 3, stagger: 0.05 }, 13);

tl.to('.lens-caption', { autoAlpha: 1, y: 0, duration: 4, ease: 'power2.out' }, 16.5);
tl.to('.lens-caption', { autoAlpha: 0, y: -14, duration: 3, ease: 'power2.in' }, 25);

/* --- 4. "Nở" phẳng -> bản vẽ CAD một máy ảnh cơ 3D --- */
const BLOOM = 30;
const bl = { duration: 15, ease: 'power2.inOut' };
const bodyPane  = (s) => camBody.querySelector('.pane--' + s);
const prismPane = (s) => camPrism.querySelector('.pane--' + s);

// THÂN MÁY: 6 mặt hiện + đùn ra theo công thức nửa cạnh
tl.to(camBody.querySelectorAll('.pane'), { autoAlpha: 1, duration: 6 }, BLOOM);
tl.to(bodyPane('ft'), { z:  bodyHD, ...bl }, BLOOM);
tl.to(bodyPane('bk'), { z: -bodyHD, ...bl }, BLOOM);
tl.to(bodyPane('tp'), { y: -bodyHH, ...bl }, BLOOM);   // trên/dưới = nửa CHIỀU CAO
tl.to(bodyPane('bt'), { y:  bodyHH, ...bl }, BLOOM);
tl.to(bodyPane('lf'), { x: -bodyHW, ...bl }, BLOOM);   // trái/phải = nửa CHIỀU RỘNG
tl.to(bodyPane('rt'), { x:  bodyHW, ...bl }, BLOOM);

// ỐNG KÍNH: trụ đẩy ra trước, 3 vòng tách theo trục Z, nan + cap chạy tới
tl.to(camLens,     { z: lensOut,     ...bl }, BLOOM + 1);
tl.to('.lens-cap', { z: barrelHalf,  ...bl }, BLOOM + 1);
tl.to('.lring--f', { z:  barrelHalf, autoAlpha: 0.9,  ...bl }, BLOOM + 1);
tl.to('.lring--m', { z:  0,          autoAlpha: 0.7,  ...bl }, BLOOM + 1);
tl.to('.lring--r', { z: -barrelHalf, autoAlpha: 0.55, ...bl }, BLOOM + 1);
tl.to('.lribs i',  { autoAlpha: 1, duration: 5, stagger: 0.12 }, BLOOM + 4);

// LĂNG KÍNH NGŨ GIÁC: trồi lên nóc + 6 mặt đùn ra
tl.to(camPrism.querySelectorAll('.pane'), { autoAlpha: 1, duration: 6 }, BLOOM + 3);
tl.to(camPrism,        { y: prismTop,        ...bl }, BLOOM + 3);
tl.to(prismPane('ft'), { z:  prismHD,        ...bl }, BLOOM + 3);
tl.to(prismPane('bk'), { z: -prismHD,        ...bl }, BLOOM + 3);
tl.to(prismPane('tp'), { y: -prismHH,        ...bl }, BLOOM + 3);
tl.to(prismPane('bt'), { y:  prismHH,        ...bl }, BLOOM + 3);
tl.to(prismPane('lf'), { x: -CAM.prism.w / 2, ...bl }, BLOOM + 3);
tl.to(prismPane('rt'), { x:  CAM.prism.w / 2, ...bl }, BLOOM + 3);

// NÚM XOAY + nút chụp bung ra; nghiêng nhẹ lộ chiều sâu
KNOBS.forEach((k, i) => {
  tl.set(k.sel, { visibility: 'visible' }, BLOOM + 8 + i * 0.5);
  tl.to(k.sel, { y: k.yUp, duration: 5, ease: 'back.out(1.4)' }, BLOOM + 8 + i * 0.5);
});
tl.to(cameraBox, { rotationX: -24, rotationY: 33, duration: 18, ease: 'power1.inOut' }, BLOOM);

/* --- 4b. Khung tên bản vẽ (2D, góc dưới) --- */
tl.to('.titleblock', { autoAlpha: 1, y: 0, duration: 5, ease: 'power2.out' }, BLOOM);

/* --- 5. Xoay gần 1 vòng quanh khối (chú thích chạy theo góc) rồi XOAY VỀ
   CHÍNH DIỆN để ĐIỂM TRẮNG (lõi lens ở tâm khối) nằm giữa màn hình.
   Khối giữ nguyên ở tâm — không hạ như bản zoom-ống-ngắm cũ. */
tl.to(cameraBox, { rotationY: 202, duration: 15, ease: 'power1.inOut' }, 53);   // ra sau
tl.to(cameraBox, { rotationX: -6,  duration: 15, ease: 'power1.inOut' }, 53);
tl.to(cameraBox, { rotationY: 360, duration: 15, ease: 'power1.inOut' }, 70);   // về trước
tl.to(cameraBox, { rotationX: 0,   duration: 15, ease: 'power1.inOut' }, 70);

/* --- 5b. Chú thích hiện LẦN LƯỢT — cùng một ô neo, "lật" mở ra 3D rồi gập lại
   (không còn ghim vào bộ phận nào của máy). */
function annoBeat(sel, inAt, outAt) {
  tl.to(sel, { autoAlpha: 1, rotationY: -7, rotationX: 2, z: 0,
               duration: 5, ease: 'power3.out' }, inAt);
  tl.to(sel, { autoAlpha: 0, rotationY: -54, rotationX: 7, z: -28,
               duration: 3.4, ease: 'power2.in' }, outAt);
}
annoBeat('.anno--1', 34, 52);
annoBeat('.anno--3', 52, 62);
annoBeat('.anno--4', 62, 70);
annoBeat('.anno--2', 70, 78);

/* --- 6. LAO VÀO ĐIỂM TRẮNG. Dọn HẾT nét mảnh quanh lõi (vạch chia + vòng ngắm
   + tâm ngắm + nan trụ + vành bezel + núm xoay) TRƯỚC khi phóng to — để scale:10
   chỉ còn tác động lên vài mặt phẳng lớn đơn giản đang văng khỏi khung. Nét 1px
   không bị kéo giãn -> không có gì để "mất" khi cuộn ngược. Khung tên đi trước. */
tl.to('.titleblock', { autoAlpha: 0, duration: 4 }, 72);
tl.to(['.lens__teeth line', '.lens__rings', '.lens__cross', '.lribs i', '.lring'],
      { autoAlpha: 0, duration: 5, ease: 'power1.in' }, 78);
tl.set('.knob', { visibility: 'hidden' }, 80);
tl.set(cameraBox, { willChange: 'auto' }, 80);   // thả layer khổng lồ trước zoom
tl.to(cameraBox, { scale: 10, duration: 15, ease: 'power2.in' }, 82);

/* --- 7. MÀN HÌNH TRẮNG DẦN (điểm trắng phóng to lấp đầy) rồi tan ra lộ nền màu.
   Màn trắng vào MUỘN hơn để điểm trắng kịp choán màn hình trước. */
tl.to('.whiteout', { opacity: 1, duration: 5, ease: 'power1.in' }, 91);
tl.to(cameraScene,     { autoAlpha: 0, duration: 3 }, 95);   // (đã bị màn trắng che)
tl.to('.blueprint-bg', { opacity: 0,   duration: 3 }, 95);
tl.to('.whiteout', { opacity: 0, duration: 10, ease: 'power1.inOut' }, 97);

/* --- 8. Tiêu đề kết hiện ra khi màn trắng lùi, để lộ nền màu --- */
tl.to('.finale', { autoAlpha: 1, y: 0, duration: 8, ease: 'power2.out' }, 100);
tl.to({}, { duration: 3 }, 110); // đệm cuối

/* ============================================================
   Điều hướng nhanh — cuộn animate (ScrollToPlugin), không nhảy
   ============================================================ */
gsap.utils.toArray('[data-scroll]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const t = a.dataset.scroll;
    gsap.to(window, {
      duration: 2,
      ease: 'power2.inOut',
      scrollTo: { y: t === 'top' ? 0 : t, offsetY: 56, autoKill: false },
    });
  });
});

/* ---------- refresh sau khi layout + sau khi font kỹ thuật tải xong ---------- */
window.addEventListener('load', () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
