# 일간/월간 플랜 개선 3건

## 1. 여러 날에 걸친 일정 동기화

- 일정 저장 시 시작일~종료일 사이의 모든 날짜 페이지에 같은 일정(같은 id)이 저장됩니다.
- 어느 날짜에서 수정/삭제하든 같은 id를 가진 일정이 모든 날짜에서 함께 수정·삭제됩니다.
- 기간을 줄이거나 옮기면, 더 이상 포함되지 않는 날짜에서는 자동으로 제거됩니다.
- 하루짜리 일정은 지금과 동일하게 동작합니다.
- 칩 표시: 다른 날까지 이어지는 일정은 `8/29 09:00 → 8/31 18:00 · 일정명` 형태로 날짜까지 보여 하루짜리와 구분됩니다.

## 2. 월간 달력 날짜 도트 표시

- 월간 플랜(및 연간 달력)의 미니 달력에서 일정이 있는 날짜 아래에 점을 1개만 표시합니다(일정 개수와 무관).
- 저장된 일간 페이지의 일정 데이터를 읽어 표시하며, 일정이 없는 날에는 표시하지 않습니다.

## 3. 처음 생성되는 필기/텍스트 영역 크기를 스크롤 화면에 맞춤

- 현재는 화면 크기를 추정해 계산한 값이라 실제 스크롤 영역보다 세로는 짧고 가로는 넓어 불필요한 하단 스크롤이 생깁니다.
- 확장 버튼을 누르지 않은 기본 상태(1x1)에서는 필기판이 실제 보이는 스크롤 영역과 정확히 같은 크기가 되도록 실제 영역을 측정해 기준 크기를 정합니다.
- 태블릿 화면 크기·가로/세로 전환에 따라 기준 크기가 반응형으로 다시 맞춰집니다.
- 확장 버튼으로 늘린 배수(cols/rows)와 확대/축소, 비활성 영역 음영 표시는 지금 동작 그대로 유지됩니다.

## 기술 메모

- `src/lib/schedule.ts`(신규): `ScheduleItem` 타입/파싱을 `DaySchedule.tsx`에서 분리하고, `saveScheduleAcrossDays(item, prevItem?)`, `removeScheduleAcrossDays(id, item)`, `listScheduleDays(year, month)` 구현. Dexie `getPage`/`saveTextFields`로 `daily-YYYY-MM-DD` 페이지의 `schedule` 필드를 직접 갱신(현재 보고 있는 날짜는 `onChange`로 반영해 화면 즉시 갱신).
- `src/components/DaySchedule.tsx`: 저장/삭제 시 위 헬퍼 호출(이전 기간과 새 기간의 차집합 날짜에서 제거), 칩 라벨에 멀티데이 포맷 추가.
- `src/components/MiniCalendar.tsx`: `useEffect`로 해당 월의 daily 페이지를 조회해 일정 있는 날짜 Set 생성, 날짜 버튼 아래 `size-1 rounded-full bg-primary` 도트 렌더(오늘 강조와 겹치지 않게 배치).
- `src/components/HandwritingCanvas.tsx`: 스크롤 컨테이너 ref의 `clientWidth`/`clientHeight`를 측정해 `measuredBase`를 산출하고, ResizeObserver로 회전/리사이즈 시 갱신.
- `src/routes/daily.$year.$month.$day.tsx`: `canvasBase` 고정 저장·`computeBase()` 추정값 대신 측정된 기준 크기를 사용하도록 정리(기존 저장값이 있어도 1x1일 때는 측정값 우선).
