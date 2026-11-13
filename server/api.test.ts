import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let handleRequest: (req: Request) => Promise<Response>;
const callProvider = vi.fn();

beforeAll(async () => {
  // 실제 포트를 열지 않고 Bun에 등록하는 요청 핸들러만 캡처한다.
  vi.stubGlobal('Bun', {
    serve: (options: { fetch: typeof handleRequest }) => {
      handleRequest = options.fetch;
      return { port: 0 };
    },
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('./index');
});

beforeEach(() => {
  callProvider.mockReset();
  callProvider.mockResolvedValue(Response.json({
    content: [{ type: 'text', text: 'const Card = () => null; render(<Card />);' }],
  }));
  vi.stubGlobal('fetch', callProvider);
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function generateRequest(prompt: string, provider = 'anthropic'): Request {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, apiKey: 'test-key', provider }),
  });
}

describe('POST /api/generate 프롬프트 길이 제한', () => {
  it.each(['anthropic', 'google'])('%s에서 501자를 거절하고 AI 제공자를 호출하지 않는다', async (provider) => {
    const response = await handleRequest(generateRequest('가'.repeat(501), provider));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: '프롬프트는 500자 이하로 입력해주세요.' });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(callProvider).not.toHaveBeenCalled();
  });

  it('500자는 AI 제공자에 전달하고 생성 코드를 반환한다', async () => {
    const response = await handleRequest(generateRequest('가'.repeat(500)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ code: 'const Card = () => null; render(<Card />);' });
    expect(callProvider).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(callProvider.mock.calls[0][1].body);
    expect(requestBody.messages[0].content).toBe('가'.repeat(500));
  });
});
