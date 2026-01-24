import opentimelineio as otio

# 1. Tạo một Timeline (Giống như tạo App component root trong Vue/React)
# Đây là container chứa toàn bộ nội dung video.
timeline = otio.schema.Timeline(name="My First Demo Video")

# 2. Tạo một Track (Giống như một Component con chứa danh sách các Items)
# Track là nơi chứa các clip video/audio chạy tuần tự.
track = otio.schema.Track(name="Main Video Track", kind=otio.schema.TrackKind.Video)

# 3. Tạo các Clip (Giống như các Element con hoặc Component nhỏ nhất)
# Clip 1: Intro
clip1 = otio.schema.Clip(
    name="Intro Clip",
    media_reference=otio.schema.ExternalReference(
        target_url="/assets/intro.mp4" # Đường dẫn đến file video thực tế
    ),
    # Source range: cắt lấy đoạn nào của video gốc (giống việc slice mảng)
    # Start: 0, Duration: 120 frames (giả sử 30fps -> 4 giây)
    source_range=otio.opentime.TimeRange(
        start_time=otio.opentime.RationalTime(0, 24),
        duration=otio.opentime.RationalTime(48, 24) # 2 giây tại 24fps
    )
)

# Clip 2: Content chính
clip2 = otio.schema.Clip(
    name="Main Content",
    media_reference=otio.schema.ExternalReference(
        target_url="/assets/content.mp4"
    ),
    source_range=otio.opentime.TimeRange(
        start_time=otio.opentime.RationalTime(0, 24),
        duration=otio.opentime.RationalTime(96, 24) # 4 giây tại 24fps
    )
)

# 4. "Mount" clips vào Track (Append vào mảng children)
track.append(clip1)
track.append(clip2)

# 5. "Mount" Track vào Timeline
timeline.tracks.append(track)

# 6. Xuất ra file JSON (OTIO format)
# File này chứa toàn bộ metadata cấu trúc video, Remotion có thể đọc nó để render.
output_file = "my_timeline.otio"
otio.adapters.write_to_file(timeline, output_file)

print(f"✅ Đã tạo xong file kịch bản: {output_file}")
print(f"Tên Timeline: {timeline.name}")
print(f"Tổng số track: {len(timeline.tracks)}")
print(f"Tổng số clip trong track chính: {len(track)}")
