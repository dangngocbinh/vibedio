# Sticker Component Usage Guide

Thành phần `Sticker` cho phép bạn thêm các hình ảnh biểu cảm, meme, hoặc sticker chuyển động (Lottie) lên trên video với nhiều hiệu ứng xuất hiện sinh động.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `template` | `string` | - | Tên mẫu sticker (xem danh sách bên dưới). |
| `src` | `string` | - | URL hoặc đường dẫn local (ghi đè template nếu cả hai đều có). |
| `style` | `string` | `'random'` | Position style: `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `random`, `custom`. |
| `animation` | `string` | `'pop'` | Animation type: `pop`, `fade`, `shake`, `rotate`, `slide-up`, `slide-down`, `elastic`. |
| `width` | `number` | `300` | Chiều rộng sticker (pixels). |
| `height` | `number` | `auto` | Chiều cao sticker (auto để giữ tỉ lệ). |
| `top`, `left`, `right`, `bottom` | `string`/`number` | - | Tọa độ tùy chỉnh (dùng khi `style='custom'`). |
| `rotation` | `number` | `0` | Góc xoay tĩnh (độ). |
| `scale` | `number` | `1` | Tỉ lệ phóng to/thu nhỏ gốc. |
| `enterDuration` | `number` | `15` | Thời gian animation vào (frames). |
| `exitDuration` | `number` | `10` | Thời gian animation ra (frames). |

## Sticker Templates Catalog

Sử dụng prop `template` với các giá trị mã dưới đây:

### ✨ Animated Lottie Stickers (Premium)
Các sticker chuyển động mượt mà sử dụng công nghệ Lottie (60+ mẫu):

`lottie-heart-eyes`, `lottie-laughing`, `lottie-party`, `lottie-rocket`, `lottie-fire`, `lottie-stars`, `lottie-thinking`, `lottie-mind-blown`, `lottie-sweat`, `lottie-cool`, `lottie-cry`, `lottie-angry`, `lottie-hug`, `lottie-sleep`, `lottie-wink`, `lottie-kiss`, `lottie-fear`, `lottie-shush`, `lottie-drool`, `lottie-money`, `lottie-nerd`, `lottie-ghost`, `lottie-alien`, `lottie-robot`, `lottie-cat`, `lottie-dog`, `lottie-unicorn`, `lottie-target`, `lottie-bulb`, `lottie-medal`, `lottie-trophy`, `lottie-clapper`, `lottie-controller`, `lottie-pizza`, `lottie-burger`, `lottie-coffee`, `lottie-cake`, `lottie-balloon`, `lottie-gift`, `lottie-sun`, `lottie-moon`, `lottie-rainbow`, `lottie-sparkles`, `lottie-check`, `lottie-cross`, `lottie-warning`, `lottie-hundred`, `lottie-thumbs-up`, `lottie-thumbs-down`, `lottie-clap`, `lottie-peace`, `lottie-ok`, `lottie-muscle`, `lottie-wave`, `lottie-pray`, `lottie-heart-red`, `lottie-heart-broken`, `lottie-heart-blue`, `lottie-crown`, `lottie-gem`, `lottie-diamond`

### 😊 Faces & Emotions (Static)
`face-heart-eyes`, `face-laughing`, `face-wow`, `face-crying`, `face-angry`, `face-cool`, `face-thinking`, `face-mind-blown`, `face-partying`, `face-sweating`, `face-clown`, `face-scared`, `face-sleepy`, `face-zipper`, `face-nerd`, `face-mask`, `face-shush`, `face-drool`, `face-lying`, `face-vomit`, `face-money`, `skull`, `zombie`, `face-devil`, `face-ghost`

### ❤️ Hearts & Love (Static)
`heart-red`, `heart-broken`, `heart-fire`, `heart-sparkle`, `heart-blue`, `sparkling-heart`

### 🔥 Social & Interaction (Static)
`like-thumb`, `dislike-thumb`, `clap`, `fire`, `hundred`, `check-mark`, `warning`, `money-bag`, `rocket`, `trophy`, `gold-cup`, `target`, `bulb`, `megaphone`, `money-wings`, `bomb`, `poop`, `gem-stone`, `diamond`

### 🌿 Nature & Elements (Static)
`sun`, `moon`, `cloud-rain`, `lightning`, `rainbow`, `sparkles`, `flower-cherry`, `tree-palm`, `potted-plant`

### 🍕 Celebration & Food (Static)
`pizza`, `burger`, `coffee`, `beer`, `cake`, `confetti-ball`, `balloon`, `gift`

### ✌️ Hands & Gestures (Static)
`hand-peace`, `hand-rock`, `hand-ok`, `hand-muscle`, `hand-wave`, `hand-pray`, `hand-pointed-up`, `hand-fist`

### 🦄 Animals & Avatars (Static)
`cat-smile`, `dog-face`, `unicorn`, `monkey-no-see`, `monkey-no-hear`, `monkey-no-speak`, `lucky-cat`, `alien`, `robot`

### 🏆 Activities & Sports (Static)
`gold-cup`, `soccer-ball`, `basketball`, `video-game`, `microphone`, `painting`, `movie-clapper`

### ⚙️ Symbols & Objects (Static)
`target`, `bulb`, `magnifier`, `controller`, `megaphone`, `medal-gold`

## Animations Library

### 1. `pop` (Default)
Phóng to từ 0 lên 1 với hiệu ứng nảy nhẹ. Rất hợp cho emoji và reaction.

### 2. `elastic`
Tương tự pop nhưng hiệu ứng nảy (elastic) mạnh hơn, tràn đầy năng lượng.

### 3. `shake`
Xoay qua lại nhanh để tạo hiệu ứng rung. Dùng cho meme "shock" hoặc "angry".

### 4. `rotate`
Xoay tròn để xuất hiện. Hợp với các huy hiệu (badges).

### 5. `slide-up` / `slide-down`
Trượt lên từ dưới hoặc trượt xuống từ trên.

### 6. `fade`
Hiện mờ dần (opacity).

## OTIO Usage Examples

### 1. Dùng Sticker Lottie mượt mà
Chỉ cần gọi mã template có tiền tố `lottie-`.

```json
{
    "remotion_component": "Sticker",
    "props": {
        "template": "lottie-rocket",
        "style": "center",
        "animation": "pop",
        "width": 300
    }
}
```

### 2. Branding Logo (Top Right)
Giữ logo luôn xuất hiện ở góc video.

```json
{
    "remotion_component": "Sticker",
    "props": {
        "src": "https://example.com/logo.png",
        "style": "top-right",
        "animation": "fade",
        "width": 100
    }
}
```

## Tips
- **Giao diện Preview**: Bạn có thể xem toàn bộ thư viện trực quan trong Remotion Studio qua Composition `Sticker-Gallery`.
- **Shadow**: Mọi sticker đều có hiệu ứng đổ bóng mặc định để không bị chìm vào video.
- **Z-Index**: Sticker nằm ở layer Title, hiển thị phía sau phụ đề nhưng phía trước video chính.
