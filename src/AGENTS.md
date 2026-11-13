# 프론트엔드 지침

## Module Context

프롬프트 입력과 생성 결과의 상태를 관리하고 서버가 반환한 코드를 실행·표시한다. AI 요청은 `/api` 경유로 수행한다.

## Tech Stack & Constraints

React 19, TypeScript 5.9, react-live 4, Testing Library, jsdom.

- 앱 코드는 TSX지만 생성된 코드 문자열은 별도의 JavaScript/JSX 실행 형식이다.
- 스타일 검증은 실제 브라우저에서 한다. Vitest 설정은 CSS를 비활성화한다. 근거: `../vite.config.ts:19`.

## Implementation Patterns

- 네트워크 요청과 결과 목록 변경은 `useComponentGenerator`의 흐름에 맞춘다. 새 결과는 목록 앞에 추가하고 오류는 반환 상태로 전달한다. 근거: `hooks/useComponentGenerator.ts:18`, `hooks/useComponentGenerator.ts:42`.
- 새 컴포넌트의 props는 기존과 같이 명시적으로 선언하고, 공유 데이터 형식은 `types/index.ts`를 기준으로 맞춘다.
- UI 테스트는 대상 옆의 `*.test.tsx`에서 역할·접근 가능한 이름으로 조회하고 `userEvent`로 조작한다. 공통 DOM 정리는 `test/setup.ts:6`에 있다.

## Testing Strategy

저장소 루트에서 실행한다.

```sh
bun run test src
```

- 기존 입력 테스트는 빈 입력 차단, 생성 콜백, 로딩 중 비활성화를 확인한다. 입력 흐름 수정 시 이 경계를 유지한다. 근거: `components/PromptInput.test.tsx:6`.
- 생성 요청·미리보기 흐름을 수정했다면 필요한 범위에서 fetch를 모킹하거나 실제 브라우저로 확인하고 검증 방식을 구분해 보고한다. 자동 테스트가 이 전체 흐름을 보장한다고 주장하지 않는다.
- 레이아웃 수정은 데스크톱·모바일 폭에서, 상호작용 수정은 키보드 포커스와 관련 로딩·오류 상태에서 확인한다. 현재 대응 근거: `App.css:44`, `App.css:100`, `App.css:111`, `App.tsx:124`, `App.tsx:155`.

## Local Golden Rules

- `LiveProvider`의 `noInline` 사용 시 생성 코드의 `render(...)` 호출을 전제로 한다. 실행 오류 표시인 `LiveError`를 제거하지 않는다. 근거: `components/LivePreview.tsx:14`, `components/LivePreview.tsx:18`.
- 현재 미리보기는 iframe 격리가 아니다. `LiveProvider`를 보안 샌드박스로 취급하거나 비밀값을 실행 scope에 주입하지 않는다. 근거: `components/LivePreview.tsx:14`.
- 미리보기 새로고침은 `previewKey`를 바꿔 리마운트한다. 이 동작을 재생성 API 호출로 바꾸지 않는다. 재생성은 저장된 프롬프트와 현재 선택한 제공자를 사용해 새 결과를 추가한다. 근거: `components/ComponentCard.tsx:33`, `components/ComponentCard.tsx:41`, `components/ComponentCard.tsx:70`, `App.tsx:38`.
- 제공자를 전환할 때 직접 입력한 API 키를 비운다. 이전 제공자의 키가 다음 요청에 섞이지 않게 한다. 근거: `App.tsx:41`.
- 결과의 `createdAt`은 `Date`이며 렌더링에서 날짜 메서드를 사용한다. 저장·복원 기능을 추가한다면 문자열을 `Date`로 복원한다. 현재 목록은 메모리 상태이므로 영구 저장을 전제로 한 UI를 만들지 않는다. 근거: `types/index.ts:7`, `hooks/useComponentGenerator.ts:14`, `hooks/useComponentGenerator.ts:39`, `components/ComponentCard.tsx:18`.
- 생성 버튼의 `disabled`만 믿고 제출 핸들러의 공백·로딩 검사를 삭제하지 않는다. 단축키 제출도 같은 핸들러를 통과한다. 근거: `components/PromptInput.tsx:22`, `components/PromptInput.tsx:45`, `components/PromptInput.tsx:55`.
