# Hướng Dẫn Sử Dụng SFX (Sound Effects) Trong Remotion

Tài liệu này hướng dẫn cách thêm và quản lý hiệu ứng âm thanh (SFX) vào video timeline, đảm bảo âm thanh phát ra rõ ràng và đúng thời điểm.

## 1. Chuẩn Bị File Âm Thanh

### Vị Trí Lưu Trữ
Tất cả file SFX **BẮT BUỘC** phải được lưu trong thư mục `public/audio/` của dự án.

```bash
/public
  /audio
    whoosh.mp3
    click.mp3
    transition.mp3
    finish.mp3
```

### Định Dạng Hỗ Trợ
- **MP3** (.mp3) - Khuyến nghị (nhẹ, tương thích tốt)
- **WAV** (.wav) - Dùng khi cần chất lượng cực cao

## 2. Cấu Trúc Track Trong OTIO

Để quản lý tốt nhất, hãy tách SFX thành các Track riêng biệt, không gộp chung với Nhạc nền (Background Music) hay Lời thoại (Voice).

Khuyến nghị chia thành 2 track:
1.  **Transition SFX**: Chứa các âm thanh chuyển cảnh (whoosh, swish).
2.  **Component SFX**: Chứa các âm thanh cho hiệu ứng hình ảnh (pop, click, bling) khi Sticker hoặc Title xuất hiện.

## 3. Cách Thêm Clip SFX (JSON Schema)

Dưới đây là cấu trúc JSON chuẩn cho một clip SFX trong file `project.otio`.

### Quy Tắc Vàng (Golden Rules) ⚠️
1.  **Đường Dẫn Tuyệt Đối**: `target_url` PHẢI bắt đầu bằng `/audio/` (ví dụ: `/audio/whoosh.mp3`). KHÔNG dùng `public/audio/` hay `../../audio/`.
2.  **Âm Lượng Cao**: Luôn đặt `volume: "2.0"` (200%) hoặc cao hơn trong metadata để SFX nổi bật trên nền nhạc.
3.  **Định Vị Bằng Metadata**: 
    *   Dùng `metadata.globalTimelineStart` (tính bằng GIÂY) để đặt vị trí clip trên timeline.
    *   `source_range.start_time` PHẢI LUÔN LÀ `0.0` để file âm thanh phát từ đầu.

### Mẫu Code (Snippet)

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": { 
        "volume": "2.0",               // <-- 1. Tăng âm lượng
        "globalTimelineStart": "5.5"   // <-- 2. Vị trí trên timeline (Giây thứ 5.5)
    },
    "name": "SFX: Whoosh Transition",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { 
            "OTIO_SCHEMA": "RationalTime.1", 
            "rate": 30.0, 
            "value": 30.0      // Độ dài muốn phát (30 frames = 1 giây)
        },
        "start_time": { 
            "OTIO_SCHEMA": "RationalTime.1", 
            "rate": 30.0, 
            "value": 0.0       // <-- 3. LUÔN LÀ 0.0 (Để phát từ đầu file mp3)
        }
    },
    "effects": [], 
    "markers": [], 
    "enabled": true, 
    "color": null,
    "media_references": { 
        "DEFAULT_MEDIA": { 
            "OTIO_SCHEMA": "ExternalReference.1", 
            "metadata": {}, 
            "name": "", 
            "available_range": null, 
            "available_image_bounds": null, 
            "target_url": "/audio/whoosh.mp3"  // <-- 4. Dấu / ở đầu
        } 
    },
    "active_media_reference_key": "DEFAULT_MEDIA"
}
```

## 4. Cách Tính Thời Gian (Timing)

Với cấu trúc mới này, bạn không cần tính toán Frame phức tạp cho vị trí bắt đầu nữa, chỉ cần dùng số giây (Seconds).

*   Muốn SFX ở giây thứ 5.5? -> Set `"globalTimelineStart": "5.5"`
*   Muốn SFX ở phút 1:20 (80 giây)? -> Set `"globalTimelineStart": "80.0"`

Lưu ý: `source_range.duration` vẫn tính bằng Frames (ví dụ `value: 30.0` cho 1 giây).

## 5. Thư Viện SFX Có Sẵn (Built-in)

Các file này đã có sẵn trong `public/audio/`:

| Tên File | Mô Tả | Sử Dụng Khi Nào |
| :--- | :--- | :--- |
| `/audio/whoosh.mp3` | Tiếng gió vút mạnh | Chuyển cảnh nhanh, Title bay vào |
| `/audio/whoosh1.mp3` | Tiếng gió nhẹ, ngắn | Chuyển cảnh subtle (nhẹ nhàng) |
| `/audio/whoosh2.mp3` | Tiếng gió dài, trầm | Chuyển cảnh dramatic (kịch tính) |
| `/audio/click.mp3` | Tiếng click chuột | Sticker xuất hiện, Button press |
| `/audio/bling1.mp3` | Tiếng chuông leng keng | Hiệu ứng lấp lánh, Success, Coin |
| `/audio/transition.mp3` | Âm thanh chuyển cảnh chuẩn | Intro, chuyển đoạn lớn |
| `/audio/finish.mp3` | Âm thanh kết thúc | Kết thúc video, Logo hiện ra |

## 6. Code Python Mẫu (Cho Developer)

Nếu bạn đang viết script Python để tạo OTIO:

```python
import opentimelineio as otio

def create_sfx_clip(name, filename, start_metrics_seconds, duration_frame=30):
    return otio.schema.Clip(
        name=name,
        metadata={
            "volume": "2.0",
            "globalTimelineStart": str(start_metrics_seconds) # Set position in Seconds
        },
        media_reference=otio.schema.ExternalReference(
            target_url=f"/audio/{filename}" # Absolute path
        ),
        source_range=otio.opentime.TimeRange(
            # Always start from 0.0 of the media file
            start_time=otio.opentime.RationalTime(0.0, 30),
            duration=otio.opentime.RationalTime(duration_frame, 30)
        )
    )

# Sử dụng
track = otio.schema.Track(name="Transition SFX", kind="Audio")
# Thêm SFX tại giây thứ 5.0
track.append(create_sfx_clip("SFX: Trans 1", "whoosh.mp3", 5.0))
```
