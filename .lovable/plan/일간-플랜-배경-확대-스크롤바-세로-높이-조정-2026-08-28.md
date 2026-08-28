# 일간 플랜 — 배경 확대, 스크롤바, 세로 높이 조정

## 1. 배경(격자·도트·줄칸)도 확대/축소에 맞춰 변경

현재 배경 무늬는 CSS 유틸의 고정 크기(격자 28px, 도트 24px, 줄 32px)라서 확대해도 무늬 간격이 그대로입니다.
배율에 무늬 간격을 곱해 필기 내용과 함께 커지고 작아지도록 바꿉니다. (예: 200%에서 격자 56px)

## 2. 스크롤바 항상 표시 + 더 두껍게

- 우측·하단 스크롤바를 필기/타이핑 모드와 무관하게 항상 표시(내용이 화면보다 작아도 자리 유지).
- 스크롤바 폭을 16px → 22px로 키우고 손잡이(thumb) 대비를 높여 손가락으로 잡기 쉽게 조정.
- 스크롤바 영역만 터치로 끌 수 있도록, 터치 차단은 필기 캔버스 영역에만 유지(두 손가락 이동은 그대로).

## 3. 도구영역 + 필기영역이 화면에 꽉 차도록 세로 높이 조정

- 필기 영역 높이를 고정 80vh 대신 "화면 하단까지 남은 높이"로 계산해, 페이지를 아래로 스크롤했을 때 도구영역과 필기영역이 화면을 꽉 채우도록 합니다.
- 하단에 약간의 여백만 남기고(≈12px) 나머지를 필기 영역이 차지합니다.

## 기술 메모

- `src/components/HandwritingCanvas.tsx`
  - 배경: `bgClass()` 유틸 클래스 대신(또는 병행) 인라인 `backgroundImage` + `backgroundSize: base*zoom`을 보드 div에 적용. base = grid 28 / dot 24 / line 32. 색상은 `var(--color-border)` 토큰 유지.
  - 스크롤 컨테이너: `overflow-auto` → `overflow-scroll` + `scrollbar-gutter: stable both-edges`, 클래스 `scroll-thick` 유지.
  - 높이: `maxHeight: "80vh"` 제거하고 `height: calc(100dvh - <컨테이너 top> - 12px)`를 ref 측정값 기반 state로 적용(리사이즈/회전 시 재측정).
- `src/styles.css`
  - `.scroll-thick::-webkit-scrollbar` 폭/높이 22px, thumb 색 대비 상향, track 배경 유지.
