@echo off
chcp 65001 >nul
title Deploy Chatbot CHẠM lên Máy Chủ Firebase (ai-cham)
echo ======================================================================
echo          TRIỂN KHAI WEB LÊN MÁY CHỦ GOOGLE FIREBASE HOSTING
echo                   Dự án: ai-cham (PTDTNT Lào Cai)
echo ======================================================================
echo.
echo [*] Bắt đầu triển khai lên Firebase Hosting dự án ai-cham...
echo.
firebase deploy --only hosting
echo.
echo ======================================================================
echo Website của bạn đang hoạt động trên máy chủ Google Firebase tại:
echo  - https://ai-cham.web.app
echo  - https://ai-cham.firebaseapp.com
echo ======================================================================
pause
