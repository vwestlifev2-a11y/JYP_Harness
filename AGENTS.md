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

- 서버 환경변수의 키 원문을 클라이언트 응답이나 번들에 노출하지 않는다. `/api/config`는 키 존재 여부만 반환한다. `.env`를 추적 대상으로 추가하지 않는다. 근거: `server/index.ts:59`, `server/index.ts:147`, `.gitignore:32`.
- 생성 코드는 앱 소스와 별도 실행 계약을 가진다. 시스템 프롬프트, 응답 정규화, `react-live` 설정을 바꿀 때 세 지점의 호환성을 함께 확인한다. 근거: `server/index.ts:10`, `server/index.ts:188`, `src/components/LivePreview.tsx:14`.

### Do's & Don'ts

- 제공자 경로를 합칠 때 Google 전용 폴백과 출력 잘림 처리를 누락하지 않는다. 현재 비대칭이 과거 장애 때문이라고 추정하지 않는다. 근거: `server/index.ts:68`, `server/index.ts:123`, `server/index.ts:134`.
- 입력 UI의 사전 차단을 이유로 서버의 프롬프트·키 검증을 제거하지 않는다. UI 밖에서도 API를 호출할 수 있다. 근거: `src/components/PromptInput.tsx:22`, `src/App.tsx:34`, `server/index.ts:169`, `server/index.ts:176`.
- 기존 테스트 통과를 실제 AI 호출이나 미리보기 실행의 검증으로 보고하지 않는다. 현재 테스트 경계는 정규화, 폴백, 입력 UI이다. 근거: `server/generator.test.ts:2`, `server/fallback.test.ts:2`, `src/components/PromptInput.test.tsx:4`, `vite.config.ts:20`.

## Project Context

사용자의 UI 요청을 실행 가능한 컴포넌트와 복사 가능한 코드로 연결한다. 제품 소개와 설치 안내는 [README](README.md)를 참조한다.

기술: React 19, TypeScript 5.9, Vite 8, Bun, react-live 4, Vitest 4.

## Standards & References

- 타입만 가져올 때 `import type`을 사용한다. 기존 TypeScript 엄격 옵션을 완화해 오류를 숨기지 않는다. 근거: `src/App.tsx:5`, `tsconfig.app.json:12`, `tsconfig.app.json:22`.
- 커밋, 커밋해줘, Git 변경사항 저장 요청 시 [commit 스킬](.agents/skills/commit/SKILL.md)을 따른다. 논리적 범위와 `feat/fix/refactor/chore: 한국어 요약` 메시지를 제안한 뒤 사용자 승인 후 커밋한다. 일반 파일 저장과 스킬 작성은 커밋 요청으로 해석하지 않는다.
- 커밋 요청은 `react-component-generator-main` 작업 저장소와 그 안의 `harnes_engineering/` 저장소를 모두 대상으로 한다. 내부 저장소에서 작업 중이면 상위 작업 저장소도 함께 확인한다. 이 두 저장소를 포함할지 매번 다시 묻지 않는다.
- 공유 변경은 두 저장소에 동기화하고 저장소별 diff·스테이징을 확인한다. 기존 변경과 충돌하면 임의로 덮어쓰지 않는다. `.git`, `.env`, 설치·빌드 산출물을 복사하거나 상위 저장소에 내부 저장소의 gitlink를 추가하지 않는다.
- 두 저장소의 범위·메시지를 하나의 계획으로 제시하고 한 번의 승인으로 각각 커밋한다. 변경 없는 저장소에는 빈 커밋을 만들지 않고, 완료 시 저장소별 해시와 남은 변경사항을 보고한다.
- 규칙과 코드의 괴리가 발생하면 업데이트를 제안한다. 명령, API 계약, 테스트 경계를 바꿀 때 근거 파일·라인과 관련 지침도 갱신한다.
- 각 `AGENTS.md`는 500줄 미만으로 유지한다. 수정한 규칙 파일의 같은 디렉터리 `CLAUDE.md`에는 `@AGENTS.md` 연결을 유지한다.

## Context Map

- **[화면·상태·미리보기 수정](src/AGENTS.md)** — React 동작, 생성 결과 관리, UI 검증 시 적용한다.
- **[AI 호출·API·코드 정규화 수정](server/AGENTS.md)** — Bun 런타임과 제공자 응답 처리를 변경할 때 적용한다.
