# Test Instructions

## Để test tính năng Media Layers:

1. **Start cả 2 servers** (Dev + API):
   ```bash
   cd script-planner
   npm run dev:all
   ```
   
   Hoặc start riêng lẻ:
   ```bash
   # Terminal 1: Dev server (port 3002)
   npm run dev
   
   # Terminal 2: API server (port 3003)
   npm run server
   ```

2. **Mở browser**: http://localhost:3002/?project=sinh-vien-2026-tiet-kiem

3. **Kiểm tra Console** (F12 → Console tab):
   - Nếu có lỗi, copy toàn bộ error message
   - Tìm dòng `[SceneEditor] Rendered with sections:` để xác nhận component đã load

4. **Test chức năng**:
   - Click vào preview box của bất kỳ scene nào
   - Modal sẽ mở ra
   - Thử add/remove media
   - Thử drag & drop để sắp xếp

## Nếu trang không load:

1. **Check network tab** (F12 → Network):
   - Xem request nào failed
   - Status code là gì?

2. **Check console errors**:
   - Copy toàn bộ error stack trace
   - Chú ý dòng nào có file name và line number

3. **Try hard refresh**:
   - Windows: Ctrl + F5
   - Mac: Cmd + Shift + R

## Common Issues:

### Issue: Trang trắng
- **Cause**: JavaScript error
- **Fix**: Check console for error message

### Issue: Modal không mở
- **Cause**: Event handler không được gọi
- **Fix**: Check console log `[SceneEditor] Opening modal for scene:`

### Issue: Upload không hoạt động
- **Cause**: Server API không response
- **Fix**: Check network tab, xem `/api/upload` request

## Rollback nếu cần:

Nếu muốn quay lại version cũ (không có modal):

```bash
git checkout HEAD~1 script-planner/src/components/SceneEditor.tsx
git checkout HEAD~1 script-planner/src/App.tsx
```
