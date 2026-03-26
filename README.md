# Hoa Ngữ HSK - PWA học tiếng Trung

Đây là bản prototype chạy bằng HTML/CSS/JavaScript thuần, tối ưu để:
- Chạy trực tiếp trên web
- Dùng tốt trên iPhone qua Safari / Add to Home Screen
- Dễ up lên GitHub Pages
- Có cache offline bằng Service Worker
- Lưu dữ liệu local bằng localStorage để tránh mất dữ liệu khi refresh

## Tính năng đã có
- Đăng nhập / đăng ký
- Admin Control
  - Tạo tài khoản khách
  - Khoá / mở tài khoản
  - Nâng VIP theo từng cấp HSK
  - Bảng quản lý user khách
- User khách
  - HSK1 free
  - HSK2 trở đi bị khoá nếu chưa được cấp quyền
  - Popup yêu cầu liên hệ Admin để mua / cấp quyền
- Học theo HSK1-HSK9 và HSKK
  - Luyện gõ Hán tự
  - Flashcard random
  - Phản xạ 3 giây
  - Hội thoại
  - Bài tập kiểu HSK
- Lưu lịch sử hoạt động, user không có chức năng xoá
- Giao diện phong cách Trung Hoa, có sắc đỏ vàng và hoa anh đào

## Tài khoản demo
- Admin: `admin` / `admin123`
- User: `demo` / `123456`

## Cách chạy local
Chỉ cần mở `index.html` bằng Live Server hoặc deploy lên hosting tĩnh.

### Nếu chạy bằng Python
```bash
python -m http.server 8080
```
Sau đó mở `http://localhost:8080`

## Up lên GitHub Pages
1. Tạo repo mới trên GitHub
2. Upload toàn bộ file trong thư mục này
3. Vào Settings > Pages
4. Chọn branch `main` và thư mục `/root`
5. GitHub sẽ cấp link public

## Gợi ý nâng cấp production
- Dùng backend thật: Node.js/NestJS hoặc Laravel
- Dùng database: PostgreSQL / MySQL
- Mã hoá password bằng bcrypt
- Xác thực JWT / session
- Upload bộ từ vựng HSK chuẩn bằng file JSON/CSV
- Thêm thanh toán, phân quyền server-side
- Dùng Capacitor để đóng gói thành app iPhone thực thụ
