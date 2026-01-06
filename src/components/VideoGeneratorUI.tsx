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
      setMessage('Vui lòng nhập nội dung!');
      return;
    }

    setStatus('generating');
    setMessage('Đang generate video... Vui lòng đợi!');

    try {
      // Call the generation function
      if (onGenerate) {
        await onGenerate(text);
        setStatus('success');
        setMessage('✅ Generate thành công! Kiểm tra console để xem kết quả.');
      } else {
        setMessage('⚠️ Chức năng generate chưa được kết nối. Vui lòng copy text và chạy CLI.');
        setStatus('idle');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Lỗi: ${error.message}`);
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 20px',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '10px', textAlign: 'center' }}>
          🎬 Auto Video Generator
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '40px' }}>
          Nhập nội dung voice-over để tạo video tự động
        </p>

        {/* Input Area */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            📝 Nội dung video (30-120 từ cho video 1 phút):
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung voice-over của bạn ở đây..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '8px',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
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
          disabled={status === 'generating'}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: status === 'generating' ? '#555' : '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: status === 'generating' ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
          }}
        >
          {status === 'generating' ? '⏳ Đang xử lý...' : '🚀 Generate Video'}
        </button>

        {/* Status Message */}
        {message && (
          <div
            style={{
              padding: '16px',
              backgroundColor: status === 'error' ? '#ff4444' : status === 'success' ? '#00aa00' : '#333',
              borderRadius: '8px',
              marginBottom: '20px',
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
