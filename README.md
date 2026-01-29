# VIBE VIDEO STUDIO

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/dangngocbinh/vibe-video-agent)
**Author:** [Mecode.pro](https://mecode.pro)

## 📋 Yêu cầu hệ thống

Dự án yêu cầu các công cụ sau để xử lý video và âm thanh:

* **FFmpeg & FFprobe**: Dùng để trích xuất metadata, xử lý âm thanh và render video.
    * **Cài đặt trên macOS (Homebrew):** `brew install ffmpeg`
    * **Cài đặt trên Windows/Linux:** Tải tại [ffmpeg.org](https://ffmpeg.org/download.html)

## 📖 Hướng dẫn sử dụng

### 1. Cài đặt thư viện
Chạy script sau để tự động kiểm tra hệ thống và cài đặt các phụ thuộc:
```bash
node scripts/setup-dependencies.js
```

### 2. Cấu hình môi trường
* Sao chép tệp `.env.example` thành `.env`.
* Cập nhật các thông số **API Key** cần thiết bên trong tệp `.env`.

### 3. Bắt đầu sử dụng
Chat với Agent để thực hiện tác vụ.
* **Ví dụ:** *"Hãy tạo video về chủ đề 'Làm giàu từ AI'"*
