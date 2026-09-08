# QA Report

## 판정
pass — 독립 read-only QA 완료. 코드/자동 검증에 차단 사항 없음. 실제 브라우저 검증은 아래 제한으로 남김.

## 최종 검증
- `npm run lint`: 통과.
- `npm test -- --maxWorkers=4`: 160개 파일, 713개 테스트 통과(108.24초).
- `npm run build`: 단독 실행 통과. Next.js 16.1.1 Turbopack compile/TypeScript/static generation 완료.
- `git diff --check`: 통과.

## 직접 검증한 회귀
- 검색 API cursor 생략/size8/signal/응답 해제/8개 상한.
- 빈 입력 자동 포커스, 키보드 선택과 URL 변경·선정 이유 보존, 300ms debounce, IME 요청/Enter 차단.
- 검색 교체 시 abort, 역순 응답 미노출, 다른 계정 cache 분리, 미로그인 목록 비활성.
- SoundCloud 선택 차단, 첫 ArrowUp 마지막 지원 행, Escape 두 단계, Tab와 바깥 클릭, quota 자동 반복 없음.
- 로그아웃·탈퇴 mutation 성공 뒤 이전 me 응답이 도착해도 me null 및 검색 cache 제거 유지.
- 개인 큐 모든 페이지에서 현재 entryId만 제외, 같은 영상의 별도 신청 유지, 서버 totalPendingCount 유지, 곡 전환 재계산.
- 친구 room/online/offline 상태 및 알 수 없는 상태, 프로필 기본/축소/높이 제한 자동 테스트.
- 닉네임 participant/queue 전체 페이지, 현재 곡·방장·profile·me, 진행 중 GET 취소 및 후속 cache 응답 보정.
- 다른 방·잘못된 payload·중복·역순 이름 이벤트 무시. 기존 구독 유지, reconnect 시 보정 유지, leave 시 정리.
- 기존/추가 chat 투영에서 원문·내용·삭제 상태·식별자 보존. 기존 채팅 스크롤 테스트를 포함한 전체 suite 통과.

## 독립 리뷰와 수정
- reviewer `qa_review` 초기 fix: 최초 ArrowUp 인덱스 오류 및 logout/withdraw의 me 지연 응답 경합.
- 두 문제 수정 및 회귀 테스트 추가. reviewer 재검토 최종 pass.
- API의 quota는 HTTP 503임을 backend Controller 원문으로 확인하여 공통 429 정책과의 비충돌 검증.

## 중간 실패와 재검증
- 초기 테스트 실행: 기존 chat hook 목업의 messages 누락, 추가 frequent invalidation에 대한 옛 기대값, 신규 API test envelope 오류. 실제 계약에 맞게 테스트 수정 후 통과.
- 초기 전체 실행은 711개 통과. 마지막 두 회귀 테스트 추가 후 빌드/테스트 동시 실행에서 기존 RoomFormModal 테스트 타임아웃 발생.
- 해당 검증 프로세스만 중단하고 작업자 4개로 전체 테스트 후 단독 빌드를 수행하여 713개/빌드 모두 통과. 동시 실행 자원 경합과 일치하는 증거이며 애플리케이션 원인으로 주장하지 않음.
- 샌드박스 안 첫 build는 출력 없이 정지. 이번 작업 프로세스만 종료 후 escalated build에서 정상 완료.
- 초기 보조 `npx tsc --noEmit`은 테스트 목업 타입 오류와 초기 잘못된 wrapper import 등으로 실패. wrapper import는 수정됨. 전달 기준인 Next production TypeScript/build는 최종 통과했으며 전체 테스트 파일에 대한 standalone tsc 통과는 주장하지 않음.

## 미실행·잔여 제한
- Browser skill bootstrap 후 getForUrl은 No browser is available, browsers.list는 [] 반환. 연결 요청을 남겼지만 브라우저가 없어 실제 시각/터치/실계정 API·소켓 테스트 미실행.
- 지정 치수/색상/CSS·DOM 구조는 코드와 자동 테스트로 확인했으나 실제 픽셀·작은 화면 목록 scroll·프로필 하단·채팅 scroll 보존은 브라우저에서 후속 확인 필요.
- 닉네임 버전 없는 REST 계약상 reconnect 중 누락된 더 최신 이벤트와 오래된 REST 결과를 완전히 구분할 수 없음. 세션 수신 최신 이벤트 우선 원칙.
