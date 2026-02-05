# Media Layers Feature

## Tổng quan

Tính năng Media Layers cho phép bạn thêm nhiều hình ảnh và video vào một scene, với khả năng xếp chồng (layer stacking) để tạo hiệu ứng phức tạp hơn.

## Hiệu ứng Card Stack (Xếp Bài Tây)

Khi có nhiều layers được chọn, preview sẽ hiển thị các media xếp chồng lên nhau như bài tây:
- Các layer lệch nhau theo đường chéo (offset right + down)
- Mỗi layer nhỏ dần một chút để tạo chiều sâu
- Border trắng và shadow tăng dần
- Badge gradient hiển thị số lượng layers
- Tối đa 5 layers hiển thị trong preview

## Cách sử dụng

### 1. Mở Modal Media Layers

- Click vào preview box của bất kỳ scene nào
- Modal sẽ hiển thị với 2 panel:
  - **Bên trái**: Selected Layers (các layer đã chọn, xếp chồng)
  - **Bên phải**: Available Media (tất cả media có sẵn)

### 2. Thêm Media vào Layers

- Click vào bất kỳ media nào ở panel "Available Media" để thêm vào layers
- Media sẽ xuất hiện ở panel "Selected Layers"
- Click lại để bỏ chọn

### 3. Sắp xếp Layer Order

- Drag & drop các layer trong panel "Selected Layers" để thay đổi thứ tự
- Layer ở trên cùng (số cao nhất) sẽ hiển thị trên cùng
- Ví dụ: Layer 3 sẽ nằm trên Layer 2 và Layer 1

### 4. Upload Media Mới

**Cách 1: Click nút Upload**
- Click nút "Upload New" trong modal
- Chọn file image hoặc video từ máy tính
- File sẽ được upload và tự động thêm vào danh sách

**Cách 2: Drag & Drop** ⭐ NEW
- Kéo file từ máy tính vào modal
- Overlay sẽ hiển thị khi đang drag
- Thả file để upload
- Chỉ chấp nhận images và videos

### 5. Xóa Layer

- Click icon delete (🗑️) bên cạnh layer để xóa

### 6. Preview

- Ở scene editor, nếu có nhiều layer được chọn:
  - Preview sẽ hiển thị tất cả layers xếp chồng như bài tây
  - Mỗi layer lệch xuống phải một chút (offset 25px)
  - Border trắng và shadow tăng dần
  - Tối đa hiển thị tất cả layers đã chọn
- Nếu chỉ có 1 media, hiển thị bình thường như trước

### 7. Validation

- ⚠️ **Bắt buộc chọn ít nhất 1 media**
  - Nút "Done" sẽ bị disable (màu xám) nếu chưa chọn media nào
  - Warning badge hiển thị ở footer khi chưa chọn
  - Alert hiển thị nếu cố gắng đóng modal mà chưa chọn
  - Confirm dialog khi click X hoặc click outside mà chưa chọn

## Cấu trúc dữ liệu

Dữ liệu được lưu trong `script.json`:

```json
{
  "sections": [
    {
      "scenes": [
        {
          "id": "scene-1",
          "selectedResourceIds": ["resource-1", "resource-2", "resource-3"],
          "selectedResourceId": "resource-1",
          "resourceCandidates": [...]
        }
      ]
    }
  ]
}
```

- `selectedResourceIds`: Array chứa IDs của các media được chọn, theo thứ tự layer (index 0 = bottom, cuối = top)
- `selectedResourceId`: ID của media đầu tiên (để tương thích ngược)

## Technical Details

### Components

1. **MediaLayerModal.tsx**: Modal component chính
   - Quản lý state của layers
   - Drag & drop để sắp xếp
   - Upload file mới
   - Grid view cho available media

2. **SceneEditor.tsx**: Đã được cập nhật
   - Click vào preview box mở modal
   - Hiển thị layer stacking trong preview
   - Badge hiển thị số lượng layers

### Features

- ✅ Multi-select media
- ✅ Drag & drop reordering (trong modal)
- ✅ Drag & drop upload (kéo file vào modal) ⭐ NEW
- ✅ Card stack preview (như xếp bài tây)
- ✅ Diagonal offset effect (lệch xuống phải)
- ✅ Upload new media from modal (click hoặc drag & drop)
- ✅ Validation: Bắt buộc chọn ít nhất 1 media ⭐ NEW
- ✅ Visual feedback (warning badges, disabled states, alerts)
- ✅ Responsive design
- ✅ Backward compatible (single media vẫn hoạt động như cũ)

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅

## Notes

- Layers được render theo thứ tự z-index
- Video layers sẽ không tự động play trong preview (để tránh performance issues)
- Có thể mix cả images và videos trong cùng một scene
