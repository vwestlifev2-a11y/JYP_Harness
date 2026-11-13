# 프로젝트 에이전트 지침

## Operational Commands

현재 저장소 루트에서 실행한다. Bun과 기존 `bun.lock`을 사용하고, 다른 패키지 관리자의 잠금 파일을 추가하지 않는다.

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run lint
bun run test
bun run test:watch
```

- 테스트는 `bun run test`로 Vitest를 실행한다. Bun 내장 테스트 러너의 `bun test`로 대체하지 않는다. 근거: `package.json:12`, `vite.config.ts:16`.
- `bun run build`는 서버 타입 검사를 포함하지 않는다. 서버 수정 시 [서버 검증 절차](server/AGENTS.md#testing-strategy)를 별도로 적용한다. 근거: `package.json:9`, `tsconfig.app.json:27`, `tsconfig.node.json:25`.
- `bun run preview`는 정적 프론트엔드 확인용이다. 개발용 `/api` 프록시는 `server` 설정에만 있으므로 API 연동 검증은 `bun run dev`로 수행한다. 근거: `package.json:11`, `vite.config.ts:8`.

## Golden Rules

### Immutable

- 서버 환경변수의 키 원문을 클라이언트 응답이나 번들에 노출하지 않는다. `/api/config`는 키 존재 여부만 반환한다. `.env`를 추적 대상으로 추가하지 않는다. 근거: `server/index.ts:59`, `server/index.ts:147`, `.gitignore:46`.
- 생성 코드는 앱 소스와 별도 실행 계약을 가진다. 시스템 프롬프트, 응답 정규화, `react-live` 설정을 바꿀 때 세 지점의 호환성을 함께 확인한다. 근거: `server/index.ts:10`, `server/index.ts:195`, `src/components/LivePreview.tsx:14`.

### Do's & Don'ts

- 제공자 경로를 합칠 때 Google 전용 폴백과 출력 잘림 처리를 누락하지 않는다. 현재 비대칭이 과거 장애 때문이라고 추정하지 않는다. 근거: `server/index.ts:68`, `server/index.ts:123`, `server/index.ts:134`.
- 입력 UI의 사전 차단을 이유로 서버의 프롬프트·키 검증을 제거하지 않는다. UI 밖에서도 API를 호출할 수 있다. 근거: `src/components/PromptInput.tsx:22`, `src/App.tsx:34`, `server/index.ts:169`, `server/index.ts:176`.
- 기존 테스트 통과를 실제 AI 호출이나 미리보기 실행의 검증으로 보고하지 않는다. 현재 테스트 경계는 정규화, 폴백, 입력 UI, 외부 호출을 모킹한 API 길이 검증이다. 근거: `server/generator.test.ts:2`, `server/fallback.test.ts:2`, `src/components/PromptInput.test.tsx:4`, `server/api.test.ts:39`, `vite.config.ts:20`.

## TDD Rule

**이 규칙은 Rigid — 상황에 맞게 변형하지 마라.**

### 적용 기준

- **반드시 적용:** 비즈니스 로직, API, 유틸리티, 버그 수정. 버그 수정은 해당 버그를 재현하는 실패 테스트부터 작성한다.
- **불필요:** 타입 정의, 설정 파일, 순수 UI(레이아웃·스타일), SQL.
- 한 작업에 두 범주가 섞이면 **동작을 구현하는 부분에는 TDD를 적용**한다. UI 안의 상태 전이·검증·계산을 순수 UI로 분류하지 않는다.

### RED-GREEN-REFACTOR

1. **RED — 실패 테스트 작성**
   - **하나의 동작 = 하나의 테스트.** 원하는 입력과 관찰 가능한 결과를 명시한다.
   - 테스트를 **반드시 실행하여 실패를 확인**한다. 확인 전에는 프로덕션 코드를 작성하지 않는다.
   - 실패 이유는 **기능 미구현**이어야 한다. 버그 수정에서는 기대 동작이 구현되지 않아 재현되는 실패여야 한다. 문법 오류, 오타, 환경 문제는 먼저 바로잡고 다시 실행한다.
2. **GREEN — 최소 구현**
   - 실패 테스트를 통과시키는 **최소한의 코드만** 작성한다.
   - **YAGNI:** 현재 테스트가 요구하지 않는 기능·추상화·확장성을 추가하지 않는다.
   - **신규 테스트와 기존 테스트를 모두 실행하여 통과를 확인**한다.
3. **REFACTOR — 동작 유지 정리**
   - 중복 제거, 이름 개선, 헬퍼 추출로 구조만 정리한다.
   - 변경 중에도 테스트를 실행해 **GREEN을 유지**한다.
   - **새 동작 추가 금지.** 동작 변경이 필요하면 먼저 다음 RED를 작성한다.
4. **반복:** 다음 동작의 **RED로 돌아간다.** 여러 동작을 미리 구현하지 않는다.

### 삭제 강제 규칙

- TDD 적용 대상에서 **테스트보다 프로덕션 코드를 먼저 작성했다면 해당 선행 구현을 삭제하고 RED부터 재시작**한다.
- **"참고용"으로 남기는 것도 금지**한다. 주석 처리나 별도 파일 보관으로 우회하지 않는다.

### 변명 차단표

| 변명 | 반론 |
| --- | --- |
| "너무 단순해서 테스트 불필요" | 적용 여부는 복잡도가 아니라 **적용 기준**으로 판단한다. 단순하면 작은 실패 테스트부터 작성한다. |
| "나중에 추가하겠다" | 사후 테스트는 TDD가 아니다. **지금 RED부터** 시작한다. |
| "시간이 없다" | 구현 범위를 줄인다. **실패 확인과 회귀 검증을 생략하지 않는다.** |
| "삭제하면 낭비" | 선행 구현을 보존하는 것은 규칙 우회다. **삭제하고 실패 테스트부터 다시 구현한다.** |
| "프로토타입이다" | 프로토타입도 적용 대상이면 예외가 아니다. **검증할 동작을 작게 잡아 사이클을 지킨다.** |

### 하위 디렉터리 규칙 우선

이 섹션은 **프로젝트 전역 기본값(fallback)**이다. 작업 대상 하위 디렉터리의 `AGENTS.md`에 **별도 TDD 규칙이 있으면 그 규칙을 우선**한다. 별도 규칙이 없으면 이 섹션을 적용한다.

## Project Context

사용자의 UI 요청을 실행 가능한 컴포넌트와 복사 가능한 코드로 연결한다. 제품 소개와 설치 안내는 [README](README.md)를 참조한다.

기술: React 19, TypeScript 5.9, Vite 8, Bun, react-live 4, Vitest 4.

## Standards & References

- 타입만 가져올 때 `import type`을 사용한다. 기존 TypeScript 엄격 옵션을 완화해 오류를 숨기지 않는다. 근거: `src/App.tsx:5`, `tsconfig.app.json:12`, `tsconfig.app.json:22`.
- 커밋, 커밋해줘, Git 변경사항 저장 요청 시 [commit 스킬](.agents/skills/commit/SKILL.md)을 따른다. 논리적 범위와 `feat/fix/refactor/chore: 한국어 요약` 메시지를 제안한 뒤 사용자 승인 후 커밋한다. 일반 파일 저장과 스킬 작성은 커밋 요청으로 해석하지 않는다.
- PR 생성 요청 시 [create-pr 스킬](.agents/skills/create-pr/SKILL.md)을 따른다. 전담 서브 에이전트가 대상 프로젝트의 기여 언어에 맞는 템플릿을 선택해 PR을 생성한다. 스킬 작성 요청만으로 PR을 생성하지 않는다.
- 커밋 요청은 `react-component-generator-main` 작업 저장소와 그 안의 `harnes_engineering/` 저장소를 모두 대상으로 한다. 내부 저장소에서 작업 중이면 상위 작업 저장소도 함께 확인한다. 이 두 저장소를 포함할지 매번 다시 묻지 않는다.
- 공유 변경은 두 저장소에 동기화하고 저장소별 diff·스테이징을 확인한다. 기존 변경과 충돌하면 임의로 덮어쓰지 않는다. `.git`, `.env`를 복사하거나 상위 저장소에 내부 저장소의 gitlink를 추가하지 않는다.
- 사용자 지정 저장 범위: 다음 커밋부터 설치된 의존성 `node_modules/`와 빌드 산출물 `dist/`, `dist-ssr/`도 존재하는 경우 두 저장소에 동기화하고 커밋 범위에 포함한다. `.env`는 계속 제외하고 내용을 출력하지 않는다.
- 두 저장소의 범위·메시지를 하나의 계획으로 제시하고 한 번의 승인으로 각각 커밋한다. 변경 없는 저장소에는 빈 커밋을 만들지 않고, 완료 시 저장소별 해시와 남은 변경사항을 보고한다.
- 규칙과 코드의 괴리가 발생하면 업데이트를 제안한다. 명령, API 계약, 테스트 경계를 바꿀 때 근거 파일·라인과 관련 지침도 갱신한다.
- 각 `AGENTS.md`는 500줄 미만으로 유지한다. 수정한 규칙 파일의 같은 디렉터리 `CLAUDE.md`에는 `@AGENTS.md` 연결을 유지한다.

## Context Map

- **[화면·상태·미리보기 수정](src/AGENTS.md)** — React 동작, 생성 결과 관리, UI 검증 시 적용한다.
- **[AI 호출·API·코드 정규화 수정](server/AGENTS.md)** — Bun 런타임과 제공자 응답 처리를 변경할 때 적용한다.
