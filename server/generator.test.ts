import { describe, it, expect } from 'vitest';
import { stripCodeFences, ensureRenderCall, validatePromptLength } from './generator';

describe('validatePromptLength', () => {
  it.each([499, 500])('%i자 프롬프트를 허용한다', (length) => {
    expect(validatePromptLength('가'.repeat(length))).toBe(true);
  });

  it('501자 프롬프트를 거절한다', () => {
    expect(validatePromptLength('가'.repeat(501))).toBe(false);
  });

  it('이모지도 코드 포인트 하나를 한 글자로 센다', () => {
    expect(validatePromptLength('😀'.repeat(500))).toBe(true);
  });

  it('이모지를 포함해 501자를 넘으면 거절한다', () => {
    expect(validatePromptLength('가'.repeat(500) + '😀')).toBe(false);
  });
});

describe('stripCodeFences', () => {
  it('언어 태그가 붙은 코드펜스를 제거한다', () => {
    const input = '```tsx\nconst A = () => null;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => null;');
  });

  it('언어 태그 없는 코드펜스도 제거한다', () => {
    const input = '```\nconst A = 1;\n```';
    expect(stripCodeFences(input)).toBe('const A = 1;');
  });

  it('펜스가 없으면 앞뒤 공백만 정리해 그대로 반환한다', () => {
    expect(stripCodeFences('  const A = 1;  ')).toBe('const A = 1;');
  });
});

describe('ensureRenderCall', () => {
  it('이미 render() 호출이 있으면 그대로 둔다', () => {
    const code = 'const Card = () => null;\nrender(<Card />);';
    expect(ensureRenderCall(code)).toBe(code);
  });

  it('const 컴포넌트 선언에 render 호출을 주입한다', () => {
    const code = 'const Card = () => null;';
    expect(ensureRenderCall(code)).toBe(`${code}\n\nrender(<Card />);`);
  });

  it('function 선언 컴포넌트에도 render 호출을 주입한다', () => {
    const code = 'function Widget() { return null; }';
    expect(ensureRenderCall(code)).toContain('render(<Widget />);');
  });

  it('대문자로 시작하는 컴포넌트 선언이 없으면 원본을 그대로 반환한다', () => {
    const code = 'const value = 42;';
    expect(ensureRenderCall(code)).toBe(code);
  });
});
