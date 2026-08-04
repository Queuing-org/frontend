# Dependency 변경 후 pnpm lockfile 누락으로 인한 Vercel 실패

## Problem

PR #32의 commit `4bee753`은 GitHub Actions의 lint/test/build를 통과했지만 Vercel preview가 dependency install 단계에서 즉시 실패했다.

## Previous Behavior

`canvas-confetti`와 타입 패키지를 `npm install`로 추가해 `package.json`과 `package-lock.json`만 갱신했다. 저장소에 함께 추적되는 `pnpm-lock.yaml`은 변경하지 않았다.

## Previous Code

```text
package.json: canvas-confetti, @types/canvas-confetti 추가
package-lock.json: 두 패키지 추가
pnpm-lock.yaml: 변경 없음
```

## Updated Code

```text
pnpm install --lockfile-only
pnpm install --frozen-lockfile
```

## Problem in the Previous Code

로컬과 GitHub Actions는 npm 기반 검증을 통과했지만 Vercel은 저장소의 `pnpm-lock.yaml`을 감지해 pnpm 10 frozen install을 실행한다. 따라서 npm lock만 최신이어도 배포 환경에서는 package specifier 불일치로 설치가 중단된다.

## Evidence

- GitHub Actions `Lint, test, and build`: success
- Vercel deployment `dpl_3iKUBrWmbErqGnZ8WCxdvxieVWCd`: failure
- Vercel log: `ERR_PNPM_OUTDATED_LOCKFILE`
- mismatch: `canvas-confetti@^1.9.4`, `@types/canvas-confetti@^1.9.0`
- `pnpm install --frozen-lockfile`: lockfile 동기화 후 pass

## Cause or Remaining Hypotheses

확정 원인은 dependency 변경 시 추적 중인 `pnpm-lock.yaml`을 갱신하지 않은 것이다. 애플리케이션 compile 오류는 아니었다.

## Solution Options

- npm lock만 유지하고 Vercel package manager를 npm으로 강제한다.
- pnpm lock을 삭제해 package manager를 하나로 정리한다.
- 현재 저장소 정책을 유지하되 dependency 변경 시 두 lockfile을 모두 동기화하고 deployer와 같은 frozen install을 검증한다.

## Chosen Solution and Rationale

이번 기능 범위에서 package manager 정책 자체를 바꾸지 않고 두 lockfile을 동기화했다. package manager 단일화는 별도 합의와 CI/Vercel 설정 변경이 필요한 구조 변경이라 이번 수정에 섞지 않았다.

## Result

`pnpm-lock.yaml`에 새 dependency specifier와 resolution을 기록했고 frozen install이 통과했다. fix commit `caf7669`의 Vercel preview와 GitHub Actions가 모두 통과했다.

## Reusable Rule

`package.json`이 바뀌면 저장소에 추적되는 모든 lockfile을 동기화하고, 실제 배포 환경이 선택하는 package manager의 frozen install을 push 전에 실행한다.

## Skill or Team Spec Updates

- skill updated: `queuing-feature-delivery`의 publish gate에 dual-lockfile 확인을 추가했다.
- team spec updated: 없음.

## Verification

- `pnpm install --frozen-lockfile`: pass
- 후속 `npm run lint`: pass
- 후속 `npm run test`: 51 files / 125 tests pass
- 후속 `npm run build`: pass
- fix head Vercel preview: pass
- fix head GitHub Actions `Lint, test, and build`: pass
- residual risk: npm/pnpm lock 동시 추적 자체는 유지되므로 package manager 단일화 전까지 두 lock 동기화가 필요하다.
