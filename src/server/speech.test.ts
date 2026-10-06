import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { speechBaseUrl, speechHealth, synthesizeSpeech, transcribeAudio } from './speech';

let server: Server;
let base = '';
const seen: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.setEncoding('latin1');
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      seen.push(`${req.method} ${req.url} ${req.headers['content-type'] ?? ''}`);
      if (req.url === '/health')
        return res.end(JSON.stringify({ stt: true, tts: { id: true, en: false } }));
      if (req.url === '/stt') {
        const language = /name="language"\r\n\r\n(\w+)/.exec(body)?.[1];
        return res.end(JSON.stringify({ text: ` halo dari ${language} ` }));
      }
      if (req.url === '/tts') {
        res.setHeader('content-type', 'audio/wav');
        return res.end(Buffer.from('RIFF....WAVE'));
      }
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('speech service client', () => {
  it('is disabled without SPEECH_URL', async () => {
    expect(speechBaseUrl({})).toBe('');
    expect(await speechHealth('')).toEqual({ stt: false, tts: { id: false, en: false } });
  });

  it('reads per-language availability', async () => {
    expect(await speechHealth(base)).toEqual({ stt: true, tts: { id: true, en: false } });
  });

  it('uploads audio as multipart with the language', async () => {
    const text = await transcribeAudio(
      new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }),
      'id',
      base,
    );
    expect(text).toBe('halo dari id');
    expect(seen.some((line) => line.startsWith('POST /stt multipart/form-data'))).toBe(true);
  });

  it('streams synthesized audio back', async () => {
    const response = await synthesizeSpeech('Om Swastiastu', 'id', base);
    expect(response.headers.get('content-type')).toBe('audio/wav');
    expect(await response.text()).toBe('RIFF....WAVE');
  });

  it('falls back when the service is down', async () => {
    expect((await speechHealth('http://127.0.0.1:9')).stt).toBe(false);
  });
});
