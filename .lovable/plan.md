# LH 업무수첩 개선 (8개 항목)

우선순위 순서대로 진행합니다. 화이트 + LH 블루 톤, 한국어 UI, 완전 오프라인(IndexedDB) 원칙은 그대로 유지합니다.

## 1. PenProvider 적용 (치명적 버그)

`src/routes/__root.tsx`의 `RootComponent`에서 `<Outlet />`을 `PenProvider`로 감쌉니다. 이후 필기 페이지 전부에서 `usePen must be used inside PenProvider` 에러가 사라집니다.

## 2. 퀵 네비게이션 달력 링크

`PageShell`의 NAV에서 "달력" 항목만 분리 처리합니다. `useSelectedYear()`의 year를 써서 `to="/calendar/$year"` + `params={{ year: String(year) }}` 형태로 작성하며, 문자열 연결(`/calendar/${year}`)은 쓰지 않습니다. 나머지 항목은 그대로 둡니다.

## 3. 일간 페이지 이전/다음 이동

`daily.$year.$month.$day.tsx` 상단에 좌우 이동 버튼을 추가합니다. date-fns의 `addDays`/`subDays`로 계산하고, 버튼에는 전날/다음날 날짜(예: 8월 14일 (목))를 작게 표시합니다. 이동은 `Link to="/daily/$year/$month/$day"`에 계산된 연·월·일을 **모두** `params`로 넘겨 처리합니다(예: 12월 31일 → 1월 1일처럼 연도가 바뀌는 경우에도 `$year`가 함께 갱신되어야 하므로 year를 고정하지 않습니다). 결과적으로 URL과 데이터(`dailyId`)가 항상 동기화됩니다.

## 4. 회의록 / 노트 / 연락처 다중 문서화

year 기준 단일 페이지 방식을 없애고 목록 + 상세 패턴으로 바꿉니다. 문서 id는 기존 `newId()`로 생성(`meeting-…`, `note-…`, `contact-…`), 목록은 `listPagesByType()`으로 조회, 삭제는 `deletePage()`를 사용합니다. 제목은 각 페이지의 `textFields`에 저장합니다.

- 회의록: 좌측 목록(추가/삭제/선택) + 우측 상세(회의명, 일시/장소, 참석자 입력 + 필기 캔버스)
- 자유 노트: 목록(추가/삭제/이름 변경) + 선택 노트의 필기 캔버스
- 연락처: 회의록·노트와 동일한 "목록 + 선택 상세" 패턴으로 통일합니다. 목록은 카드 그리드이며 카드에는 성명·소속·직위직급·연락처 텍스트 필드만 표시하고, 카드를 선택했을 때만 하단에 해당 카드의 필기 캔버스 1개를 렌더링합니다(카드마다 캔버스를 동시에 렌더링하지 않아 저사양 태블릿에서도 성능 저하가 없습니다). 카드 추가/삭제 지원.

선택된 문서 id는 URL 검색 파라미터(`?id=`)로 유지해 새로고침·뒤로가기에서도 같은 문서가 열립니다.

## 5. 월간 CHECK LIST

`monthly.$year.$month.tsx`에 체크리스트 영역을 추가합니다. 항목 추가/삭제/체크 토글이 가능하며, 데이터는 해당 월 페이지의 `textFields.checklist`에 JSON 문자열로 저장됩니다(스키마 변경 없음). 레이아웃은 달력 / 체크리스트 / 필기 NOTE 3분할.

## 6. Family 개인 Office 정보

`family.tsx` 지역본부 목록 아래에 부서·전화·팩스·이메일·주소 입력 섹션을 추가하고 `usePageText("static-family", "static")`로 저장·복원합니다. 필기 오버레이는 현행 유지.

## 7. 백업 가져오기 ambiguous 처리

`settings.tsx`의 가져오기에서 `applyBackup` 결과의 `plan.ambiguous`가 비어있지 않으면 다이얼로그를 띄웁니다. 항목 목록(페이지 id, 양쪽 수정 시각)을 보여주고 "기존 데이터 유지" / "백업 파일로 덮어쓰기"를 선택하게 하며, 덮어쓰기 선택 시 `resolveAmbiguous()`를 호출합니다. 자동 병합 로직은 변경하지 않습니다.

## 8. 기타

- `__root.tsx`의 `<html lang="en">` → `lang="ko"`
- 일간/월간 라우트가 URL params만을 데이터 소스로 쓰는지 확인(로컬 state 캐싱 없음)
- 필기 캔버스가 있는 모든 라우트를 실제로 열어 Provider 에러가 없는지 브라우저로 검증

## 기술 메모

- DB 스키마(`pages`, `meta`)는 변경 없음 — 다중 문서는 이미 지원되는 `type` 인덱스를 사용합니다.
- 기존 year-scoped 데이터(`meeting-2026`, `note-2026`, `contact-2026`)는 목록에 그대로 노출되어 유실되지 않습니다.
- 새 라우트 파일 추가 없이 기존 `meetings.tsx` / `notes.tsx` / `contacts.tsx` 내부에서 목록·상세를 함께 렌더링합니다.
