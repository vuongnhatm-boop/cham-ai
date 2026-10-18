# HỆ SINH THÁI CHATBOT "CHẠM"
### Trợ Lý Tâm Lý Học Đường & Rèn Luyện Năng Lực Tự Điều Chỉnh Học Tập
**Đơn vị nghiên cứu:** Nhóm tác giả Trường PTDTNT THPT tỉnh Lào Cai  
**Khẩu hiệu:** *"Chạm để Bứt phá — Tâm an Trí vững"*

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN
```
chatbot-cham-ui/
├── index.html                  # Giao diện chính của ứng dụng web
├── firebase.json               # Cấu hình máy chủ Firebase Hosting
├── .firebaserc                 # Cấu hình Firebase Project ID (ai-cham)
├── deploy_firebase.bat         # Tệp triển khai 1-click lên máy chủ Firebase
├── start_server.bat            # Tệp khởi động nhanh 1-click cho máy tính
├── README.md                   # Tài liệu hướng dẫn sử dụng & cấu trúc
│
├── css/
│   └── style.css               # Phong cách thiết kế kép: Xanh Sage & Cam Đào
│
├── js/
│   ├── firebase-service.js     # Kết nối máy chủ đám mây Firebase (Firestore & Analytics)
│   ├── app.js                  # Điều khiển giao diện, kết nối Gemini AI & widgets
│   └── knowledge-base.js       # Toàn bộ tri thức huấn luyện CHẠM & 14 nan thẻ quạt
│
└── docs/
    └── KHO_TRI_THUC_CHATBOT_CHAM.md   # Báo cáo cơ sở tri thức nghiên cứu APA 7th
```

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Kết nối trực tiếp Google Gemini AI:**
   - Sử dụng mô hình `Gemini Flash / Flash Lite` thế hệ mới.
   - Nạp trọn vẹn System Instruction dựa trên mô hình nghiên cứu:
     $$X \text{ (Tư duy phát triển)} \rightarrow M_1 \text{ (Tự trắc ẩn)} \rightarrow M_2 \text{ (Kiệt sức học đường)} \rightarrow Y \text{ (Tự điều chỉnh học tập)}$$
   - Lưu trữ bộ nhớ hội thoại đa lượt (*multi-turn conversation memory*).

2. **Thiết kế Giao diện Kép (Dual Mode):**
   - **Chế độ 1 (Xanh Sage):** Xoa dịu cảm xúc & Tự trắc ẩn (Kristin Neff, Paul Gilbert CFT, Salmela-Aro, CBT Beck).
   - **Chế độ 2 (Cam Đào):** Bứt phá & Tự điều chỉnh học tập (Carol Dweck, Zimmerman, Dunlosky).
   - **Chế độ Tự động:** AI tự phân tích nhu cầu học sinh để điều chỉnh phong cách phản hồi.

3. **Sổ tay Số hóa 14 Nan Thẻ Quạt "Chạm để Bứt phá":**
   - 7 nan xanh hạ nhiệt + 7 nan cam hành động.
   - Nhấn vào từng nan để xem chi tiết hướng dẫn thực hành bỏ túi.

4. **Bộ công cụ tương tác trực tiếp:**
   - 🫁 **Mô phỏng Thở 4-7-8 (Harvard):** Hoạt ảnh vòng tròn co giãn theo đúng nhịp thở 3 chu kỳ.
   - ⏱️ **Quy tắc 5 Phút Khởi Động:** Đếm ngược thời gian thực đánh tan sức ỳ trì hoãn.
   - 🆘 **Sơ cứu Tâm lý Khẩn cấp (WHO PFA):** Kết nối Tổng đài 111, Đường dây nóng Ngày Mai 096 306 1414 và Phòng tư vấn trường Lào Cai.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY

### Cách 1: Chạy bằng file `start_server.bat` (Tiện nhất trên Windows)
1. Nhấp đúp chuột vào file `start_server.bat`.
2. Trình duyệt web sẽ tự động mở địa chỉ: `http://localhost:5500`.

### Cách 2: Khởi chạy bằng lệnh Terminal
Trong thư mục dự án, chạy lệnh:
```bash
python -m http.server 5500
```
Sau đó truy cập trình duyệt tại: **http://localhost:5500**

---

## 🔑 CẤU HÌNH API KEY GOOGLE GEMINI
- Khóa API được tích hợp sẵn và lưu an toàn trong `localStorage` của trình duyệt.
- Bạn có thể nhấn vào biểu tượng **Chìa khóa (🔑)** ở góc trên bên phải thanh điều hướng để xem, đổi hoặc cập nhật API Key bất kỳ lúc nào.
