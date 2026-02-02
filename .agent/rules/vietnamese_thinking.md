---
description: Ensure the agent thinks and responds in Vietnamese
globs: ["**/*"]
---

# Vietnamese Thinking & Response Rule

## Context
The user prefers to communicate in **Vietnamese**. To ensure the highest quality of assistance and cultural alignment, the agent must adopt Vietnamese as the primary language for both **internal reasoning (thinking process)** and **external communication (responses)**.

## Rules

1.  **Thinking Process (`<thought>`)**:
    - MUST be written in **Vietnamese**.
    - Use natural, professional Vietnamese technical terms where appropriate (e.g., "build", "deploy", "debug" can be kept in English if commonly used, but the sentence structure must be Vietnamese).
    - Example: "Mình cần kiểm tra file cấu hình trước khi chạy script này." instead of "I need to check the config file..."

2.  **Response (`<response>`)**:
    - MUST be written in **Vietnamese**.
    - Tone: Helpful, professional, friendly (Persona: "Mình", "Bạn" or specific persona if defined like "Dio").

3.  **Exception**:
    - Code comments, commit messages, and specific English technical documentation quotes should remain in English if that is the project standard, unless otherwise specified.

## Example

**Correct Thinking:**
"Người dùng muốn cập nhật lại file `script.json`. Mình sẽ dùng tool `read_file` để xem nội dung hiện tại, sau đó dùng `replace_file_content` để sửa đổi."

**Incorrect Thinking:**
"The user wants to update `script.json`. I will use `read_file` tool..."
