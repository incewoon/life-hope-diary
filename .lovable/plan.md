# 일간 플랜 텍스트: 커서 이후 글자 크기·색상 적용 수정

현재 텍스트 서식은 브라우저 `execCommand`에 의존하고 있어 두 가지 문제가 발생합니다.
- 선택 영역 없이 크기를 바꾸면 문단/전체 글자 크기가 통째로 바뀜
- 색상 변경은 서식이 저장·재렌더 과정에서 사라져 전혀 적용되지 않음

`execCommand` 기반 로직을 걷어내고, 직접 제어하는 방식으로 바꿉니다.

## 1. 선택 영역이 있을 때

선택 구간만 정확히 감싸서 `색상`/`글자 크기` 인라인 스타일을 적용합니다. 여러 문단에 걸친 선택도 구간 단위로만 적용되며, 바깥 텍스트는 영향을 받지 않습니다.

## 2. 선택 영역이 없을 때 (커서만 있는 경우)

- 커서 위치에 새 서식이 걸린 빈 구간을 만들고 커서를 그 안으로 옮깁니다.
- 이후 타이핑하는 글자만 새 크기/색상으로 입력되고, 앞서 입력한 글자는 그대로 유지됩니다.
- 즉 하나의 편집 영역 안에 크기·색상이 서로 다른 구간이 자유롭게 공존합니다.

## 3. 커서 유실 방지

- 툴바 팝오버를 눌러 포커스가 잠깐 옮겨가도 직전 커서/선택 위치를 복원합니다.
- 커서만 있는 상태(내용 변화 없음)에서는 저장을 트리거하지 않아, 재렌더로 서식 대기 상태가 초기화되는 현상을 없앱니다.

## 4. 저장·복원

- 적용된 크기·색상은 인라인 스타일로 저장되어 새로고침 후에도 그대로 복원됩니다.
- 기존에 저장된 내용(구 형식 포함)은 그대로 열립니다.

## 기술 메모

- `src/components/HandwritingCanvas.tsx`
  - `applyTextFormat`에서 `document.execCommand("styleWithCSS"/"foreColor"/"fontSize")` 제거.
  - 선택 있음: 저장된 Range를 기준으로 `range.extractContents()` → `<span style="color:…">` 또는 `font-size:…px` 로 감싸 다시 삽입 후 선택 복원. 중첩 시 자식의 동일 속성 스타일을 제거해 새 값이 우선되게 처리.
  - 선택 없음(collapsed): 커서 지점에 `<span style=…>\u200B</span>` 삽입 후 caret을 span 내부(ZWSP 뒤)로 이동. 입력 시 span 안에서 이어짐. 저장 sanitize 단계에서 ZWSP 제거.
  - collapsed 케이스에서는 `onTextsChange` 호출 생략(또는 debounce된 입력 경로에 맡김)해 `value` 재동기화로 인한 caret/서식 리셋 방지.
  - 색상/크기 팝오버 버튼은 `onPointerDown` 에서 `preventDefault()` 로 포커스 이동을 막아 selection 유지.
- `src/components/CanvasTextLayer.tsx`
  - `sanitizeCanvasHtml`: `SPAN` 의 `style` 유지(현행 유지), ZWSP-only 빈 span 정리 로직 추가.
  - 외부 `value` 동기화 effect는 현행대로 값이 실제로 달라질 때만 `innerHTML` 재설정.
- `src/lib/pen-context.tsx`: 변경 없음.
- 검증: Playwright로 (a) 텍스트 입력 → 크기 변경 → 추가 입력 시 앞 글자 크기 불변, (b) 색상 변경 후 입력 글자만 색 적용, (c) 드래그 선택 후 적용 시 해당 구간만 변경, (d) 새로고침 후 유지 확인.
