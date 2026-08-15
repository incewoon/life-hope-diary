# Daily Compass

회사에서 개인용으로  첨부된 pdf 형태의 다이어리를 배포해서 쓰고있는데 이것을 앱형태로 만들고 싶어 아래 프롬프트 내용을 참고하게 앱개발을 계획해줘

LH 직원용 오프라인 디지털 업무수첩 앱 (최종 프롬프트)

LH(한국토지주택공사) 직원이 태블릿(펜 필기)으로 사용할 완전 오프라인 다이어리 앱을 만들어줘. 서버, Firebase, 로그인, 외부 네트워크 요청 전부 없음. 모든 데이터는 IndexedDB에만 저장. 최종적으로 Capacitor로 감싸서 Android APK로 빌드할 예정이니, 순수 클라이언트 웹앱으로만 구성해줘.

데이터/성능 원칙 (중요)

일간 페이지는 사전 생성 금지. 365일치를 미리 만들지 말고, 사용자가 특정 날짜를 선택하거나 이전/다음으로 이동할 때만 해당 날짜의 페이지를 생성·로드할 것.

캔버스는 현재 보고 있는 페이지의 stroke 데이터만 메모리에 로드하고, 페이지 이동 시 이전 페이지 캔버스는 언마운트/해제.

연도는 하드코딩하지 말고 사용자가 선택 가능하게 (기본값: 오늘 날짜 기준 연도). 달력·월간·일간 전부 선택된 연도 기준으로 동적 생성.

기술 스택

React + TypeScript + Vite

라우팅: react-router-dom, URL에 연/월/일 포함 (예: /daily/2025/08/15, /monthly/2025/08)

날짜 계산: date-fns

필기: perfect-freehand + Pointer Events API

로컬 저장: Dexie.js (IndexedDB 래퍼)

스타일: Tailwind CSS

다크모드: 선택 사항, 우선순위 낮음

페이지 구성 (첨부 PDF 구조 재현)

표지: 연도 + "work plan" + Life with Hope 슬로건, 연도 선택 UI

중장기 경영전략 체계도: Mission / Vision / Slogan / 5대 가치(국민중심·미래혁신·소통화합·안전품질·청렴공정) / 전략목표 — 텍스트는 고정 콘텐츠, 필기 레이어는 다른 페이지와 동일하게 오버레이

8대 경영목표: 8개 카드형 레이아웃, 텍스트 고정 + 필기 오버레이

부패방지 및 규범준수 방침: 7개 항목 리스트, 텍스트 고정 + 필기 오버레이

LH 링크·앱 안내 페이지: 실제 링크 연결 없이 버튼/아이콘만 표시 (오프라인 특성 명시)

연간 달력 개요: 선택 연도의 1~12월 미니 캘린더, 날짜 탭 시 해당 일간 페이지로 이동

월간 플랜 (12개월, lazy 렌더링): 캘린더 그리드 + CHECK LIST(텍스트 체크박스) + NOTE(필기 캔버스, 모눈 배경)

일간 플랜: 상단 날짜 숫자 + 이전/다음날 프리뷰, 상단 요약 메모(텍스트), 본문 필기 캔버스

자유 격자 노트: 이름 지정 가능, 여러 장 추가/삭제

회의록: 회의명/날짜/장소/참석자(텍스트 입력) + 필기 캔버스, 여러 개 생성 가능

연락처 카드: 이름/소속/직위직급/연락처(텍스트) + 메모(필기) 카드, 추가/삭제 가능

LH Family 지역본부: 지도 이미지(정적) + 지역본부 주소 리스트 + 개인 Office 정보 입력란(텍스트)

필기 기능 사양

모든 페이지(정적 콘텐츠 페이지 포함)에 필기 레이어를 공통 컴포넌트로 오버레이.

perfect-freehand + Pointer Events로 스타일러스 pressure 지원. pressure 값이 없는 기기(구형 WebView, 손가락 터치)를 대비해 기본값 0.5로 fallback 처리.

저장 스키마 (모든 페이지 공통):

interface Stroke {
  points: { x: number; y: number; pressure: number }[];
  color: string;
  width: number;
}
interface PageData {
  id: string; // 예: "daily-2025-08-15", "monthly-2025-08", "meeting-{uuid}"
  type: "daily" | "monthly" | "meeting" | "note" | "contact" | "static";
  textFields?: Record<string, string>;
  strokes: Stroke[];
  updatedAt: string; // ISO timestamp
}


도구: 펜 색상(2~3색), 굵기 조절, 지우개, undo/redo(최소 10단계), 페이지 전체 지우기.

입력 후 500ms debounce로 자동 저장, 저장 완료 시 작은 인디케이터 표시.

백업/복원 (핵심 기능, MDM 환경 대비)

설정 화면에 "전체 백업 내보내기" / "백업 가져오기" 버튼을 최상위 메뉴에 노출 (숨겨진 메뉴 아님).

Export: 선택된 연도(또는 전체 연도)의 모든 PageData를 JSON 하나로 다운로드.

Import: JSON 업로드 시 각 페이지의 updatedAt을 비교해서 더 최신 데이터로 덮어쓰기(자동 병합). 충돌이 명확하지 않은 경우 사용자에게 "기존 유지 / 백업 파일로 교체" 선택 다이얼로그 표시.

마지막 백업 일자를 저장해두고, 7일 이상 지나면 상단에 백업 리마인더 배너 노출.

태블릿/MDM 환경 대응

관리형 태블릿은 WebView가 오래된 경우가 많으므로, 최신 브라우저 전용 API(예: 최신 CSS 기능, experimental API) 사용 지양.

pointerType이 "pen"이 아닌 경우(손가락 터치, 마우스)에도 필기가 최소한 동작하도록 처리.

캔버스 렌더링은 페이지당 독립적으로, 앱 전체 초기 로딩 시 모든 캔버스를 한번에 그리지 않도록 성능 고려.

네비게이션/UX

좌측 또는 하단에 아이콘 기반 퀵 네비게이션 (목차 아이콘 / 링크 아이콘 / 달력 아이콘 / 연락처 아이콘 / 위치 아이콘) — 원본 PDF의 페이지 상단 아이콘 바 참고.

일간/월간 페이지는 이전/다음 이동 버튼 필수.

한국어 UI, 세로형 태블릿 우선 대응하되 가로형도 자연스럽게.

개발 순서

라우팅 + 연도 선택 + Dexie 저장 구조 + 페이지 목록(정적 페이지 포함) 뼈대부터 완성

월간/일간/연간 달력의 날짜 계산 로직 완성 (lazy 생성 확인)

필기 캔버스 공용 컴포넌트 제작 후 모든 페이지에 부착

Export/Import 백업 기능 구현 및 테스트

전체 UI 다듬기

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hope-scribe-digital.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3d9ba051-dd47-471e-bb91-54f7597d9d7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
