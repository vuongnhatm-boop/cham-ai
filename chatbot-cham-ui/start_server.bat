@echo off
chcp 65001 >nul
title Chatbot CHẠM - Khởi Động Máy Chủ Local
echo ======================================================================
echo          HỆ SINH THÁI TÂM LÝ & TỰ ĐIỀU CHỈNH HỌC TẬP CHẠM
echo           Trường PTDTNT THPT Tỉnh Lào Cai - Google Gemini AI
echo ======================================================================
echo.
echo [*] Đang khởi động máy chủ tại: http://localhost:5501
echo [*] Trình duyệt web sẽ tự động mở sau 2 giây...
echo.
start "" "http://localhost:5501"
python -m http.server 5501
pause
