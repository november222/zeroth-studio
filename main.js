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

const SCROLL_LEN = 7200; // px cuộn cho toàn chuỗi

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

// núm xoay: đặt sẵn vị trí trên nóc, nằm ngang, thu nhỏ + ẩn
gsap.set('.dial', { xPercent: -50, yPercent: -50, rotationX: 90, scale: 0, autoAlpha: 0 });
gsap.set('.dial--shutter', { x: 92,  y: -bodyHH, z: -8 });
gsap.set('.dial--rewind',  { x: -98, y: -bodyHH, z: 6 });
gsap.set('.dial--button',  { x: 58,  y: -bodyHH, z: 22 });

// tâm xoay/scale của cả máy ảnh = tâm ống ngắm
gsap.set(cameraBox, { transformOrigin: `50% ${EYE_Y}px ${EYE_Z}px` });

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

// chú thích 3D: ẩn, lùi theo trục Z (bay tới), xoay yaw để ngồi "trong không
// gian" như mặt phẳng chú thích của bản vẽ CAD.
gsap.set('.anno', { autoAlpha: 0, z: -80 });
gsap.set('.anno--l', { rotationY: 17, transformOrigin: '100% 50%' });
gsap.set('.anno--r', { rotationY: -17, transformOrigin: '0% 50%' });
gsap.set('.anno__lead', { scaleX: 0, transformOrigin: 'left center' });
gsap.set('.anno--r .anno__lead', { transformOrigin: 'right center' });
gsap.set('.titleblock', { autoAlpha: 0, y: 12 });

placeDisc();

/* ============================================================
   TIMELINE DUY NHẤT (đơn vị 0..~100, scrub ánh xạ theo cuộn)
   ============================================================ */
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
  },
});

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
tl.to('.dial', { scale: 1, autoAlpha: 1, duration: 5, stagger: 0.4, ease: 'back.out(1.7)' }, BLOOM + 8);
tl.to(cameraBox, { rotationX: -16, rotationY: 30, duration: 18, ease: 'power1.inOut' }, BLOOM);

/* --- 4b. Thông tin xuất hiện CÙNG lúc khối 3D hình thành --- */
// khung tên bản vẽ (2D, góc dưới)
tl.to('.titleblock', { autoAlpha: 1, y: 0, duration: 5, ease: 'power2.out' }, BLOOM);
// chú thích kỹ thuật: bay từ chiều sâu (z) ra + vạch chỉ "vẽ" tới
tl.to('.anno', { autoAlpha: 1, z: 0, duration: 5, stagger: 2.2, ease: 'power2.out' }, BLOOM + 3);
tl.to('.anno__lead', { scaleX: 1, duration: 3, stagger: 2.2, ease: 'power2.out' }, BLOOM + 4);

/* --- 5. Dọn chú thích -> xoay lộ mặt sau -> hạ ống ngắm về giữa ---
   Ống kính GIỮ NGUYÊN, xoay theo khối như một vật thể 3D thật (nó là con của
   .camera-box). Mọi mặt đều backface-visibility:visible -> xuyên thấu, không
   pop, không nhãn để bị soi gương. */
tl.to('.anno', { autoAlpha: 0, z: 40, duration: 4, ease: 'power2.in' }, 49);
tl.to('.anno__lead', { scaleX: 0, duration: 2.5 }, 49);
tl.to(cameraBox, { rotationY: '+=196', duration: 18, ease: 'power1.inOut' }, 53);
tl.to(cameraBox, { rotationX: -5,      duration: 18, ease: 'power1.inOut' }, 53);
tl.to(cameraBox, { y: 160 - EYE_Y,     duration: 13, ease: 'power1.inOut' }, 58);

/* --- 6. Zoom vào ống ngắm.
   KHÔNG ẩn ống kính hay bất kỳ mảng khối nào riêng lẻ nữa — mọi thứ (kể cả
   trụ ống kính) đi theo .camera-box và chỉ TAN cùng lúc qua .camera-scene ->
   không có chi tiết nào "tự dưng biến mất". Chỉ:
   - làm mờ RẤT chậm 24 vạch chia SVG (nguồn nhiễu nét lúc scale lớn) khi khối
     đã quay gần hết ra sau -> mắt không nhận ra;
   - dọn khung tên (2D) trước khi sang nền màu. */
tl.to('.lens__teeth line', { autoAlpha: 0, duration: 10, ease: 'power1.inOut' }, 62);
tl.to('.titleblock', { autoAlpha: 0, duration: 4 }, 66);
tl.to(cameraBox, { scale: 10, duration: 18, ease: 'power2.in' }, 68);

/* --- 7. CROSS-DISSOLVE SỚM: cả cảnh (thân + lăng kính + ống kính) tan CÙNG
   NHAU khi hình còn sạch nét (scale ~4) -> vừa không "vỡ" vừa không mất chi
   tiết lẻ. Lưới mờ nối tiếp. */
tl.to(cameraScene, { autoAlpha: 0, duration: 6, ease: 'power1.inOut' }, 77);
tl.to('.blueprint-bg', { opacity: 0, duration: 9, ease: 'power1.inOut' }, 81);

/* --- 8. Text kết trên nền màu --- */
tl.to('.finale', { autoAlpha: 1, y: 0, duration: 8, ease: 'power2.out' }, 88);
tl.to({}, { duration: 3 }, 100); // đệm cuối

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
