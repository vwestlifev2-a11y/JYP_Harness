# 서버 지침

## Module Context

AI 제공자 호출을 중계하고 응답 코드를 프론트엔드 실행 형식으로 정규화한다. HTTP 진입점은 Bun 런타임을 시작하므로 순수 함수 테스트와 분리한다.

## Tech Stack & Constraints

Bun.serve, TypeScript 5.9, 네이티브 fetch, Vitest 4.

- 테스트 환경은 서버 파일에도 jsdom이다. Vitest에서 `Bun.serve`가 제공된다고 가정하지 않는다. 근거: `../vite.config.ts:17`.
- 외부 호출은 현재 fetch 기반이다. 제공자 SDK 도입은 별도 의존성·호출 계약 변경으로 취급한다.

## Implementation Patterns

- 코드 정규화와 모델 선택 같은 로직은 부수효과 없는 모듈에 둔다. 테스트에서 HTTP 서버를 띄우기 위해 `index.ts`를 import하지 않는다. 근거: `index.ts:138`, `generator.ts:1`, `generator.test.ts:2`, `fallback.test.ts:2`.
- API 성공은 `{ code }`, 실패는 `{ error }`로 응답하며 CORS 헤더를 포함한다. 응답 형식을 바꾸면 클라이언트 파싱도 맞춘다. 근거: `index.ts:188`, `index.ts:208`, `../src/hooks/useComponentGenerator.ts:29`.
- 제공자를 추가하면 서버의 Provider·키 매핑과 클라이언트의 타입·선택 UI를 함께 갱신한다. 근거: `index.ts:57`, `../src/types/index.ts:1`, `../src/App.tsx:8`.

## Testing Strategy

저장소 루트에서 실행한다.

```sh
bun run test server/generator.test.ts server/fallback.test.ts
bunx tsc --noEmit --target ES2023 --module ESNext --moduleResolution bundler --types bun --skipLibCheck server/index.ts server/generator.ts server/fallback.ts
```

- 정규화 테스트는 코드펜스 제거, 기존 render 보존, const/function 선언 보완, 대상 없는 입력을 확인한다. 근거: `generator.test.ts:4`, `generator.test.ts:20`.
- 폴백 테스트는 첫 성공 시 중단, 다음 모델 시도, 마지막 오류 전달, 빈 목록을 확인한다. 네트워크 대신 `attempt` 함수를 주입한다. 근거: `fallback.test.ts:4`.
- HTTP·제공자 응답 처리를 수정하면 fetch 모킹 또는 별도 Bun 통합 검증으로 해당 경로를 확인한다. 순수 함수 테스트만으로 실제 API 호환성을 검증했다고 보고하지 않는다.

## Local Golden Rules

- 정규화 순서 `ensureRenderCall(stripCodeFences(text))`를 유지한다. render가 이미 있으면 중복 삽입하지 않고, 선언을 못 찾으면 원본을 보존한다. 현재 구현은 정규식이며 범용 JSX 파서라고 가정하지 않는다. 근거: `index.ts:188`, `generator.ts:16`.
- 시스템 프롬프트는 import 없는 JavaScript/JSX, 인라인 스타일, `React.*` 훅, 마지막 render를 요구한다. 앱이 TypeScript라는 이유로 생성 코드에 타입 문법을 요구하지 않는다. 근거: `index.ts:10`, `index.ts:14`, `index.ts:20`.
- Google 모델은 목록 순서대로 시도하고 첫 성공에서 중단한다. 모든 실패 시 마지막 오류를 전달한다. 병렬 호출이나 무조건적인 추가 호출로 바꾸지 않는다. 근거: `index.ts:5`, `index.ts:135`, `fallback.ts:11`.
- Google의 `MAX_TOKENS`는 오류로 처리하고 잘린 코드를 성공 결과로 반환하지 않는다. Claude 경로에는 같은 검사가 없으므로 양쪽이 동일하게 보호된다고 가정하지 않는다. 근거: `index.ts:123`, `index.ts:88`.
- 직접 입력한 키가 서버 환경변수보다 우선한다. 오류 처리·로그를 추가할 때 요청 본문과 키가 포함된 Google URL을 그대로 출력하지 않는다. 근거: `index.ts:64`, `index.ts:99`.
- 429·503은 각각 해당 HTTP 상태와 안내 문구로 변환된다. 오류를 모두 500으로 합치지 않는다. 근거: `index.ts:194`, `index.ts:201`.
- 기본 제공자는 API에서 anthropic, UI에서 google로 다르다. 요청의 provider 전달을 제거하거나 기본값을 바꿀 때 양쪽 경로를 확인한다. 근거: `index.ts:161`, `../src/App.tsx:16`, `../src/hooks/useComponentGenerator.ts:26`.
- 서버 포트 3002를 바꾸면 Vite 프록시 대상도 맞춘다. 근거: `index.ts:139`, `../vite.config.ts:11`.
