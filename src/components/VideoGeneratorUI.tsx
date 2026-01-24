import React, { useState } from 'react';
import { AbsoluteFill } from 'remotion';

/**
 * UI Component for generating video in Remotion Studio
 * This allows users to input text and trigger video generation
 */

interface VideoGeneratorUIProps {
  onGenerate?: (text: string) => void;
}

export const VideoGeneratorUI: React.FC<VideoGeneratorUIProps> = ({ onGenerate }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const sampleTexts = [
    'Trí tuệ nhân tạo đang thay đổi cuộc sống chúng ta từng ngày. Từ những trợ lý ảo thông minh đến xe tự lái, AI đang ở khắp mọi nơi.',
    'Khám phá vẻ đẹp thiên nhiên Việt Nam. Từ vịnh Hạ Long hùng vĩ đến đồng bằng sông Cửu Long xanh tươi.',
    'Công nghệ blockchain đang tạo ra cuộc cách mạng trong tài chính. Cryptocurrency mở ra cơ hội đầu tư mới cho mọi người.',
  ];

  const handleGenerate = async () => {
    if (!text.trim()) {
      setMessage('❌ Vui lòng nhập nội dung!');
      setStatus('error');
      return;
    }

    // Copy text to clipboard for easy CLI usage
    try {
      await navigator.clipboard.writeText(text);
      setStatus('idle');
      setMessage(`✅ Đã copy text vào clipboard!\n\n📋 Bước tiếp theo:\n\n1. Mở Terminal\n2. Chạy lệnh:\n   node test-generate.js "${text.substring(0, 50)}..."\n\nHoặc paste text đã copy vào CLI:\n   node test-generate.js "PASTE_HERE"\n\n⚠️ Lưu ý: Không thể generate trực tiếp trong browser vì lý do bảo mật API keys.\nDùng CLI để generate an toàn!`);
    } catch (err) {
      setStatus('error');
      setMessage(`⚠️ Không thể generate trong browser!\n\n📋 Copy text này và chạy CLI:\n\n${text}\n\n💻 Lệnh Terminal:\nnode test-generate.js "YOUR_TEXT_HERE"\n\n🔒 Lý do: OpenAI API không cho phép chạy trong browser để bảo vệ API keys của bạn.`);
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a', overflow: 'auto' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 40px',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
          🎬 Auto Video Generator
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '50px', fontSize: '18px' }}>
          Nhập nội dung voice-over để tạo video tự động
        </p>

        {/* Input Area */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
            📝 Nội dung video (30-120 từ cho video 1 phút):
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung voice-over của bạn ở đây..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              fontSize: '18px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: '2px solid #444',
              borderRadius: '12px',
              resize: 'vertical',
              lineHeight: '1.6',
            }}
          />
          <div style={{ marginTop: '12px', fontSize: '16px', color: '#888' }}>
            {text.split(' ').filter(w => w.length > 0).length} từ (~{Math.ceil(text.split(' ').filter(w => w.length > 0).length * 0.4)}s)
          </div>
        </div>

        {/* Sample Texts */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
            💡 Hoặc dùng mẫu có sẵn:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {sampleTexts.map((sample, i) => (
              <button
                key={i}
                onClick={() => setText(sample)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Mẫu {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          📋 Copy Text & Hướng Dẫn CLI
        </button>

        {/* Status Message */}
        {message && (
          <div
            style={{
              padding: '20px',
              backgroundColor: status === 'error' ? '#ff4444' : status === 'success' ? '#00aa00' : '#ffaa00',
              borderRadius: '12px',
              marginBottom: '30px',
              fontSize: '16px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
            }}
          >
            {message}
          </div>
        )}

        {/* Instructions */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>📋 Hướng dẫn:</h3>
          <ol style={{ marginLeft: '20px', paddingLeft: 0 }}>
            <li>Nhập hoặc chọn text mẫu</li>
            <li>Click "Generate Video"</li>
            <li>Đợi hệ thống xử lý:
              <ul style={{ marginTop: '8px', color: '#888' }}>
                <li>🎙️ TTS: Tạo voice-over (ElevenLabs)</li>
                <li>🤖 AI: Phân tích nội dung (OpenAI)</li>
                <li>🖼️ Search: Tìm hình ảnh (Unsplash/Pexels/Pixabay)</li>
                <li>📝 STT: Tạo caption timestamps (Deepgram)</li>
              </ul>
            </li>
            <li>Preview và render video trong Remotion Studio</li>
          </ol>

          <p style={{ marginTop: '16px', color: '#888', fontSize: '12px' }}>
            ⚠️ Cần API keys trong .env file. Xem .env.example để biết cách cấu hình.
          </p>
        </div>

        {/* Quick Copy Command */}
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#222', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888' }}>
            💻 Hoặc dùng CLI (copy text và chạy):
          </p>
          <code
            style={{
              display: 'block',
              padding: '12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              fontSize: '12px',
              overflowX: 'auto',
              color: '#0f0',
            }}
          >
            node test-generate.js
          </code>
        </div>
      </div>
    </AbsoluteFill>
  );
};
