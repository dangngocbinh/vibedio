import OpenAI from 'openai';
import { config } from '../../utils/config';
import { SceneAnalysis, Scene, ImageSearchResult, AnimationType } from '../../types';

export class ContentAnalyzer {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || config.openai.apiKey;
    if (!key) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = new OpenAI({ apiKey: key });
  }

  async analyzeContent(text: string, audioDuration: number): Promise<SceneAnalysis> {
    const prompt = `Phân tích văn bản sau và chia thành các cảnh (scenes) để tạo video:

Văn bản: "${text}"

Yêu cầu:
1. Chia văn bản thành 3-7 cảnh logic
2. Mỗi cảnh có thời lượng từ 3-10 giây
3. Trích xuất keywords chính để tìm hình ảnh
4. Đề xuất animation phù hợp (zoom-in, zoom-out, pan-left, pan-right, ken-burns)
5. Tạo query tìm kiếm hình ảnh cho mỗi cảnh
6. Xác định tone của video (professional/casual/energetic/calm)

Tổng thời lượng video: ${audioDuration} giây

Trả về JSON format:
{
  "tone": "professional|casual|energetic|calm",
  "keywords": ["keyword1", "keyword2", ...],
  "scenes": [
    {
      "text": "đoạn văn bản của cảnh",
      "keywords": ["keyword1", "keyword2"],
      "startTime": 0,
      "endTime": 5,
      "imageQuery": "query để tìm hình ảnh phù hợp",
      "suggestedAnimation": {
        "type": "zoom-in",
        "duration": 5,
        "intensity": 0.3
      }
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia phân tích nội dung video. Trả về JSON hợp lệ.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        tone: result.tone || 'casual',
        keywords: result.keywords || [],
        scenes: result.scenes || [],
        duration: audioDuration,
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      // Fallback: create simple scene structure
      return this.createFallbackScenes(text, audioDuration);
    }
  }

  async selectBestImage(
    imageResults: ImageSearchResult[],
    sceneContext: { text: string; keywords: string[] }
  ): Promise<ImageSearchResult | null> {
    if (imageResults.length === 0) return null;

    const prompt = `Chọn hình ảnh phù hợp nhất cho cảnh video:

Nội dung cảnh: "${sceneContext.text}"
Keywords: ${sceneContext.keywords.join(', ')}

Danh sách hình ảnh (index):
${imageResults.map((img, i) => `${i}. Nguồn: ${img.source}, Photographer: ${img.photographer}`).join('\n')}

Hãy chọn 1 hình ảnh phù hợp nhất (trả về số index từ 0 đến ${imageResults.length - 1}).
Chỉ trả về 1 số, không giải thích.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia lựa chọn hình ảnh cho video. Chỉ trả về số index.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const selectedIndex = parseInt(response.choices[0].message.content?.trim() || '0');
      const validIndex = Math.max(0, Math.min(selectedIndex, imageResults.length - 1));

      return imageResults[validIndex];
    } catch (error) {
      console.error('Error selecting best image:', error);
      // Fallback: return first image
      return imageResults[0];
    }
  }

  private createFallbackScenes(text: string, duration: number): SceneAnalysis {
    // Simple fallback: split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const sceneDuration = duration / sentences.length;

    const scenes: Scene[] = sentences.map((sentence, index) => ({
      text: sentence.trim(),
      keywords: this.extractSimpleKeywords(sentence),
      startTime: index * sceneDuration,
      endTime: (index + 1) * sceneDuration,
      imageQuery: sentence.trim().slice(0, 50),
      suggestedAnimation: this.getRandomAnimation(sceneDuration),
    }));

    return {
      tone: 'casual',
      keywords: this.extractSimpleKeywords(text),
      scenes,
      duration,
    };
  }

  private extractSimpleKeywords(text: string): string[] {
    // Simple keyword extraction (remove common words)
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'của', 'và', 'là', 'có', 'được', 'trong', 'với', 'để', 'cho',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }

  private getRandomAnimation(duration: number): AnimationType {
    const types: AnimationType['type'][] = [
      'zoom-in',
      'zoom-out',
      'pan-left',
      'pan-right',
      'ken-burns',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      type: randomType,
      duration,
      intensity: 0.2 + Math.random() * 0.3, // 0.2 to 0.5
    };
  }
}

export const contentAnalyzer = new ContentAnalyzer();
