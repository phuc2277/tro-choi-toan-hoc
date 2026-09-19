import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import * as pdfParsePkg from 'pdf-parse';

const pdfParse: (dataBuffer: Buffer, options?: any) => Promise<{ text: string; numpages: number; info: any }> =
  (pdfParsePkg as any).default || pdfParsePkg;

// Wrap raw 16-bit PCM audio (as returned by Gemini TTS models) into a playable WAV file buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

dotenv.config();

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient AI generation with automatic model fallback & retry for 503 / high demand spikes
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
    fallbackModels?: string[];
  }
) {
  // Use approved non-deprecated Gemini models in order of capability & availability
  const defaultPreferred = 'gemini-3.8-flash';
  // gemini-3.1-flash-lite has huge capacity and operates on a different cluster, perfect when 3.8-flash has a 503 spike
  const defaultFallbacks = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];

  const candidateModels = [
    params.preferredModel && params.preferredModel !== 'gemini-3.7-flash'
      ? params.preferredModel
      : defaultPreferred,
    ...(params.fallbackModels || defaultFallbacks),
  ];

  // Deduplicate candidate models while preserving order
  const models = Array.from(new Set(candidateModels));

  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    // For 503 (high demand spikes), don't hammer the same busy model twice — jump directly to fallback model
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const is503 =
          err?.status === 503 ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('overloaded');
        const is429 =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('Resource has been exhausted') ||
          errMsg.includes('quota');

        if (is503) {
          console.log(`[Gemini API] Model ${model} is currently experiencing high demand (503). Smoothly switching to alternative model...`);
          // Break immediately out of attempt loop to try next model in candidate list
          break;
        }

        if (is429) {
          console.log(`[Gemini API] Model ${model} reached rate limit (429).`);
          if (attempt === 0) {
            const backoffMs = 1200 + Math.floor(Math.random() * 500);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
          break;
        }

        console.log(`[Gemini API] Request on ${model} (attempt ${attempt + 1}): ${errMsg.slice(0, 150)}`);
        break;
      }
    }

    if (i < models.length - 1) {
      const nextModel = models[i + 1];
      console.log(`[Gemini API] Routing request to fallback model: ${nextModel}...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Format error politely if all models failed
  const finalMsg = lastError?.message || 'Lỗi kết nối Gemini AI';
  if (finalMsg.includes('503') || finalMsg.includes('high demand') || finalMsg.includes('UNAVAILABLE')) {
    throw new Error(
      'Hệ thống AI đang có lượng truy cập cao đột biến (503). Vui lòng thử lại sau vài giây.'
    );
  } else if (finalMsg.includes('429') || finalMsg.includes('quota') || finalMsg.includes('Resource has been exhausted')) {
    throw new Error('Đã đạt giới hạn yêu cầu tạm thời (429). Vui lòng đợi 3 - 5 giây và thử lại.');
  }

  throw lastError;
}

export async function createApp() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. AI Chatbot with Google Search Grounding for Math & Pedagogy
  app.post('/api/ai/chatbot', async (req, res) => {
    try {
      const { message, history = [], useSearch = true, grade = 'THCS' } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ai = getGenAI();
      const systemInstruction = `Bạn là Trợ lý AI Giáo viên Toán THCS thông minh, tận tâm và thân thiện.
Nhiệm vụ của bạn:
1. Giải đáp thắc mắc môn Toán THCS (Lớp 6, 7, 8, 9 theo chương trình GDPT 2018).
2. Khi viết công thức toán học, hãy định dạng chuẩn và rõ ràng:
   - Dùng dạng LaTeX hoặc ký hiệu toán học như: $x^2 + 2x + 1 = 0$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\Delta = b^2 - 4ac$, v.v.
3. Hướng dẫn từng bước giải chi tiết, gợi ý phương pháp tư duy cho học sinh thay vì chỉ đưa ra đáp số.
4. Bạn có thể sử dụng công cụ Google Search để cập nhật thông tin chuẩn xác nhất về kiến thức, lịch sử toán học, ứng dụng thực tế.`;

      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content || item.text || '' }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const reply = response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này vào lúc này.';
      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const webSources = searchChunks
        ?.map((chunk: any) => ({
          title: chunk.web?.title,
          url: chunk.web?.uri,
        }))
        .filter((s: any) => s.title && s.url);

      res.json({
        reply,
        sources: webSources || [],
      });
    } catch (error: any) {
      console.error('Chatbot API Error:', error);
      res.status(500).json({
        error: error.message || 'Lỗi xử lý phản hồi từ Gemini AI',
      });
    }
  });

  // 2. AI Question Bank Generator with Math Schema & Diagrams
  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const { topic, grade = '8', count = 5, difficulty = 'Vận dụng' } = req.body;
      const ai = getGenAI();

      const prompt = `Hãy tạo ${count} câu hỏi trắc nghiệm Toán THCS lớp ${grade} về chủ đề "${topic || 'Toán học tổng hợp'}".
Mức độ: ${difficulty}.
Yêu cầu:
- Mỗi câu hỏi có đúng 4 đáp án A, B, C, D và đúng 1 đáp án chính xác.
- Câu hỏi và đáp án phải trình bày công thức toán học chuẩn xác, không bị lỗi font hay cú pháp.
- Kèm lời giải thích chi tiết từng bước (explanation).
- Nếu phù hợp, có thể bổ sung dữ liệu bảng (tableData) hoặc cấu hình hình vẽ SVG toán học (diagram).`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia thẩm định và ra đề thi môn Toán THCS hàng đầu Việt Nam.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: {
                  type: Type.STRING,
                  description: 'Nội dung câu hỏi với công thức toán chuẩn xác',
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: {
                        type: Type.STRING,
                        description: 'A, B, C, hoặc D',
                      },
                      text: {
                        type: Type.STRING,
                        description: 'Nội dung đáp án',
                      },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: 'Khóa đáp án đúng (A, B, C, hoặc D)',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Lời giải chi tiết từng bước',
                },
                difficulty: {
                  type: Type.STRING,
                  description: 'Nhận biết, Thông hiểu, Vận dụng, hoặc Vận dụng cao',
                },
                points: {
                  type: Type.NUMBER,
                  description: 'Điểm số của câu hỏi (thường là 10)',
                },
              },
              required: ['content', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
      });

      const text = response.text;
      const questions = text ? JSON.parse(text) : [];
      res.json({ questions });
    } catch (error: any) {
      console.error('Question Generation Error:', error);
      res.status(500).json({ error: error.message || 'Không thể tạo bộ câu hỏi lúc này' });
    }
  });

  // 3. Google Search Grounding for Math & Educational Facts
  app.post('/api/ai/search-grounding', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const ai = getGenAI();
      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: query,
        config: {
          systemInstruction: 'Tìm kiếm và cung cấp thông tin chính xác, cập nhật nhất về toán học giáo dục.',
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const webSources = searchChunks
        ?.map((chunk: any) => ({
          title: chunk.web?.title,
          url: chunk.web?.uri,
        }))
        .filter((s: any) => s.title && s.url);

      res.json({
        result: text,
        sources: webSources || [],
      });
    } catch (error: any) {
      console.error('Search Grounding Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tra cứu thông tin' });
    }
  });

  // 4. AI Music Generation
  app.post('/api/ai/generate-music', async (req, res) => {
    try {
      const { prompt = 'Upbeat energetic classroom game victory background music, cheerful synth and bells', durationSeconds = 30 } = req.body;
      const ai = getGenAI();

      try {
        // Try Lyria 3 Clip Preview
        const response = await ai.models.generateContentStream({
          model: 'lyria-3-clip-preview',
          contents: `Create a ${durationSeconds}-second educational game soundtrack: ${prompt}`,
        });

        let audioBase64 = '';
        let lyrics = '';
        let mimeType = 'audio/wav';

        for await (const chunk of response) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              if (!audioBase64 && part.inlineData.mimeType) {
                mimeType = part.inlineData.mimeType;
              }
              audioBase64 += part.inlineData.data;
            }
            if (part.text && !lyrics) {
              lyrics = part.text;
            }
          }
        }

        if (audioBase64) {
          return res.json({
            audioBase64,
            mimeType,
            lyrics,
            model: 'lyria-3-clip-preview',
            success: true,
          });
        }
      } catch (lyriaError: any) {
        console.log('[Lyria Music API] Standard synth synthesizer fallback activated:', lyriaError.message);
      }

      // Compose an AI musical sequence / notes descriptor for client-side Web Audio synthesizer
      const compResponse = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: `Hãy tạo một bản tổng phổ âm nhạc điện tử (Web Audio Synth Chords & Melody) cho trò chơi học tập với chủ đề "${prompt}".
Trả về JSON gồm:
- title: Tên bản nhạc
- tempo: Tốc độ BPM (ví dụ 128)
- scale: Điệu thức (ví dụ C_major, G_major, Pentatonic)
- melody: Mảng các nốt nhạc { note: 'C4', duration: 0.25, time: 0 }
- chords: Mảng hợp âm đệm { chord: ['C3', 'E3', 'G3'], duration: 1.0, time: 0 }
- mood: Cảm xúc (Vui tươi, Hào hứng, Hồi hộp, Chiến thắng)`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tempo: { type: Type.NUMBER },
              scale: { type: Type.STRING },
              mood: { type: Type.STRING },
              melody: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    note: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    time: { type: Type.NUMBER },
                  },
                  required: ['note', 'duration', 'time'],
                },
              },
              chords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    chord: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    duration: { type: Type.NUMBER },
                    time: { type: Type.NUMBER },
                  },
                  required: ['chord', 'duration', 'time'],
                },
              },
            },
            required: ['title', 'tempo', 'melody'],
          },
        },
      });

      const composition = compResponse.text ? JSON.parse(compResponse.text) : null;

      res.json({
        success: true,
        composition,
        model: 'gemini-3.8-flash-synth',
      });
    } catch (error: any) {
      console.error('Music Generation Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo âm nhạc AI' });
    }
  });

  // 5. Math Step-by-Step Explanation & Solver
  app.post('/api/ai/explain-math', async (req, res) => {
    try {
      const { question, answer, formula } = req.body;
      const ai = getGenAI();

      const prompt = `Hãy giải thích chi tiết từng bước câu hỏi toán học sau:
Câu hỏi: ${question}
Đáp án đúng: ${answer}
${formula ? `Công thức liên quan: ${formula}` : ''}

Yêu cầu:
1. Nêu rõ phương pháp giải và định lý/công thức áp dụng.
2. Trình bày các bước biến đổi chi tiết, định dạng rõ ràng các biểu thức toán học.
3. Chỉ ra lỗi sai phổ biến mà học sinh hay mắc phải.
4. Đưa ra mẹo nhớ nhanh hoặc bài học rút ra.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia sư phạm Toán THCS giảng dạy dễ hiểu, chuẩn mực và truyền cảm hứng.',
        },
      });

      res.json({
        explanation: response.text || 'Đã có lỗi khi tạo lời giải chi tiết.',
      });
    } catch (error: any) {
      console.error('Explain Math Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi giải thích toán học' });
    }
  });

  // 6. Document Text Extraction Endpoint (Support PDF, DOCX, DOC, TXT)
  app.post('/api/document/extract-text', async (req, res) => {
    try {
      const { fileBase64, fileName = 'document', mimeType = '' } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'Không tìm thấy dữ liệu tệp đính kèm' });
      }

      // Convert base64 data to buffer
      const base64Data = fileBase64.includes(';base64,')
        ? fileBase64.split(';base64,')[1]
        : fileBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      let extractedText = '';
      let pageCount: number | undefined = undefined;

      const lowerName = fileName.toLowerCase();
      const isPdf = mimeType.includes('pdf') || lowerName.endsWith('.pdf');
      const isDocx = mimeType.includes('word') || mimeType.includes('officedocument') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');
      const isText = mimeType.includes('text') || lowerName.endsWith('.txt') || lowerName.endsWith('.md');

      if (isPdf) {
        try {
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
          pageCount = pdfData.numpages;
        } catch (pdfErr: any) {
          console.log('[PDF Parser] Fallback to raw text decoding');
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
        }
      } else if (isDocx) {
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          extractedText = docxResult.value || '';
        } catch (docxErr: any) {
          console.log('[Mammoth Parser] Fallback to raw text decoding');
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
        }
      } else if (isText) {
        extractedText = buffer.toString('utf-8');
      } else {
        // Generic fallback: try docx then pdf then raw
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          extractedText = docxResult.value || '';
        } catch {
          try {
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || '';
            pageCount = pdfData.numpages;
          } catch {
            extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
          }
        }
      }

      // Clean up whitespace & normalize text
      const cleanedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      res.json({
        success: true,
        fileName,
        text: cleanedText,
        wordCount,
        pageCount,
      });
    } catch (err: any) {
      console.error('Document extraction error:', err);
      res.status(500).json({ error: err.message || 'Lỗi trích xuất nội dung tài liệu' });
    }
  });

  // 6b. Web URL Content Extractor Endpoint
  app.post('/api/document/extract-url', async (req, res) => {
    let cleanUrl = (req.body?.url || '').trim();
    if (!cleanUrl) {
      return res.status(400).json({ error: 'URL không hợp lệ' });
    }

    // Auto-prepend https:// if missing scheme
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let parsedHostname = '';
    try {
      const parsed = new URL(cleanUrl);
      parsedHostname = parsed.hostname.replace(/^www\./, '');
    } catch {
      return res.status(400).json({ error: 'Định dạng đường dẫn URL không hợp lệ' });
    }

    try {
      // Fetch web page with timeout and standard browser headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const html = await response.text();

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : `${parsedHostname} - Tài liệu`;

      // Clean HTML tags and scripts
      const cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      const extractedText = cleaned.slice(0, 25000); // Up to 25k chars
      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

      console.log(`[URL Extractor] Successfully extracted ${wordCount} words from: ${parsedHostname}`);

      return res.json({
        success: true,
        title: pageTitle,
        url: cleanUrl,
        text: extractedText || `Nội dung trích xuất từ ${cleanUrl}`,
        wordCount: Math.max(wordCount, 10),
      });
    } catch {
      // Graceful fallback: synthesize document context from URL or search grounding without failing
      console.log(`[URL Extractor] Direct fetch unavailable for ${parsedHostname}, generating educational reference outline...`);
      
      let fallbackText = '';
      let pageTitle = `${parsedHostname} - Tài liệu học tập trực tuyến`;

      // Attempt AI search grounding if Gemini API key exists
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = getGenAI();
          const searchRes = await generateContentWithFallback(ai, {
            preferredModel: 'gemini-3.1-flash-lite',
            contents: `Hãy tìm kiếm và tóm tắt kiến thức giáo dục từ liên kết: ${cleanUrl}. Nêu rõ chủ đề bài học, tóm tắt lý thuyết, công thức chính và các dạng bài tập liên quan.`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
          if (searchRes?.text) {
            fallbackText = searchRes.text.trim();
            pageTitle = `Tài liệu tham khảo: ${parsedHostname}`;
          }
        } catch {
          // Keep lightweight fallback text
        }
      }

      if (!fallbackText) {
        fallbackText = `Tài liệu tham khảo trực tuyến: ${cleanUrl} (${parsedHostname}). Nguồn học liệu bổ trợ môn học. Giáo viên có thể đính kèm trực tiếp tệp PDF/DOCX từ nguồn này để hệ thống trích xuất và phân tích toàn diện chuẩn GDPT 2018.`;
      }

      const wordCount = fallbackText.split(/\s+/).filter(Boolean).length;

      return res.json({
        success: true,
        title: pageTitle,
        url: cleanUrl,
        text: fallbackText,
        wordCount,
      });
    }
  });

  // 6c. AI Document Reading, Deep Analysis & Indexing (GDPT 2018 - Phase 2)
  app.post('/api/ai/analyze-document', async (req, res) => {
    try {
      const {
        documentId,
        sourceId = 'DOC_SOURCE',
        title = 'Tài liệu học tập',
        originalName = '',
        subject = 'Toán học',
        grade = 8,
        documentType = 'pdf',
        scope = 'shared',
        lessonId,
        lessonTitle,
        documentText = '',
        fileBase64,
        mimeType = '',
        pageCount: clientPageCount,
      } = req.body;

      let rawContent = (documentText || '').trim();
      let detectedPageCount = clientPageCount || 1;

      // If documentText is empty but fileBase64 is passed, extract text first
      if (!rawContent && fileBase64) {
        const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
        const buffer = Buffer.from(base64Data, 'base64');
        const isPdf = (mimeType && mimeType.includes('pdf')) || originalName.toLowerCase().endsWith('.pdf');
        const isDocx = (mimeType && (mimeType.includes('word') || mimeType.includes('officedocument'))) || originalName.toLowerCase().endsWith('.docx');

        if (isPdf) {
          try {
            const pdfData = await pdfParse(buffer);
            rawContent = pdfData.text || '';
            if (pdfData.numpages) detectedPageCount = pdfData.numpages;
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else if (isDocx) {
          try {
            const docxResult = await mammoth.extractRawText({ buffer });
            rawContent = docxResult.value || '';
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else {
          rawContent = buffer.toString('utf-8');
        }
      }

      if (!rawContent) {
        rawContent = `Tài liệu: ${title} (${originalName || 'Tệp đính kèm'}). Môn ${subject} Lớp ${grade}. Phạm vi: ${scope === 'shared' ? 'Kho tài liệu chung Môn/Lớp' : `Tài liệu riêng của bài: ${lessonTitle || lessonId}`}.`;
      }

      const truncatedText = rawContent.slice(0, 45000);
      const ai = getGenAI();

      const prompt = `Bạn là Trợ lý AI Phân tích & Lập chỉ mục Tài liệu Giáo dục THCS Việt Nam (Chuẩn GDPT 2018).
Hãy đọc kỹ toàn bộ nội dung tài liệu sau và phân tích cấu trúc một cách khoa học, chuẩn xác:

THÔNG TIN TÀI LIỆU:
- Tên tài liệu: "${title}"
- Tên gốc: "${originalName}"
- Môn học: ${subject}
- Khối lớp: ${grade}
- Định dạng: ${documentType}
- Phạm vi lưu trữ: ${scope === 'shared' ? 'KHO CHUNG TOÀN MÔN/LỚP (SGK, Giáo án cả năm, Phân phối chương trình)' : `KHO RIÊNG CỦA BÀI HỌC "${lessonTitle || lessonId}"`}
${lessonId ? `- Mã bài học liên kết: ${lessonId}` : ''}
- Số trang ước tính: ${detectedPageCount}

NỘI DUNG TÀI LIỆU TRÍCH XUẤT:
"""
${truncatedText}
"""

NGUYÊN TẮC PHÂN TÍCH & BẢO TOÀN KIẾN THỨC TOÁN HỌC / KHOA HỌC:
1. Xác định Chương (chapters) và Bài học (lessons):
   - Phân đoạn từng bài học với khoảng trang ước tính hợp lý (pageFrom -> pageTo) bám sát tổng số trang (${detectedPageCount}).
   - Nếu là tài liệu riêng của một bài (scope = "lesson"), toàn bộ nội dung tập trung vào bài đó.
   - Gán mức độ tin cậy (confidence từ 0.0 đến 1.0). Nếu không chắc chắn về số trang, đánh dấu needsReview = true.
2. Trích xuất Mục & Nội dung sư phạm (sections):
   - Phân loại rõ ràng: "definition" (Định nghĩa), "theorem" (Định lí/Tính chất), "formula" (Công thức), "example" (Ví dụ), "exercise" (Bài tập), "activity" (Khám phá), "general".
   - Tóm tắt nội dung cốt lõi của từng mục.
3. Bảo toàn Tuyệt đối Công thức Toán học (formulas):
   - Trình bày công thức ở định dạng LaTeX chuẩn: $x^2 + 2x + 1 = 0$, $\\frac{a}{b}$, $\\sqrt{x}$, $(a+b)^2 = a^2 + 2ab + b^2$, $\\angle ABC = 90^\\circ$, $\\Delta = b^2 - 4ac$, $a^2 + b^2 = c^2$, $\\le, \\ge, \\ne, \\perp, \\parallel, \\pi$.
   - Tuyệt đối không biến phân số thành ký tự lỗi hay x^2 thành x2.
4. Bảo toàn Bảng (tables) & Hình vẽ/Sơ đồ (images):
   - Nếu có bảng dữ liệu: giữ nguyên cấu trúc hàng (rows) và cột (headers).
   - Nếu có hình vẽ hình học (hình vuông, tam giác, đường tròn), đồ thị hàm số, sơ đồ tư duy: trích xuất metadata caption, context và đánh dấu needsReview nếu chỉ là phỏng đoán.
5. Tóm tắt & Chủ đề (topics, summary, warnings):
   - Nêu tóm tắt tổng quan 2-4 câu về tài liệu.
   - Liệt kê các chủ đề trọng tâm.
   - Nêu cảnh báo (warnings) nếu phát hiện tài liệu thiếu trang, chất lượng scan mờ hoặc có phần khó nhận diện.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia phân tích tài liệu và cấu trúc hóa dữ liệu giáo dục chuẩn GDPT 2018.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    number: { type: Type.STRING },
                    title: { type: Type.STRING },
                    pageFrom: { type: Type.NUMBER },
                    pageTo: { type: Type.NUMBER },
                    lessonCount: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                  },
                  required: ['id', 'title'],
                },
              },
              lessons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    number: { type: Type.STRING },
                    title: { type: Type.STRING },
                    chapterTitle: { type: Type.STRING },
                    pageFrom: { type: Type.NUMBER },
                    pageTo: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    needsReview: { type: Type.BOOLEAN },
                    summary: { type: Type.STRING },
                    topics: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    keyFormulas: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    keyTheorems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    sections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          order: { type: Type.NUMBER },
                          title: { type: Type.STRING },
                          type: { type: Type.STRING },
                          page: { type: Type.NUMBER },
                          contentSnippet: { type: Type.STRING },
                          formulas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          keyTerms: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          inferred: { type: Type.BOOLEAN },
                        },
                        required: ['id', 'order', 'title', 'contentSnippet'],
                      },
                    },
                  },
                  required: ['id', 'title', 'pageFrom', 'pageTo', 'sections'],
                },
              },
              formulas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    latex: { type: Type.STRING },
                    text: { type: Type.STRING },
                    context: { type: Type.STRING },
                    page: { type: Type.NUMBER },
                    lessonTitle: { type: Type.STRING },
                  },
                  required: ['id', 'latex', 'text', 'context'],
                },
              },
              tables: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    headers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    rows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    page: { type: Type.NUMBER },
                    lessonTitle: { type: Type.STRING },
                  },
                  required: ['id', 'headers', 'rows'],
                },
              },
              images: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    context: { type: Type.STRING },
                    relatedSection: { type: Type.STRING },
                    type: { type: Type.STRING },
                    page: { type: Type.NUMBER },
                    needsReview: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'caption', 'context'],
                },
              },
            },
            required: ['summary', 'confidence', 'topics', 'lessons', 'formulas'],
          },
        },
      });

      const parsedData = response.text ? JSON.parse(response.text) : {};

      const analysisResult = {
        id: `analysis-${documentId || Date.now()}`,
        documentId: documentId || `doc-${Date.now()}`,
        sourceId: sourceId || 'DOC_SOURCE',
        documentVersion: req.body.documentVersion || 1,
        analysisVersion: 1,
        status: 'analyzed',
        analyzedAt: Date.now(),
        metadata: {
          title: title || 'Tài liệu học tập',
          originalName: originalName || '',
          subject,
          grade: Number(grade) || 8,
          documentType,
          pageCount: detectedPageCount,
          wordCount: rawContent.split(/\s+/).filter(Boolean).length,
          scope,
          lessonId,
          lessonTitle,
        },
        chapters: parsedData.chapters || [],
        lessons: parsedData.lessons || [],
        sections: parsedData.sections || [],
        formulas: parsedData.formulas || [],
        tables: parsedData.tables || [],
        images: parsedData.images || [],
        topics: parsedData.topics || [],
        links: [],
        warnings: parsedData.warnings || [],
        confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.95,
        summary: parsedData.summary || 'Đã phân tích cấu trúc tài liệu thành công.',
      };

      res.json({
        success: true,
        analysis: analysisResult,
      });
    } catch (error: any) {
      console.error('Document Analysis API Error:', error);
      res.status(500).json({
        error: error.message || 'Lỗi phân tích tài liệu bằng Gemini AI',
      });
    }
  });

  // 7. AI Structured Lecture Generator (GDPT 2018 Standard with Textbook & Lesson Plan Support)
  app.post('/api/ai/generate-lecture', async (req, res) => {
    try {
      const {
        subject = 'Toán học',
        grade = 8,
        lessonTitle,
        objectives = '',
        duration = '45 phút',
        teacherNotes = '',
        documentText = '',
        documentName = '',
      } = req.body;
      const ai = getGenAI();

      let sourceDocumentContext = '';
      if (documentText && documentText.trim().length > 0) {
        sourceDocumentContext = `
========================================
TÀI LIỆU NGUỒN TỪ GIÁO VIÊN (GIÁO ÁN / SÁCH GIÁO KHOA / TỆP BÀI HỌC "${documentName || 'Tài liệu đính kèm'}"):
"""
${documentText.trim().slice(0, 35000)}
"""
========================================
YÊU CẦU ĐẶC BIỆT KHI CÓ TÀI LIỆU NGUỒN (SGK / GIÁO ÁN DOCX HOẶC PDF):
1. Bạn PHẢI bám sát và kế thừa toàn bộ các định nghĩa khoa học, định lý, hoạt động khám phá, hình ảnh tư duy, bài toán mở đầu và ví dụ từ tài liệu nguồn ở trên.
2. Trích lọc chuẩn xác các thuật ngữ sư phạm, công thức toán học/khoa học dạng chuỗi hoặc LaTeX, phương pháp giải đúng chuẩn chương trình của tài liệu nguồn.
3. Không bỏ sót các nội dung cốt lõi và mục tiêu trọng tâm mà tài liệu nguồn đã đề cập.
`;
      }

      const prompt = `Hãy soạn một bài giảng điện tử có cấu trúc chuẩn mực cho môn ${subject} lớp ${grade}, bài học: "${lessonTitle}".
Thời lượng dự kiến: ${duration}.
${objectives ? `Mục tiêu trọng tâm cần đạt / Nội dung chính do giáo viên nhập: ${objectives}` : ''}
${teacherNotes ? `Yêu cầu bổ sung của giáo viên: ${teacherNotes}` : ''}
${sourceDocumentContext}

Yêu cầu cấu trúc bài giảng điện tử tương tác chuẩn GDPT 2018:
1. objectives: Mảng các mục tiêu cần đạt cụ thể (về kiến thức, kỹ năng, năng lực đặc thù và phẩm chất).
2. warmup: Hoạt động khởi động thu hút học sinh (tình huống thực tế đời sống hoặc câu đố kích thích tư duy, bám sát sách giáo khoa).
3. sections: Các phần hình thành kiến thức (từ 3 đến 5 mục kiến thức trọng tâm):
   - title: Tiêu đề mục rõ ràng (ví dụ: "1. Khái niệm đơn thức", "2. Bậc của đơn thức")
   - content: Lý thuyết giải thích sâu sắc, sư phạm, chuẩn xác, diễn giải mạch lạc
   - formula: Công thức toán học/khoa học quan trọng (nếu có) dạng chuỗi
   - keyPoints: Mảng các điểm trọng tâm then chốt cần khắc sâu ghi nhớ
   - examples: Các ví dụ minh họa từng bước có đề bài (problem), lời giải chi tiết và nhận xét (solution)
   - callout: Lưu ý quan trọng hoặc mẹo làm bài { type: 'tip' | 'warning' | 'info', text: string }
4. practice: Các bài tập luyện tập củng cố tại lớp có kèm gợi ý (hint).
5. application: Hoạt động vận dụng thực tiễn giải quyết bài toán đời sống.
6. summary: Tóm tắt bài học (các gạch đầu dòng then chốt).`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia sư phạm và cố vấn biên soạn sách giáo khoa chương trình GDPT 2018 Việt Nam.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              warmup: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  scenario: { type: Type.STRING },
                  question: { type: Type.STRING },
                },
                required: ['title', 'scenario'],
              },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          problem: { type: Type.STRING },
                          solution: { type: Type.STRING },
                        },
                        required: ['problem', 'solution'],
                      },
                    },
                    callout: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                    },
                  },
                  required: ['title', 'content', 'keyPoints'],
                },
              },
              practice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    hint: { type: Type.STRING },
                  },
                  required: ['question'],
                },
              },
              application: { type: Type.STRING },
              summary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'objectives', 'sections', 'summary'],
          },
        },
      });

      const text = response.text;
      const lectureData = text ? JSON.parse(text) : null;
      res.json({ success: true, lecture: lectureData });
    } catch (error: any) {
      console.error('Lecture Generation Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo bài giảng AI' });
    }
  });

  // 7b. AI Structured Presentation & Slide Generator (GDPT 2018 - Phase 3)
  app.post('/api/ai/generate-presentation-structure', async (req, res) => {
    try {
      const {
        subject = 'Toán học',
        grade = 8,
        lessonTitle,
        duration = '45 phút',
        pedagogicalStyle = 'interactive', // traditional | interactive | exploratory | practice-heavy
        generationMode = 'standard', // fast | standard | detailed
        customObjectives = '',
        teacherNotes = '',
        selectedSources = [], // Array of selected document sources with analysis data
        structuredContext = null, // Extracted StructuredLessonContext from Phase 2
      } = req.body;

      const ai = getGenAI();

      // Build rich context from Phase 2 structured data & selected documents
      let sourcesContextText = '';
      if (selectedSources && selectedSources.length > 0) {
        sourcesContextText += `\n========================================\nDANH SÁCH NGUỒN TÀI LIỆU GIÁO VIÊN ĐÃ CHỌN:\n`;
        selectedSources.forEach((src: any, index: number) => {
          sourcesContextText += `\n--- NGUỒN [${index + 1}]: ${src.name || src.title} (${src.scope === 'shared' ? 'Kho chung' : 'Tài liệu riêng của bài'}) ---\n`;
          if (src.pageRange) {
            sourcesContextText += `Phạm vi trang liên quan: Trang ${src.pageRange.from} -> ${src.pageRange.to}\n`;
          }
          if (src.analysis && src.analysis.summary) {
            sourcesContextText += `Tóm tắt phân tích Giai đoạn 2: ${src.analysis.summary}\n`;
          }
          if (src.matchedLesson) {
            sourcesContextText += `Bài học đối ứng trong SGK: ${src.matchedLesson.title} (Trang ${src.matchedLesson.pageFrom}-${src.matchedLesson.pageTo})\n`;
            if (src.matchedLesson.keyTerms?.length) {
              sourcesContextText += `Từ khóa cốt lõi: ${src.matchedLesson.keyTerms.join(', ')}\n`;
            }
            if (src.matchedLesson.sections?.length) {
              sourcesContextText += `Các mục kiến thức trích xuất:\n`;
              src.matchedLesson.sections.forEach((sec: any) => {
                sourcesContextText += `  • [${sec.type}] ${sec.title}: ${sec.contentSnippet || ''}\n`;
              });
            }
          }
          if (src.rawTextSnippet) {
            sourcesContextText += `Nội dung trích đoạn tệp:\n"""\n${src.rawTextSnippet.slice(0, 8000)}\n"""\n`;
          }
        });
        sourcesContextText += `========================================\n`;
      }

      if (structuredContext) {
        if (structuredContext.allKeyFormulas && structuredContext.allKeyFormulas.length > 0) {
          sourcesContextText += `\nCÔNG THỨC TOÁN HỌC TRỌNG TÂM ĐÃ ĐƯỢC LẬP CHỈ MỤC (PHẢI BẢO TOÀN DẠNG LATEX):\n`;
          structuredContext.allKeyFormulas.forEach((f: string) => {
            sourcesContextText += `  • $${f}$\n`;
          });
        }
        if (structuredContext.allKeyTheorems && structuredContext.allKeyTheorems.length > 0) {
          sourcesContextText += `\nĐỊNH LÝ / QUY TẮC CỐT LÕI TỪ NGUỒN:\n`;
          structuredContext.allKeyTheorems.forEach((th: string) => {
            sourcesContextText += `  • ${th}\n`;
          });
        }
      }

      // Slide count guidance based on generationMode
      let slideCountGuidance = 'Khoảng 10 - 12 slide logic';
      if (generationMode === 'fast') {
        slideCountGuidance = 'Khoảng 7 - 9 slide logic súc tích, tập trung kiến thức trọng tâm';
      } else if (generationMode === 'detailed') {
        slideCountGuidance = 'Khoảng 14 - 18 slide logic đầy đủ ví dụ, hoạt động và bài tập vận dụng';
      }

      const prompt = `Bạn là chuyên gia thiết kế bài giảng điện tử THCS hàng đầu theo chuẩn chương trình GDPT 2018 Việt Nam.
Hãy xây dựng CẤU TRÚC BÀI GIẢNG VÀ TIẾN TRÌNH SLIDE NỘI DUNG LOGIC (GIAI ĐOẠN 3) cho bài học:

Môn học: ${subject}
Khối lớp: ${grade}
Tên bài học: "${lessonTitle}"
Thời lượng: ${duration}
Phong cách sư phạm: ${pedagogicalStyle} (truyền thống | tương tác | khám phá | luyện tập nhiều)
Quy mô cấu trúc: ${generationMode} (${slideCountGuidance})
${customObjectives ? `Mục tiêu riêng do giáo viên nhập: ${customObjectives}` : ''}
${teacherNotes ? `Ghi chú/yêu cầu sư phạm bổ sung của giáo viên: ${teacherNotes}` : ''}

${sourcesContextText}

QUY TẮC SƯ PHẠM BẮT BUỘC (GIAI ĐOẠN 3):
1. BÁM SÁT TÀI LIỆU NGUỒN (SGK, Kế hoạch bài dạy, Phiếu học tập):
   - Ưu tiên cao nhất nội dung từ các tài liệu đã chọn.
   - Không được tự bịa kiến thức vượt quá chương trình GDPT 2018 môn ${subject} lớp ${grade}.
   - Phải tạo trường sourceReferences cho từng slide để giáo viên truy ngược về nguồn (tên tài liệu, số trang). Nếu nội dung do AI suy luận/đề xuất thì ghi rõ isDirectQuote = false.

2. BẢO TOÀN TUYỆT ĐỐI CÔNG THỨC TOÁN HỌC (LATEX):
   - Mọi biểu thức toán học phải lưu chuẩn LaTeX (ví dụ: "\\\\frac{a}{b}", "x^2 - 4", "\\\\sqrt{x}", "\\\\Delta", "\\\\angle ABC", "\\\\perp", "\\\\parallel").
   - Đưa các công thức then chốt vào mảng "formulas" của từng slide.

3. TIẾN TRÌNH DẠY HỌC LOGIC GDPT 2018:
   - Slide mở đầu (title) -> Mục tiêu (objective) -> Khởi động (warmup) -> Hình thành kiến thức / Khái niệm / Định lý (knowledge) -> Ví dụ mẫu (example) -> Hoạt động khám phá / Thảo luận (activity) -> Luyện tập tại lớp (practice) -> Vận dụng thực tiễn (application) -> Củng cố / Sơ đồ tư duy (summary) -> Dặn dò (assignment).
   - Mỗi slide phải có teachingActivity (Hoạt động giáo viên - Hoạt động học sinh) và keyPoints rõ ràng.
   - Nếu có câu hỏi tương tác trong slide, đặt source = "presentation-only".
   - Nếu có hình vẽ trong tài liệu nguồn, lưu thông tin visual dạng "source-image". Nếu cần hình minh họa mà nguồn chưa có, tạo "visual-request".

Hãy trả về định dạng JSON thuần tuý theo schema quy định.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia sư phạm THCS Việt Nam, thiết kế cấu trúc bài giảng điện tử chuẩn GDPT 2018 chất lượng cao.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              pedagogicalFlow: {
                type: Type.OBJECT,
                properties: {
                  objectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  warmupSummary: { type: Type.STRING },
                  keyKnowledgeSummary: { type: Type.STRING },
                  practiceSummary: { type: Type.STRING },
                  applicationSummary: { type: Type.STRING },
                  assessmentSummary: { type: Type.STRING },
                },
                required: ['objectives', 'warmupSummary', 'keyKnowledgeSummary', 'practiceSummary'],
              },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    order: { type: Type.NUMBER },
                    type: {
                      type: Type.STRING,
                      description: 'title | objective | warmup | knowledge | example | activity | practice | application | summary | assignment',
                    },
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    content: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    formulas: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          problem: { type: Type.STRING },
                          solution: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                        },
                        required: ['problem', 'solution'],
                      },
                    },
                    teachingActivity: {
                      type: Type.OBJECT,
                      properties: {
                        teacherActivity: { type: Type.STRING },
                        studentActivity: { type: Type.STRING },
                        expectedResponse: { type: Type.STRING },
                      },
                    },
                    interactionQuestions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          questionText: { type: Type.STRING },
                          type: { type: Type.STRING },
                          options: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                key: { type: Type.STRING },
                                text: { type: Type.STRING },
                              },
                              required: ['key', 'text'],
                            },
                          },
                          answer: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                          source: { type: Type.STRING },
                        },
                        required: ['id', 'questionText', 'answer'],
                      },
                    },
                    visuals: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          caption: { type: Type.STRING },
                          page: { type: Type.NUMBER },
                          visualRequest: {
                            type: Type.OBJECT,
                            properties: {
                              required: { type: Type.BOOLEAN },
                              description: { type: Type.STRING },
                              purpose: { type: Type.STRING },
                            },
                          },
                        },
                        required: ['type'],
                      },
                    },
                    sourceReferences: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          documentId: { type: Type.STRING },
                          documentName: { type: Type.STRING },
                          page: { type: Type.NUMBER },
                          sectionTitle: { type: Type.STRING },
                          isDirectQuote: { type: Type.BOOLEAN },
                        },
                        required: ['documentName'],
                      },
                    },
                    teacherNotes: { type: Type.STRING },
                    needsReview: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'order', 'type', 'title', 'content', 'keyPoints'],
                },
              },
              qualityNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'pedagogicalFlow', 'slides'],
          },
        },
      });

      const responseText = response.text || '{}';
      let parsedOutput: any;
      try {
        parsedOutput = JSON.parse(responseText);
      } catch (parseErr) {
        console.log('[Presentation Generator] Parsing JSON output with regex extraction...');
        const match = responseText.match(/\{[\s\S]*\}/);
        parsedOutput = match ? JSON.parse(match[0]) : {};
      }

      res.json({
        success: true,
        data: parsedOutput,
      });
    } catch (error: any) {
      console.error('Presentation Structure Generation Error:', error);
      res.status(500).json({
        error: error.message || 'Lỗi tạo cấu trúc bài giảng AI',
      });
    }
  });

  // 7. AI Multi-Type Question Set Generator with Cognitive Levels & Type Counts (3x3 Matrix Supported)
  app.post('/api/ai/generate-question-set', async (req, res) => {
    try {
      const {
        lessonTitle,
        subject = 'Toán học',
        grade = 8,
        count = 10,
        multipleChoiceCount = 6,
        trueFalseCount = 3,
        shortAnswerCount = 1,
        questionTypes = ['multiple-choice', 'true-false', 'short-answer'],
        cognitiveLevels = ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
        matrix = null, // Detailed 9-cell matrix: { multipleChoice: { recognition, understanding, application }, trueFalse: {...}, shortAnswer: {...} }
        teacherNotes = '',
      } = req.body;

      const ai = getGenAI();

      let matrixDescription = '';
      if (matrix) {
        matrixDescription = `
MA TRẬN CÂU HỎI CHI TIẾT ĐƯỢC CHỈ ĐỊNH (BẮT BUỘC TUÂN THỦ CHÍNH XÁC SỐ LƯỢNG MỖI Ô):
1. Dạng Nhiều lựa chọn (multiple-choice):
   - Nhận biết: ${matrix.multipleChoice?.recognition || 0} câu
   - Thông hiểu: ${matrix.multipleChoice?.understanding || 0} câu
   - Vận dụng: ${matrix.multipleChoice?.application || 0} câu
   - Vận dụng cao: ${matrix.multipleChoice?.advanced || 0} câu
2. Dạng Đúng / Sai (true-false):
   - Nhận biết: ${matrix.trueFalse?.recognition || 0} câu
   - Thông hiểu: ${matrix.trueFalse?.understanding || 0} câu
   - Vận dụng: ${matrix.trueFalse?.application || 0} câu
   - Vận dụng cao: ${matrix.trueFalse?.advanced || 0} câu
3. Dạng Trả lời ngắn (short-answer):
   - Nhận biết: ${matrix.shortAnswer?.recognition || 0} câu
   - Thông hiểu: ${matrix.shortAnswer?.understanding || 0} câu
   - Vận dụng: ${matrix.shortAnswer?.application || 0} câu
   - Vận dụng cao: ${matrix.shortAnswer?.advanced || 0} câu
`;
      } else {
        matrixDescription = `
PHÂN PHỐI SỐ LƯỢNG VÀ ĐỊNH DẠNG CÂU HỎI BẮT BUỘC:
1. ${multipleChoiceCount} câu hỏi dạng "multiple-choice" (Nhiều lựa chọn).
2. ${trueFalseCount} câu hỏi dạng "true-false" (Đúng / Sai).
3. ${shortAnswerCount} câu hỏi dạng "short-answer" (Trả lời ngắn / Điền đáp số).
PHÂN BỔ CẤP ĐỘ NHẬN THỨC: ${cognitiveLevels.join(', ')}.
`;
      }

      const prompt = `Bạn là chuyên gia thẩm định và ra đề thi môn ${subject} cấp THCS chuẩn chương trình GDPT 2018.
Hãy tạo một ngân hàng câu hỏi kiểm tra đánh giá chất lượng cao cho bài học: "${lessonTitle}" (Môn ${subject} Lớp ${grade}).

${matrixDescription}

QUY TẮC ĐỊNH DẠNG DỮ LIỆU:
1. "multiple-choice" (Nhiều lựa chọn):
   - Mỗi câu gồm 4 phương án A, B, C, D (options có đủ 4 key: "A", "B", "C", "D").
   - Chỉ có đúng 1 đáp án chính xác (correctAnswer là "A", "B", "C", hoặc "D").
2. "true-false" (Đúng / Sai):
   - options gồm đúng 2 phương án: [{ key: "A", text: "Đúng" }, { key: "B", text: "Sai" }].
   - correctAnswer là "A" (nếu mệnh đề Đúng) hoặc "B" (nếu mệnh đề Sai).
3. "short-answer" (Trả lời ngắn / Điền đáp số):
   - Đặt câu hỏi yêu cầu tính toán ra một kết quả/đáp số cụ thể (ví dụ: số nguyên, phân số, tọa độ, biểu thức).
   - Điền đáp số chuẩn vào trường shortAnswerKey.
   - Đồng thời cung cấp 4 phương án A, B, C, D trong options (trong đó có 1 phương án chứa đáp số đúng và correctAnswer tương ứng) để tương thích 100% với Game Engine và Đấu trường trực tiếp.

QUY TẮC CÔNG THỨC TOÁN HỌC (LATEX):
- Mọi công thức Toán học phải viết ở định dạng LaTeX chuẩn: $x^2 + 2x + 1 = 0$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\angle ABC$, v.v.

YÊU CẦU BỔ SUNG CỦA GIÁO VIÊN:
${teacherNotes ? `- ${teacherNotes}` : '- Đảm bảo tính khoa học, chuẩn xác tuyệt đối về kiến thức và ký hiệu.'}
- Mỗi câu hỏi phải kèm theo lời giải thích (explanation) chi tiết từng bước.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia thẩm định và ra đề thi môn Toán và KHTN chuẩn GDPT 2018.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING, description: 'Nội dung câu hỏi' },
                questionType: {
                  type: Type.STRING,
                  description: 'multiple-choice, true-false, hoặc short-answer',
                },
                cognitiveLevel: {
                  type: Type.STRING,
                  description: 'Nhận biết, Thông hiểu, Vận dụng, hoặc Vận dụng cao',
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctAnswer: { type: Type.STRING, description: 'A, B, C, hoặc D' },
                shortAnswerKey: { type: Type.STRING, description: 'Đáp án ngắn nếu là dạng trả lời ngắn' },
                explanation: { type: Type.STRING, description: 'Lời giải chi tiết' },
              },
              required: ['content', 'options', 'correctAnswer', 'explanation', 'cognitiveLevel', 'questionType'],
            },
          },
        },
      });

      const text = response.text;
      const questions = text ? JSON.parse(text) : [];
      res.json({ success: true, questions });
    } catch (error: any) {
      console.error('Question Set Generation Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo bộ câu hỏi AI' });
    }
  });

  // 7c. AI Parse Questions from File (DOCX / PDF / Image / Text)
  app.post('/api/ai/parse-questions-file', async (req, res) => {
    try {
      const {
        documentText = '',
        fileBase64 = '',
        mimeType = '',
        originalName = '',
        lessonTitle = '',
        subject = 'Toán học',
        grade = 8,
      } = req.body;

      let rawContent = (documentText || '').trim();
      const ai = getGenAI();

      let promptParts: any[] = [];

      if (!rawContent && fileBase64) {
        const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
        const buffer = Buffer.from(base64Data, 'base64');
        const isPdf = (mimeType && mimeType.includes('pdf')) || originalName.toLowerCase().endsWith('.pdf');
        const isDocx = (mimeType && (mimeType.includes('word') || mimeType.includes('officedocument'))) || originalName.toLowerCase().endsWith('.docx');
        const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif)$/i.test(originalName);

        if (isImage) {
          promptParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/jpeg',
            },
          });
        } else if (isPdf) {
          try {
            const pdfData = await pdfParse(buffer);
            rawContent = pdfData.text || '';
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else if (isDocx) {
          try {
            const docxResult = await mammoth.extractRawText({ buffer });
            rawContent = docxResult.value || '';
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else {
          rawContent = buffer.toString('utf-8');
        }
      }

      const promptText = `Bạn là trợ lý AI chuyên bóc tách, chuẩn hóa đề thi và câu hỏi trắc nghiệm/tự luận giáo dục THCS Việt Nam.
Hãy đọc kỹ tệp đính kèm hoặc văn bản sau và trích xuất TOÀN BỘ các câu hỏi tìm thấy:

THÔNG TIN BÀI HỌC:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Tên bài học: "${lessonTitle}"

${rawContent ? `NỘI DUNG VĂN BẢN TRÍCH XUẤT:\n"""\n${rawContent.slice(0, 35000)}\n"""` : 'Hãy đọc nội dung từ ảnh/tệp đính kèm.'}

YÊU CẦU BÓC TÁCH:
1. Phân loại từng câu hỏi:
   - questionType: "multiple-choice" (nếu có 4 phương án A, B, C, D), "true-false" (nếu là Đúng/Sai), hoặc "short-answer" (tự luận ngắn).
   - cognitiveLevel: "Nhận biết", "Thông hiểu", "Vận dụng", hoặc "Vận dụng cao".
2. Giữ nguyên và chuẩn hóa các công thức Toán học sang định dạng LaTeX chuẩn: $x^2 + y^2 = 25$, $\\frac{a}{b}$, $\\sqrt{x}$.
3. Trích xuất phương án options đầy đủ:
   - Nếu là multiple-choice: 4 phương án [{ key: "A", text: "..." }, { key: "B", text: "..." }, { key: "C", text: "..." }, { key: "D", text: "..." }].
   - Nếu là true-false: [{ key: "A", text: "Đúng" }, { key: "B", text: "Sai" }].
   - Nếu là short-answer: điền shortAnswerKey và tạo 4 phương án options tương thích Game Engine.
4. correctAnswer: "A", "B", "C", hoặc "D".
5. explanation: Lời giải hoặc nhận xét chi tiết.`;

      promptParts.push(promptText);

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: promptParts,
        config: {
          systemInstruction: 'Bạn là chuyên gia bóc tách đề thi và số hóa học liệu sư phạm THCS.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                questionType: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctAnswer: { type: Type.STRING },
                shortAnswerKey: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['content', 'options', 'correctAnswer', 'cognitiveLevel', 'questionType'],
            },
          },
        },
      });

      const text = response.text;
      const questions = text ? JSON.parse(text) : [];
      res.json({ success: true, questions });
    } catch (error: any) {
      console.error('Parse Questions File Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi bóc tách câu hỏi từ tệp' });
    }
  });

  // 8. AI Regenerate Single Question
  app.post('/api/ai/regenerate-single-question', async (req, res) => {
    try {
      const {
        lessonTitle,
        subject = 'Toán học',
        grade = 8,
        cognitiveLevel = 'Thông hiểu',
        questionType = 'multiple-choice',
        oldQuestionContent = '',
        teacherNotes = '',
      } = req.body;

      const ai = getGenAI();

      const prompt = `Hãy tạo MỘT câu hỏi MỚI DUY NHẤT để thay thế câu hỏi cũ môn ${subject} lớp ${grade}, bài học: "${lessonTitle}".
Thông tin câu hỏi cần tạo:
- Cấp độ nhận thức: ${cognitiveLevel}
- Loại câu hỏi: ${questionType}
${oldQuestionContent ? `Câu hỏi cũ cần thay thế: "${oldQuestionContent}"` : ''}
${teacherNotes ? `Yêu cầu chỉnh sửa cụ thể: ${teacherNotes}` : ''}

Yêu cầu:
- Câu hỏi mới phải khác câu cũ nhưng cùng chủ đề bài học và mức độ nhận thức.
- options gồm 4 đáp án A, B, C, D (hoặc 2 đáp án nếu là Đúng/Sai).
- correctAnswer và explanation chi tiết.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia ra đề thi sư phạm.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              questionType: { type: Type.STRING },
              cognitiveLevel: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ['key', 'text'],
                },
              },
              correctAnswer: { type: Type.STRING },
              shortAnswerKey: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['content', 'options', 'correctAnswer', 'explanation', 'cognitiveLevel'],
          },
        },
      });

      const text = response.text;
      const question = text ? JSON.parse(text) : null;
      res.json({ success: true, question });
    } catch (error: any) {
      console.error('Regenerate Question Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo lại câu hỏi' });
    }
  });

  // =====================================================================
  // AI TRUYỆN TRANH BÀI HỌC (Comic Lesson Pipeline)
  // Bài học -> Hồ sơ kiến thức -> Hạt nhân truyện -> Nhân vật -> Kịch bản
  // -> Storyboard -> Duyệt -> Tranh -> Kiểm tra chất lượng -> Audio -> Video
  // =====================================================================

  const COMIC_SCENE_TYPES = [
    'opening',
    'problem',
    'questioning',
    'hypothesis',
    'discovery',
    'application',
    'result',
    'summary',
  ] as const;

  const COMIC_ILLUSTRATION_TYPES = [
    'schoolyard_tree',
    'schoolyard_measure',
    'classroom_board',
    'library_study',
    'greenhouse_plant',
    'nature_field',
    'lab_discovery',
  ];

  // 9a. AI Analyze Lesson Source -> Knowledge Profile (from text, PDF, DOCX, or image)
  app.post('/api/comic/analyze-source', async (req, res) => {
    try {
      const {
        sourceText = '',
        fileBase64 = '',
        mimeType = '',
        originalName = '',
        subject = 'Toán học',
        grade = 'Lớp 8',
      } = req.body;

      let rawContent = (sourceText || '').trim();
      const ai = getGenAI();
      const promptParts: any[] = [];

      if (fileBase64) {
        const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
        const buffer = Buffer.from(base64Data, 'base64');
        const isPdf = (mimeType && mimeType.includes('pdf')) || originalName.toLowerCase().endsWith('.pdf');
        const isDocx =
          (mimeType && (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml'))) ||
          originalName.toLowerCase().endsWith('.docx');
        const isPptx =
          (mimeType && mimeType.includes('presentationml')) ||
          /\.(pptx|ppt)$/i.test(originalName);
        const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif)$/i.test(originalName);

        if (isImage) {
          promptParts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' } });
        } else if (isPdf) {
          try {
            const pdfData = await pdfParse(buffer);
            rawContent = pdfData.text || '';
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else if (isDocx) {
          try {
            const docxResult = await mammoth.extractRawText({ buffer });
            rawContent = docxResult.value || '';
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else if (isPptx) {
          // PPTX text is XML-zipped; fall back to raw scan for readable text fragments
          rawContent = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ').slice(0, 40000);
        } else {
          rawContent = buffer.toString('utf-8');
        }
      }

      if (!rawContent && promptParts.length === 0) {
        return res.status(400).json({ error: 'Cần cung cấp nội dung bài học (văn bản hoặc tệp đính kèm).' });
      }

      const promptText = `Bạn là chuyên gia sư phạm THCS, chuyên bóc tách nội dung bài học chuẩn Chương trình GDPT 2018 để chuyển thể thành truyện tranh giáo dục.

THÔNG TIN: Môn học "${subject}", Khối "${grade}".

${rawContent ? `NỘI DUNG NGUỒN (SGK/Giáo án/Sách GV):\n"""\n${rawContent.slice(0, 35000)}\n"""` : 'Hãy đọc nội dung từ tệp/ảnh đính kèm.'}

YÊU CẦU: Đọc kỹ và trích xuất chính xác, TUYỆT ĐỐI KHÔNG bịa thêm kiến thức không có trong nguồn:
1. objectives: Mục tiêu bài học (năng lực, phẩm chất theo GDPT 2018).
2. coreKnowledge: Kiến thức trọng tâm bất biến (giữ nguyên định nghĩa/định lý gốc).
3. concepts: Các khái niệm chính.
4. formulas: Công thức dạng LaTeX chuẩn (không kèm dấu $, chỉ nội dung LaTeX thuần, VD "\\\\frac{a}{b}").
5. examples: Ví dụ minh họa cụ thể có số liệu.
6. problemSolvingProcess: Quy trình giải quyết vấn đề / các bước thực hành theo thứ tự.
7. importantDiagrams: Mô tả hình vẽ/sơ đồ quan trọng cần thể hiện trực quan.
8. keyTerms: Thuật ngữ cốt lõi.
9. commonMisconceptions: Lỗi học sinh thường nhầm lẫn (để cài vào kịch bản truyện nhằm khắc phục).
10. teacherNotes: Ghi chú nguồn tài liệu, bộ sách.
Cũng xác nhận lại chapter và lessonTitle chính xác từ nguồn.`;

      promptParts.push(promptText);

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: promptParts,
        config: {
          systemInstruction: 'Bạn là chuyên gia phân tích học liệu sư phạm THCS, tuyệt đối trung thành với nguồn tài liệu gốc, không tự bịa kiến thức.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              grade: { type: Type.STRING },
              chapter: { type: Type.STRING },
              lessonTitle: { type: Type.STRING },
              objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              coreKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
              concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
              formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              problemSolvingProcess: { type: Type.ARRAY, items: { type: Type.STRING } },
              importantDiagrams: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
              commonMisconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              teacherNotes: { type: Type.STRING },
            },
            required: [
              'subject', 'grade', 'chapter', 'lessonTitle', 'objectives', 'coreKnowledge',
              'concepts', 'formulas', 'examples', 'problemSolvingProcess', 'commonMisconceptions',
            ],
          },
        },
      });

      const text = response.text;
      const knowledgeProfile = text ? JSON.parse(text) : null;
      if (!knowledgeProfile) throw new Error('AI không trả về dữ liệu hợp lệ.');
      res.json({ success: true, knowledgeProfile });
    } catch (error: any) {
      console.error('Comic Analyze Source Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi phân tích nguồn bài học' });
    }
  });

  // 9b. AI Generate Story Kernel from Knowledge Profile
  app.post('/api/comic/generate-story-kernel', async (req, res) => {
    try {
      const { knowledgeProfile } = req.body;
      if (!knowledgeProfile) return res.status(400).json({ error: 'Thiếu hồ sơ kiến thức' });

      const ai = getGenAI();
      const prompt = `Bạn là biên kịch truyện tranh giáo dục THCS. Hãy tìm "hạt nhân câu chuyện" (story kernel) từ bài học sau, biến kiến thức hàn lâm thành một TÌNH HUỐNG THỰC TẾ, gần gũi lứa tuổi THCS mà nhân vật buộc phải dùng đúng kiến thức bài học để giải quyết.

BÀI HỌC: ${knowledgeProfile.lessonTitle} (${knowledgeProfile.subject} - ${knowledgeProfile.grade})
KIẾN THỨC TRỌNG TÂM: ${(knowledgeProfile.coreKnowledge || []).join(' | ')}
CÔNG THỨC: ${(knowledgeProfile.formulas || []).join(' | ')}
LỖI HAY GẶP CẦN CÀI VÀO TÌNH HUỐNG: ${(knowledgeProfile.commonMisconceptions || []).join(' | ')}

Yêu cầu xây dựng:
1. problemStatement: Vấn đề thực tế mở đầu, gây tò mò, không thể giải quyết bằng cách thông thường.
2. protagonistNames: 2-3 tên nhân vật học sinh Việt Nam phù hợp câu chuyện.
3. goal: Mục tiêu cụ thể nhân vật phải đạt.
4. obstacles: Trở ngại khiến cách làm thông thường thất bại.
5. knowledgeToDiscover: Kiến thức bài học chính là chìa khóa giải quyết.
6. climax: Khoảnh khắc "A-ha!" nhân vật lóe sáng ý tưởng.
7. resolution: Cách giải quyết cụ thể có số liệu, áp dụng đúng công thức/định lý.
8. knowledgeConclusion: Bài học khái quát rút ra, dễ nhớ.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là biên kịch sư phạm chuyên biến kiến thức thành câu chuyện thực tế hấp dẫn cho học sinh THCS.',
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              problemStatement: { type: Type.STRING },
              protagonistNames: { type: Type.ARRAY, items: { type: Type.STRING } },
              goal: { type: Type.STRING },
              obstacles: { type: Type.STRING },
              knowledgeToDiscover: { type: Type.STRING },
              climax: { type: Type.STRING },
              resolution: { type: Type.STRING },
              knowledgeConclusion: { type: Type.STRING },
            },
            required: ['problemStatement', 'goal', 'obstacles', 'knowledgeToDiscover', 'climax', 'resolution', 'knowledgeConclusion'],
          },
        },
      });

      const text = response.text;
      const storyKernel = text ? JSON.parse(text) : null;
      if (!storyKernel) throw new Error('AI không trả về dữ liệu hợp lệ.');
      res.json({ success: true, storyKernel });
    } catch (error: any) {
      console.error('Comic Story Kernel Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo hạt nhân câu chuyện' });
    }
  });

  // 9c. AI Text-to-Speech: sinh giọng đọc thật cho lời dẫn / hội thoại (dùng cho Bước 7 & xuất Video Bước 8)
  app.post('/api/comic/synthesize-speech', async (req, res) => {
    try {
      const { text = '', voiceName = 'Kore' } = req.body;
      if (!text.trim()) return res.status(400).json({ error: 'Thiếu nội dung cần đọc' });

      const ai = getGenAI();
      const ttsModels = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];
      let audioData = '';
      let lastError: any = null;

      for (const model of ttsModels) {
        try {
                    const response = await ai.models.generateContent({
            model,
            contents: [{
              parts: [{
                text: `Đọc đoạn văn tiếng Việt sau bằng giọng miền Bắc chuẩn, tự nhiên, phát âm rõ ràng, đúng dấu thanh điệu: ${text}`,
              }],
            }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                languageCode: 'vi-VN',
              },
            },
          } as any);
          const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (data) {
            audioData = data;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!audioData) throw lastError || new Error('AI không thể tạo giọng đọc lúc này.');

      const pcmBuffer = Buffer.from(audioData, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const durationSec = pcmBuffer.length / (24000 * 1 * 2);

      res.json({
        success: true,
        audioBase64: wavBuffer.toString('base64'),
        mimeType: 'audio/wav',
        durationSec: Math.max(0.5, durationSec),
        voiceName,
      });
    } catch (error: any) {
      console.error('Comic TTS Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo giọng đọc AI' });
    }
  });

  // 9d. AI Suggest Characters from Knowledge Profile + Story Kernel
  app.post('/api/comic/generate-characters', async (req, res) => {
    try {
      const { knowledgeProfile, storyKernel, characterCount = 4 } = req.body;

      const ai = getGenAI();
      const prompt = `Hãy thiết kế ${characterCount} nhân vật cho truyện tranh giáo dục THCS môn "${knowledgeProfile?.subject || ''}" (${knowledgeProfile?.grade || ''}).
Tình huống truyện: ${storyKernel?.problemStatement || ''}
Gợi ý tên nhân vật (nếu có thể dùng): ${(storyKernel?.protagonistNames || []).join(', ')}

Yêu cầu mỗi nhân vật:
- Có ít nhất 1 giáo viên/người hướng dẫn (role: "teacher" hoặc "guide"), còn lại là học sinh (role: "student").
- id dạng "char-<tên-không-dấu-viết-thường>" (VD: "char-minh").
- age hợp lý với khối lớp THCS (12-15) hoặc người lớn với giáo viên.
- appearance, outfit mô tả CHI TIẾT, CỤ THỂ (màu sắc, kiểu tóc, trang phục) để giữ nhất quán hình ảnh xuyên suốt truyện.
- signatureColor: mã màu hex riêng biệt cho từng nhân vật, không trùng nhau.
- educationalRole: vai trò sư phạm của nhân vật trong việc dẫn dắt khám phá kiến thức.
- gender: "male" hoặc "female".`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là nhà thiết kế nhân vật truyện tranh giáo dục, ưu tiên sự đa dạng và nhất quán hình ảnh.',
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                age: { type: Type.NUMBER },
                grade: { type: Type.STRING },
                role: { type: Type.STRING },
                personality: { type: Type.STRING },
                appearance: { type: Type.STRING },
                outfit: { type: Type.STRING },
                signatureColor: { type: Type.STRING },
                speechStyle: { type: Type.STRING },
                educationalRole: { type: Type.STRING },
                gender: { type: Type.STRING },
              },
              required: ['id', 'name', 'age', 'grade', 'role', 'personality', 'appearance', 'outfit', 'signatureColor', 'speechStyle', 'educationalRole', 'gender'],
            },
          },
        },
      });

      const text = response.text;
      let characters = text ? JSON.parse(text) : [];
      // Sanitize roles/gender to expected enums
      characters = characters.map((c: any, idx: number) => ({
        ...c,
        id: c.id || `char-${Date.now()}-${idx}`,
        role: ['student', 'teacher', 'guide', 'supporting'].includes(c.role) ? c.role : 'student',
        gender: c.gender === 'female' ? 'female' : 'male',
      }));
      res.json({ success: true, characters });
    } catch (error: any) {
      console.error('Comic Generate Characters Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo nhân vật' });
    }
  });

  // 9e. AI Generate Full 8-Scene Script from Knowledge Profile + Story Kernel + Characters
  app.post('/api/comic/generate-script', async (req, res) => {
    try {
      const { knowledgeProfile, storyKernel, characters = [] } = req.body;
      if (!knowledgeProfile || !storyKernel) {
        return res.status(400).json({ error: 'Thiếu hồ sơ kiến thức hoặc hạt nhân câu chuyện' });
      }

      const ai = getGenAI();
      const characterList = characters
        .map((c: any) => `${c.name} (id: ${c.id}, ${c.role}, tính cách: ${c.personality})`)
        .join('; ');

      const prompt = `Viết kịch bản truyện tranh giáo dục gồm ĐÚNG 8 CẢNH theo tiến trình nhận thức sư phạm chuẩn cho bài học sau. Mỗi cảnh phải nối tiếp mạch truyện logic.

BÀI HỌC: ${knowledgeProfile.lessonTitle} (${knowledgeProfile.subject} - ${knowledgeProfile.grade})
KIẾN THỨC TRỌNG TÂM: ${(knowledgeProfile.coreKnowledge || []).join(' | ')}
CÔNG THỨC: ${(knowledgeProfile.formulas || []).join(' | ')}
QUY TRÌNH GIẢI QUYẾT VẤN ĐỀ: ${(knowledgeProfile.problemSolvingProcess || []).join(' -> ')}
LỖI HAY GẶP CẦN KHẮC PHỤC TRONG TRUYỆN: ${(knowledgeProfile.commonMisconceptions || []).join(' | ')}

HẠT NHÂN CÂU CHUYỆN:
- Vấn đề: ${storyKernel.problemStatement}
- Mục tiêu: ${storyKernel.goal}
- Trở ngại: ${storyKernel.obstacles}
- Cao trào: ${storyKernel.climax}
- Giải quyết: ${storyKernel.resolution}
- Kết luận: ${storyKernel.knowledgeConclusion}

NHÂN VẬT (dùng ĐÚNG id và tên các nhân vật này, không tự tạo nhân vật mới): ${characterList || 'Minh (char-minh), Lan (char-lan), Nam (char-nam)'}

CẤU TRÚC 8 CẢNH BẮT BUỘC theo thứ tự: (1) opening - mở đầu bối cảnh, (2) problem - xuất hiện vấn đề, (3) questioning - đặt câu hỏi băn khoăn, (4) hypothesis - thử nghiệm/giả thuyết sai (có thể cài lỗi sai phổ biến ở đây), (5) discovery - khám phá kiến thức đúng (cao trào), (6) application - áp dụng giải quyết vấn đề bằng công thức, (7) result - kết quả thành công có số liệu cụ thể, (8) summary - chốt kiến thức và mở rộng liên hệ thực tế.

Mỗi cảnh cần: sceneName (ngắn gọn), educationalGoal, environmentName (bối cảnh không gian), characters (mảng id nhân vật xuất hiện), actionDescription, dialogue (2-4 câu thoại, dùng đúng characterId/characterName), narration (lời dẫn chuyện), knowledgeAppeared (kiến thức xuất hiện trong cảnh, có thể để trống với cảnh đầu/cuối), emotion (cảm xúc chủ đạo), props (đạo cụ), visualDescription (mô tả hình ảnh tổng quát), videoMotion (gợi ý chuyển động camera), estimatedDurationSec (20-45 giây).`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là biên kịch sư phạm, tuyệt đối giữ đúng kiến thức nguồn, không bịa công thức hay số liệu sai.',
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneName: { type: Type.STRING },
                educationalGoal: { type: Type.STRING },
                environmentName: { type: Type.STRING },
                characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                actionDescription: { type: Type.STRING },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterId: { type: Type.STRING },
                      characterName: { type: Type.STRING },
                      text: { type: Type.STRING },
                      emotion: { type: Type.STRING },
                    },
                    required: ['characterId', 'characterName', 'text'],
                  },
                },
                narration: { type: Type.STRING },
                knowledgeAppeared: { type: Type.STRING },
                emotion: { type: Type.STRING },
                props: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualDescription: { type: Type.STRING },
                videoMotion: { type: Type.STRING },
                estimatedDurationSec: { type: Type.NUMBER },
              },
              required: ['sceneName', 'educationalGoal', 'environmentName', 'characters', 'actionDescription', 'dialogue', 'narration', 'emotion', 'props', 'visualDescription', 'videoMotion', 'estimatedDurationSec'],
            },
          },
        },
      });

      const text = response.text;
      const raw = text ? JSON.parse(text) : [];
      // Enforce exact 8-scene pedagogical structure & valid ids/types regardless of model output
      const scenes = raw.slice(0, 8).map((s: any, idx: number) => {
        const sceneNum = idx + 1;
        const sceneId = `SC${sceneNum < 10 ? `0${sceneNum}` : sceneNum}`;
        return {
          sceneId,
          sceneNumber: sceneNum,
          sceneType: COMIC_SCENE_TYPES[idx] || 'summary',
          sceneName: s.sceneName || `Cảnh ${sceneNum}`,
          educationalGoal: s.educationalGoal || '',
          environmentId: `env-${sceneId.toLowerCase()}`,
          environmentName: s.environmentName || 'Lớp học',
          characters: Array.isArray(s.characters) && s.characters.length > 0 ? s.characters : (characters[0] ? [characters[0].id] : ['char-minh']),
          actionDescription: s.actionDescription || '',
          dialogue: Array.isArray(s.dialogue) ? s.dialogue : [],
          narration: s.narration || '',
          knowledgeAppeared: s.knowledgeAppeared || '',
          emotion: s.emotion || 'Hào hứng',
          props: Array.isArray(s.props) ? s.props : [],
          visualDescription: s.visualDescription || s.actionDescription || '',
          videoMotion: s.videoMotion || 'Camera tĩnh, lia nhẹ',
          estimatedDurationSec: Number(s.estimatedDurationSec) || 30,
          frames: [],
        };
      });

      res.json({ success: true, scenes });
    } catch (error: any) {
      console.error('Comic Generate Script Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo kịch bản' });
    }
  });

  // 9f. AI Edit Single Scene (6 specialized actions used by Step 4 Script Editor)
  app.post('/api/comic/ai-edit-scene', async (req, res) => {
    try {
      const { action, scene, knowledgeProfile } = req.body;
      if (!action || !scene) return res.status(400).json({ error: 'Thiếu action hoặc scene' });

      const actionInstructions: Record<string, string> = {
        rewrite: 'Viết lại narration và dialogue của cảnh này theo cách khác, sinh động hơn nhưng GIỮ NGUYÊN kiến thức, nhân vật và ý nghĩa sư phạm.',
        shorten: 'Rút gọn narration và dialogue của cảnh này còn khoảng 60% độ dài, giữ đủ ý chính. Giảm estimatedDurationSec tương ứng (tối thiểu 8 giây).',
        humor: 'Thêm 1 câu thoại hài hước, dí dỏm phù hợp lứa tuổi THCS vào cuối mảng dialogue hiện có, KHÔNG xóa các câu thoại cũ, không làm sai lệch kiến thức.',
        grade6: 'Đơn giản hóa ngôn ngữ, ví dụ và narration cho phù hợp học sinh lớp 6 (dễ hiểu hơn, câu ngắn hơn), vẫn giữ đúng bản chất kiến thức.',
        grade9: 'Nâng cấp độ sâu kiến thức, ngôn ngữ trong narration và dialogue cho phù hợp học sinh lớp 9 (tư duy trừu tượng hơn), vẫn dựa trên cùng kiến thức gốc.',
        knowledgeCheck: 'Kiểm tra độ chính xác kiến thức trong cảnh này so với hồ sơ kiến thức bài học, sửa lại bất kỳ chi tiết/công thức/số liệu nào SAI hoặc GÂY HIỂU LẦM. Nếu không có lỗi, giữ nguyên nội dung.',
      };

      const instruction = actionInstructions[action];
      if (!instruction) return res.status(400).json({ error: 'Hành động AI không hợp lệ' });

      const ai = getGenAI();
      const prompt = `Cảnh truyện tranh giáo dục hiện tại (JSON):
${JSON.stringify(scene)}

${knowledgeProfile ? `HỒ SƠ KIẾN THỨC BÀI HỌC ĐỂ ĐỐI CHIẾU:\n${JSON.stringify(knowledgeProfile)}\n` : ''}
YÊU CẦU CHỈNH SỬA: ${instruction}

Trả về TOÀN BỘ object cảnh đã chỉnh sửa với CÙNG CẤU TRÚC JSON như trên (giữ nguyên sceneId, sceneNumber, sceneType, environmentId, characters, frames và các trường không liên quan tới yêu cầu).`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là trợ lý biên tập kịch bản sư phạm, chỉ chỉnh sửa đúng phần được yêu cầu, không phá vỡ cấu trúc dữ liệu.',
          temperature: 0.75,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      const parsed = text ? JSON.parse(text) : null;
      if (!parsed) throw new Error('AI không trả về dữ liệu hợp lệ.');
      // Merge over original scene to guard against missing/renamed fields from the model
      const updatedScene = { ...scene, ...parsed };
      res.json({ success: true, updatedScene });
    } catch (error: any) {
      console.error('Comic AI Edit Scene Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi chỉnh sửa cảnh bằng AI' });
    }
  });

  // 9g. AI Generate Storyboard Frames for a Scene
  app.post('/api/comic/generate-storyboard', async (req, res) => {
    try {
      const { scene, characters = [], knowledgeProfile, frameCount = 3 } = req.body;
      if (!scene) return res.status(400).json({ error: 'Thiếu thông tin cảnh' });

      const ai = getGenAI();
      const characterDetails = characters
        .filter((c: any) => (scene.characters || []).includes(c.id))
        .map((c: any) => `- ${c.name} (id: ${c.id}): ${c.appearance}; trang phục: ${c.outfit}; màu nhận diện: ${c.signatureColor}`)
        .join('\n');

      const prompt = `Chia cảnh truyện tranh sau thành ĐÚNG ${frameCount} khung tranh (frame) kế tiếp nhau, mỗi khung là 1 khoảnh khắc hình ảnh cụ thể.

CẢNH: ${scene.sceneName} (${scene.sceneId})
Mục tiêu sư phạm: ${scene.educationalGoal}
Bối cảnh: ${scene.environmentName}
Hành động: ${scene.actionDescription}
Lời dẫn: ${scene.narration}
Hội thoại: ${(scene.dialogue || []).map((d: any) => `${d.characterName}: "${d.text}"`).join(' | ')}
Kiến thức xuất hiện: ${scene.knowledgeAppeared}
Công thức liên quan (nếu có, dùng LaTeX chuẩn): ${(knowledgeProfile?.formulas || []).join(' | ')}

NHÂN VẬT TRONG CẢNH (PHẢI giữ đúng ngoại hình/trang phục mô tả để nhất quán xuyên suốt):
${characterDetails || 'Không có nhân vật cụ thể'}

Mỗi khung cần:
- title: tiêu đề ngắn của khung.
- characterIds: mảng id nhân vật xuất hiện trong khung (chỉ dùng id có sẵn ở trên).
- backgroundName: mô tả bối cảnh cụ thể của khung.
- visualAction: mô tả chính xác hành động/tư thế nhân vật trong khung.
- captionText: caption ngắn (có thể để trống).
- speechBubbles: mảng bong bóng thoại {characterId, characterName, text, type: "speech"|"thought"|"shout"|"whisper"} lấy từ hội thoại của cảnh, phân bổ hợp lý qua các khung.
- illustrationSceneType: chọn đúng 1 giá trị trong danh sách [${COMIC_ILLUSTRATION_TYPES.join(', ')}] phù hợp nhất với bối cảnh khung.
- promptDetails: { character, environment, action, camera (góc máy), composition (bố cục), lighting (ánh sáng), emotion, educationalObject (đối tượng kiến thức xuất hiện), artStyle: "2D modern educational comic, consistent character design", consistencyInfo: mô tả ngắn để AI vẽ giữ đúng đặc điểm nhân vật, fullPrompt (prompt đầy đủ tiếng Anh để tạo ảnh), videoPrompt (prompt mô tả chuyển động camera bằng tiếng Anh) }.`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là đạo diễn storyboard truyện tranh giáo dục, luôn giữ nhất quán nhân vật, bối cảnh và chính xác kiến thức.',
          temperature: 0.75,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                characterIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                backgroundName: { type: Type.STRING },
                visualAction: { type: Type.STRING },
                captionText: { type: Type.STRING },
                speechBubbles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterId: { type: Type.STRING },
                      characterName: { type: Type.STRING },
                      text: { type: Type.STRING },
                      type: { type: Type.STRING },
                    },
                    required: ['characterId', 'characterName', 'text'],
                  },
                },
                illustrationSceneType: { type: Type.STRING },
                promptDetails: {
                  type: Type.OBJECT,
                  properties: {
                    character: { type: Type.STRING },
                    environment: { type: Type.STRING },
                    action: { type: Type.STRING },
                    camera: { type: Type.STRING },
                    composition: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                    emotion: { type: Type.STRING },
                    educationalObject: { type: Type.STRING },
                    artStyle: { type: Type.STRING },
                    consistencyInfo: { type: Type.STRING },
                    fullPrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                  },
                  required: ['character', 'environment', 'action', 'camera', 'composition', 'lighting', 'emotion', 'educationalObject', 'artStyle', 'consistencyInfo', 'fullPrompt', 'videoPrompt'],
                },
              },
              required: ['title', 'characterIds', 'backgroundName', 'visualAction', 'speechBubbles', 'illustrationSceneType', 'promptDetails'],
            },
          },
        },
      });

      const text = response.text;
      const raw = text ? JSON.parse(text) : [];
      const frames = raw.slice(0, frameCount).map((f: any, idx: number) => {
        const frameNum = idx + 1;
        const frameId = `${scene.sceneId}-F0${frameNum}`;
        const validIllustration = COMIC_ILLUSTRATION_TYPES.includes(f.illustrationSceneType)
          ? f.illustrationSceneType
          : 'classroom_board';
        return {
          frameId,
          sceneId: scene.sceneId,
          frameNumber: frameNum,
          title: f.title || `Khung ${frameNum}`,
          characterIds: Array.isArray(f.characterIds) && f.characterIds.length > 0 ? f.characterIds : (scene.characters || []),
          backgroundId: `bg-${frameId.toLowerCase()}`,
          backgroundName: f.backgroundName || scene.environmentName,
          visualAction: f.visualAction || scene.actionDescription,
          speechBubbles: (Array.isArray(f.speechBubbles) ? f.speechBubbles : []).map((sb: any, sbIdx: number) => ({
            id: `sb-${frameId}-${sbIdx}`,
            characterId: sb.characterId,
            characterName: sb.characterName,
            text: sb.text,
            position: { x: 30 + sbIdx * 20, y: 20 },
            type: ['speech', 'thought', 'shout', 'whisper'].includes(sb.type) ? sb.type : 'speech',
          })),
          captionText: f.captionText || '',
          promptDetails: f.promptDetails,
          illustrationSceneType: validIllustration,
          status: 'pending',
          audioTracks: {
            narrationText: idx === 0 ? scene.narration : '',
            dialogueLines: (Array.isArray(f.speechBubbles) ? f.speechBubbles : []).map((sb: any) => ({
              characterId: sb.characterId,
              text: sb.text,
              durationSec: Math.max(2, Math.round((sb.text || '').length / 12)),
            })),
            durationSec: Math.max(4, Math.round(scene.estimatedDurationSec / frameCount)),
          },
        };
      });

      res.json({ success: true, frames });
    } catch (error: any) {
      console.error('Comic Generate Storyboard Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi tạo storyboard' });
    }
  });

  // 9h. AI Quality Check: Pedagogical accuracy + Visual/Character Consistency Audit
  app.post('/api/comic/quality-check', async (req, res) => {
    try {
      const { knowledgeProfile, characters = [], scenes = [] } = req.body;
      if (!knowledgeProfile || !scenes.length) {
        return res.status(400).json({ error: 'Thiếu dữ liệu để kiểm tra chất lượng' });
      }

      const ai = getGenAI();
      const characterNames = characters.map((c: any) => c.name).join(', ');
      const sceneSummaries = scenes
        .map(
          (s: any) =>
            `${s.sceneId} (${s.sceneName}): kiến thức="${s.knowledgeAppeared}"; lời dẫn="${s.narration}"; số khung=${(s.frames || []).length}`
        )
        .join('\n');

      const prompt = `Kiểm tra chất lượng bộ truyện tranh giáo dục sau trước khi xuất bản cho học sinh THCS.

BÀI HỌC: ${knowledgeProfile.lessonTitle} (${knowledgeProfile.subject} - ${knowledgeProfile.grade})
KIẾN THỨC GỐC CẦN ĐỐI CHIẾU: ${(knowledgeProfile.coreKnowledge || []).join(' | ')}
CÔNG THỨC GỐC: ${(knowledgeProfile.formulas || []).join(' | ')}
NHÂN VẬT: ${characterNames}

DANH SÁCH CẢNH:
${sceneSummaries}

Hãy đánh giá và trả về:
1. gradeLevelAppropriate: nội dung có phù hợp lứa tuổi THCS không.
2. mathematicalAccuracy: kiến thức/công thức trong các cảnh có khớp với kiến thức gốc không (true/false).
3. conceptClarityScore (0-100): độ rõ ràng khái niệm.
4. engagementScore (0-100): độ hấp dẫn của câu chuyện.
5. comprehensionScore (0-100): khả năng học sinh hiểu và ghi nhớ kiến thức qua truyện.
6. pedagogyRemarks: nhận xét sư phạm tổng quan.
7. suggestions: 3-5 gợi ý cải thiện cụ thể (nếu có).
8. warnings: cảnh báo nếu có sai lệch kiến thức nghiêm trọng hoặc nội dung không phù hợp (mảng rỗng nếu không có).
9. overallVerdict: kết luận ngắn gọn.
10. approvedForClassroom: có thể dùng ngay trong lớp học không (true/false).`;

      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia thẩm định học liệu sư phạm THCS, đánh giá khách quan, nghiêm túc, ưu tiên an toàn và chính xác kiến thức.',
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              gradeLevelAppropriate: { type: Type.BOOLEAN },
              mathematicalAccuracy: { type: Type.BOOLEAN },
              conceptClarityScore: { type: Type.NUMBER },
              engagementScore: { type: Type.NUMBER },
              comprehensionScore: { type: Type.NUMBER },
              pedagogyRemarks: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              overallVerdict: { type: Type.STRING },
              approvedForClassroom: { type: Type.BOOLEAN },
            },
            required: ['gradeLevelAppropriate', 'mathematicalAccuracy', 'conceptClarityScore', 'pedagogyRemarks', 'suggestions', 'approvedForClassroom'],
          },
        },
      });

      const text = response.text;
      const parsed = text ? JSON.parse(text) : null;
      if (!parsed) throw new Error('AI không trả về dữ liệu hợp lệ.');

      const pedagogicalAudit = {
        ...parsed,
        conceptClarityScore: Number(parsed.conceptClarityScore) || 0,
        engagementScore: Number(parsed.engagementScore) || 0,
        comprehensionScore: Number(parsed.comprehensionScore) || 0,
        auditTimestamp: new Date().toISOString(),
        coreKnowledgePreserved: parsed.mathematicalAccuracy,
        formulasAccurate: parsed.mathematicalAccuracy,
        conceptsCorrect: parsed.mathematicalAccuracy,
      };

      // Lightweight per-frame consistency heuristic (character/prop continuity across the scene)
      const frameChecks: any[] = [];
      scenes.forEach((scene: any) => {
        (scene.frames || []).forEach((frame: any) => {
          const hasValidCharacters = (frame.characterIds || []).every((id: string) =>
            characters.some((c: any) => c.id === id)
          );
          const hasPromptDetails = !!frame.promptDetails?.fullPrompt;
          const score = (hasValidCharacters ? 50 : 20) + (hasPromptDetails ? 50 : 20);
          frameChecks.push({
            frameId: frame.frameId,
            consistencyCheck: {
              characterScore: hasValidCharacters ? 95 : 60,
              sceneScore: hasPromptDetails ? 90 : 65,
              objectScore: 90,
              accuracyScore: pedagogicalAudit.mathematicalAccuracy ? 95 : 60,
              continuityScore: 90,
              feedback: hasValidCharacters && hasPromptDetails
                ? 'Khung tranh nhất quán nhân vật và đầy đủ thông tin dựng hình.'
                : 'Khung tranh thiếu thông tin nhân vật hoặc prompt dựng hình, nên tạo lại storyboard.',
              passed: score >= 80,
            },
          });
        });
      });

      res.json({ success: true, pedagogicalAudit, frameChecks });
    } catch (error: any) {
      console.error('Comic Quality Check Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi kiểm tra chất lượng' });
    }
  });

  // 9i. AI Video (Veo): bắt đầu tạo video chuyển động thật từ ảnh khung hình
  // — chỉ dùng cho những khung giáo viên đánh dấu "cần chuyển động thực sự",
  // các khung còn lại vẫn dùng hiệu ứng Ken Burns (zoom/pan) khi xuất video.
  app.post('/api/comic/generate-frame-video/start', async (req, res) => {
    try {
      const { imageBase64 = '', mimeType = 'image/png', prompt = '', durationSeconds = 6 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: 'Thiếu ảnh khung hình để tạo video.' });

      const cleanBase64 = imageBase64.includes(';base64,') ? imageBase64.split(';base64,')[1] : imageBase64;
      const ai = getGenAI();
      const veoModels = ['veo-3.1-generate-preview', 'veo-3.0-generate-001'];

      let operation: any = null;
      let lastError: any = null;
      let usedModel = '';

      for (const model of veoModels) {
        try {
          operation = await (ai as any).models.generateVideos({
            model,
            prompt:
              prompt ||
              'Gentle cinematic camera motion bringing this educational comic illustration to life, subtle character movement, keep style and composition unchanged',
            image: { imageBytes: cleanBase64, mimeType },
            config: { aspectRatio: '16:9', numberOfVideos: 1, durationSeconds },
          });
          usedModel = model;
          break;
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!operation) throw lastError || new Error('Không thể khởi tạo AI Video lúc này.');
      res.json({ success: true, operationName: operation.name, model: usedModel });
    } catch (error: any) {
      console.error('Comic AI Video Start Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khởi tạo AI Video' });
    }
  });

  // 9j. AI Video (Veo): kiểm tra trạng thái & tải video khi hoàn tất (client gọi lặp lại ~10s/lần)
  app.post('/api/comic/generate-frame-video/status', async (req, res) => {
    let tmpPath = '';
    try {
      const { operationName } = req.body;
      if (!operationName) return res.status(400).json({ error: 'Thiếu operationName' });

      const ai = getGenAI();
      let operation: any = { name: operationName, done: false };
      operation = await (ai as any).operations.getVideosOperation({ operation });

      if (!operation.done) {
        return res.json({ success: true, done: false });
      }

      if (operation.error) {
        return res.json({ success: true, done: true, error: operation.error.message || 'AI Video tạo thất bại.' });
      }

      const generated = operation.response?.generatedVideos?.[0];
      if (!generated?.video) {
        return res.json({ success: true, done: true, error: 'AI không trả về video hợp lệ.' });
      }

      tmpPath = path.join(os.tmpdir(), `veo-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
      await (ai as any).files.download({ file: generated.video, downloadPath: tmpPath });
      const videoBuffer = fs.readFileSync(tmpPath);

      res.json({
        success: true,
        done: true,
        videoBase64: videoBuffer.toString('base64'),
        mimeType: 'video/mp4',
      });
    } catch (error: any) {
      console.error('Comic AI Video Status Error:', error);
      res.status(500).json({ error: error.message || 'Lỗi kiểm tra trạng thái AI Video' });
    } finally {
      if (tmpPath) fs.unlink(tmpPath, () => {});
    }
  });

  // Trên Vercel (biến VERCEL luôn = '1'), KHÔNG chạy Vite/static/listen —
  // Vercel tự lo phần file tĩnh, ta chỉ cần trả về app để làm serverless function.
  if (!process.env.VERCEL) {
    // Vite middleware setup
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// Chỉ tự chạy server khi thực thi trực tiếp ở local (npm run dev),
// không chạy khi Vercel import file này làm serverless function.
if (!process.env.VERCEL) {
  createApp().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}