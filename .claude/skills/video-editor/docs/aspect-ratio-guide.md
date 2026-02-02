# Hướng dẫn xử lý Tỷ lệ khung hình (Aspect Ratio)

Video Editor Skill hỗ trợ tự động xử lý các trường hợp video nguồn và project không cùng tỷ lệ khung hình (ví dụ: video ngang đưa vào video dọc).

## 1. Logic tự động (Smart Letterboxing)

Hệ thống sẽ tự động phát hiện nếu project có tỷ lệ dọc (`9:16` hoặc `4:5`) mà video nguồn là khổ ngang (resolution `1920x1080` hoặc tương đương).

- **Hành động**: Tự động set `objectFit: "contain"`.
- **Kết quả**: Video ngang sẽ hiển thị đầy đủ ở giữa màn hình dọc, chừa khoảng trống đen ở trên và dưới (Letterboxing).
- **Mục đích**: Tránh việc AI tự động crop (phóng to) làm mất nội dung hai bên của video gốc.

## 2. Cách ghi đè (Override) trong script.json

Nếu bạn muốn thay đổi hành vi mặc định cho từng scene cụ thể, bạn có thể thêm các field `objectFit` và `backgroundColor` trực tiếp vào scene trong `script.json`.

### Các giá trị hỗ trợ:
- **`objectFit`**: 
    - `"cover"`: Phóng to cho đầy khung hình (có thể mất nội dung).
    - `"contain"`: Thu nhỏ để thấy toàn bộ nội dung (có thể có khoảng trống).
    - `"fill"`: Kéo giãn cho đầy khung hình (có thể làm méo hình).
- **`backgroundColor`**: Bất kỳ màu CSS nào (vd: `"#000000"`, `"rgba(255,255,255,0.5)"`).

### Ví dụ script.json:

```json
{
  "scenes": [
    {
      "id": "scene_1",
      "type": "video",
      "sourceVideoId": "vid_01",
      "objectFit": "cover",          // Ghi đè để phóng to đầy màn hình dọc
      "backgroundColor": "#1a1a1a"   // Chọn màu nền khác thay vì đen
    }
  ]
}
```

## 3. Prompt mẫu cho Agent (Claude)

Dưới đây là các câu lệnh bạn có thể dùng để yêu cầu Agent xử lý tỷ lệ khung hình:

### Yêu cầu hiển thị toàn bộ video ngang (Letterbox):
> "Dự án này là khổ dọc 9:16 nhưng video nguồn của tôi là ngang. Hãy cấu hình scene để hiển thị toàn bộ video ngang ở giữa, chừa đầu trên đầu dưới màu đen."

### Yêu cầu phóng to đầy màn hình (Crop/Zoom):
> "Trong scene id 'scene_1', dù là video ngang nhưng hãy phóng to nó để lấp đầy toàn bộ khung hình dọc (objectFit: cover)."

### Yêu cầu thay đổi màu nền:
> "Sửa scene 2 để video hiển thị dạng contain nhưng màu nền ở trên và dưới là màu xanh đậm (#000033) thay vì màu đen."
