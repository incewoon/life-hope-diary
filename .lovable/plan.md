# LH 디지털 업무수첩 앱 (오프라인 다이어리)

첨부하신 2025 LH 업무수첩 PDF 구조를 그대로 화면으로 옮기고, 태블릿 펜 필기 + 완전 오프라인 저장(IndexedDB)을 지원하는 앱을 만듭니다. 서버, 로그인, 외부 네트워크 요청은 없습니다.

## 스택 관련 안내 (중요)

요청하신 `react-router-dom`은 이 프로젝트에서 사용할 수 없습니다. 이 앱은 TanStack Router 기반이라 라우팅만 그 방식으로 구현하고, 나머지(React + TypeScript + Vite, date-fns, perfect-freehand, Dexie, Tailwind)는 요청대로 진행합니다. URL 형태(`/daily/2025/08/15`, `/monthly/2025/08`)는 동일하게 유지됩니다. 데이터 저장/필기/백업 로직은 모두 브라우저 클라이언트에서만 동작하므로 나중에 Capacitor로 감싸 APK로 빌드하는 데 문제 없습니다.

## 화면 구성

- **표지** `/` — 연도 + work plan + Life with Hope, 연도 선택(기본값 올해), 목차 진입
- **경영전략 체계도** `/strategy` — Mission/Vision/Slogan/5대 가치(국민중심·미래혁신·소통화합·안전품질·청렴공정)/전략목표 (PDF 원문 텍스트 고정)
- **8대 경영목표** `/goals` — 주택공급 100만호, 도시조성 250km², 품질목표 100%, 부채비율 232% 이하, 주거복지 200만호, 산업거점 50km², 중대재해 ZERO, 고객만족 BEST 카드 8종
- **부패방지 및 규범준수 방침** `/compliance` — 7개 항목 원문
- **LH 링크·앱 안내** `/links` — 아이콘/버튼만 표시, 오프라인 안내 문구
- **연간 달력** `/calendar/$year` — 1~12월 미니 캘린더, 날짜 탭 시 일간으로 이동
- **월간 플랜** `/monthly/$year/$month` — 캘린더 그리드 + CHECK LIST(항목 자유 추가/삭제) + NOTE(모눈 필기 캔버스)
- **일간 플랜** `/daily/$year/$month/$day` — 큰 날짜 숫자 + 전/후일 프리뷰, 상단 요약 메모, 본문 필기 캔버스
- **자유 격자 노트** `/notes` — 이름 지정, 여러 장 추가/삭제
- **회의록** `/meetings` — 회의명/날짜/장소/참석자 + 필기 캔버스, 다건 생성
- **연락처 카드** `/contacts` — 성명/소속/직위직급/연락처 + 메모(필기), 추가/삭제
- **LH Family 지역본부** `/family` — 대표전화 1600-1004, 지역본부 주소 리스트, 개인 Office 정보 입력란
- **설정/백업** `/settings` — 백업 내보내기·가져오기, 연도 관리

정적 콘텐츠 페이지에도 동일한 필기 오버레이가 붙습니다.

## 데이터 원칙

- 일간/월간 페이지는 **사전 생성 없음**. 해당 날짜에 접근할 때만 레코드를 생성·로드.
- 캔버스는 현재 페이지의 stroke만 메모리에 로드하고, 이동 시 언마운트.
- 연도는 하드코딩하지 않고 선택 값 기준으로 모든 달력을 계산(date-fns).

## 필기 사양

- perfect-freehand + Pointer Events, `pressure` 없으면 0.5로 fallback, pen/touch/mouse 모두 동작.
- 도구: 펜 3색, 굵기 3단계, 지우개, undo/redo 20단계, 페이지 전체 지우기.
- 입력 후 500ms debounce 자동 저장 + 저장 완료 인디케이터.

## 백업/복원

- 설정 최상위에 "전체 백업 내보내기" / "백업 가져오기" 노출.
- Export: 선택 연도 또는 전체를 JSON 한 파일로 다운로드.
- Import: `updatedAt` 비교 후 최신본으로 자동 병합, 애매하면 "기존 유지 / 백업으로 교체" 다이얼로그.
- 마지막 백업일 기록, 7일 경과 시 상단 리마인더 배너.

## 네비게이션/UX

- 하단(세로)·좌측(가로) 아이콘 퀵 네비: 목차 / 링크 / 달력 / 연락처 / 위치.
- 일간·월간 전/후 이동 버튼 필수. 한국어 UI, 세로형 태블릿 우선.

## 기술 상세

- `src/lib/db.ts`: Dexie 스키마 `pages` 테이블 (`id`, `type`, `textFields`, `strokes`, `updatedAt`), `meta` 테이블(선택 연도, 마지막 백업일).
- `PageData.id` 규칙: `daily-YYYY-MM-DD`, `monthly-YYYY-MM`, `meeting-{uuid}`, `note-{uuid}`, `contact-{uuid}`, `static-{slug}`.
- 공용 컴포넌트: `HandwritingCanvas`(필기 레이어), `PenToolbar`, `PageShell`(헤더+아이콘바+필기 오버레이), `MiniCalendar`, `SaveIndicator`.
- 모든 페이지는 클라이언트 전용 렌더링(IndexedDB 접근은 마운트 후), 최신 실험적 브라우저 API 미사용 — 구형 WebView 호환.
- 지도 이미지는 정적 일러스트 자산으로 생성해 사용(외부 지도 API 없음).

## 개발 순서

1. 라우팅 + 연도 선택 + Dexie 저장 구조 + 목차/정적 페이지 뼈대
2. 연간/월간/일간 날짜 계산 및 lazy 생성 검증
3. 공용 필기 캔버스 제작 후 전 페이지 부착
4. Export/Import 백업 구현 및 검증
5. 전체 UI 다듬기 (LH 톤: 화이트 베이스 + LH 블루/그린 포인트)
