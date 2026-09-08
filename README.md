# Zeroth Studio

Trang portfolio 1-page, mobile-first, quảng bá dịch vụ thiết kế logo &
định hướng thương hiệu cá nhân của **Zeroth Studio**.

Điểm nhấn: một chuỗi hiệu ứng cuộn (scroll-driven) liền mạch — logo "rơi" khỏi
menu, dựng thành sơ đồ ống kính, "nở" ra thành **bản vẽ CAD wireframe của một máy
ảnh cơ**, xoay lộ ống ngắm, zoom vào ống ngắm rồi hòa vào nền màu sắc với dòng
tiêu đề kết. Toàn bộ nằm trong **một `pin-stage`, một timeline GSAP**.

## Công nghệ

- HTML/CSS/JS thuần, không build step
- [GSAP](https://gsap.com/) 3.12.5 + ScrollTrigger + ScrollToPlugin (CDN)
- CSS 3D thật (`transform-style: preserve-3d`)
- Font: Chakra Petch + Share Tech Mono (Google Fonts)

## Chạy thử

Cần một web server tĩnh (vì dùng module/CDN). Ví dụ với Python:

```bash
python -m http.server 5175
```

Rồi mở `http://localhost:5175`.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Khung trang: 4 lớp (nền màu / lưới blueprint / nav / nội dung cuộn), khối máy ảnh wireframe, chú thích kỹ thuật |
| `styles.css` | Bảng màu blueprint, lưới 2 tầng, các hộp 3D, typography bản vẽ |
| `main.js` | Toàn bộ timeline GSAP scroll-driven |
