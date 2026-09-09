# 성능 리팩터링 조사 handout

- 대상 작업자: GPT-5.6 Sol, reasoning effort high
- 조사일: 2026-09-09
- 소스 기준: `18ff58d432e73f7b4eb159dea4d865aeab317c41`
- 상태: **조사 완료 / 구현 미승인 / 구현 미착수**

이 문서는 구현 승인이 아니다. 사용자가 별도로 작업을 명령하기 전에는 소스 수정, 테스트 추가, 빌드, 커밋 또는 배포를 시작하지 않는다. 이번 변경은 이 handout 작성뿐이다.

## 조사 범위와 신뢰도

브라우저의 검색, 지도 interaction, 렌더링, refresh 흐름을 실제 소스에서 확인했다. Graphify 스킬의 기존 그래프 질의와 `GRAPH_REPORT.md`는 탐색에만 사용했다. 그래프 기준 커밋은 `38b6305e`로 현재 HEAD와 다르며, 특히 과거 `src/app.js` 위치는 현재 `src/runtime/app-runtime.js` 등으로 이동했다. 아래 소스 위치와 함수가 우선한다.

아래 항목은 **정적으로 확인한 중복 연산 또는 개선 가능 경로**다. 브라우저 프로파일링, 성능 baseline, build/verify/e2e는 이번 조사에서 실행하지 않았다. 따라서 병목 확정, 개선율, 실제 지연 시간은 주장하지 않는다. 생성물 내용·diff를 검토하거나 수정하지 않았다.

## 우선순위

| 순서 | 후보 | 확인한 비용 | 구현 위험 |
| --- | --- | --- | --- |
| 1 | 검색 입력의 중복 드롭다운 갱신 제거 | input 한 번에 검색·정렬·DOM 교체를 두 번 수행 | 낮음∼중간: highlight/키보드 계약 |
| 2 | 동일한 기본 색상 레이어 재생성 생략 | 필터 적용마다 전체 지역 descriptor와 SVG path 문자열 재생성 | 중간: visibility/색상 invalidation |
| 3 | 검색 문자열·순위 계산 재사용 | 지역별 문자열 생성, comparator 내부 정규화, 불필요한 category 탐색 | 낮음∼중간: 검색 의미 보존 |
| 4 | wheel viewBox 쓰기 프레임 병합 | wheel마다 layout 읽기와 즉시 SVG 쓰기 | 중간∼높음: 줌 anchor/순서/lifecycle |
| 5 | 동일 선택 윤곽선 재생성 생략 | 선택이 같아도 전체 selection 레이어 교체 | 중간: capital/언어/시나리오 key |

이는 측정 전 추천 순서다. 후보 1부터 작은 단위로 검증하고, 나머지는 측정된 비용에 따라 선택한다. 모든 후보를 반드시 구현할 필요는 없다.

## 후보 1 — 검색 input의 중복 렌더 제거

근거:

- `src/ui/controls.js:157`, `bindNationSearchControl()`의 `onInput()`은 `openDropdown()` 후 `renderDropdown()`을 호출한다.
- `src/ui/search-controller.js:75`, `openDropdown()` 자체가 이미 `renderDropdown()`을 호출한다.
- 같은 파일 `:61`의 렌더는 매번 `visibleChoices()`를 계산한다. 이는 query가 있으면 `filterSearchCatalog()`의 검색·정렬을 수행한다.
- `src/ui/controls.js`의 `renderNationDropdown()`은 `innerHTML`로 항목을 교체한다. ArrowUp/Down도 결과가 같은데 검색과 전체 렌더를 다시 수행한다.

제안: input 갱신의 책임을 한 곳에 모아 결과 계산, 첫 항목 highlight 지정, DOM 반영을 한 번씩 수행한다. 방향키 이동은 동일한 query/catalog의 결과를 재사용하고 active 상태만 갱신하는 것을 검토한다. catalog revision 없이 query만 캐시하지 않는다.

주의: 현재 두 호출 사이에는 highlight를 0 또는 -1로 정하는 단계가 있다. 단순히 한 줄을 삭제해서 이전 highlight를 남기지 않는다. 검색어 변경으로 기존 국가 선택이 해제되는 흐름, Enter의 즉시 선택, Escape, focus, ARIA, click 위임, destroy를 보존한다. 드롭다운은 이미 최대 28개로 제한되므로 virtualization은 우선하지 않는다.

검증: 일반 input 한 번에 드롭다운 결과 계산/교체가 각각 한 번인지 확인한다. query/catalog 불변 상태의 방향키는 검색을 재수행하지 않아야 한다. `tests/unit/ui-controllers.test.js`, `tests/e2e/search.spec.js`를 중심으로 국가 선택 해제와 빈 결과도 검사한다.

## 후보 2 — 기본 색상 레이어의 동일 입력 재사용

근거:

- `src/ui/search-controller.js:108`의 `applyFilters()`는 매번 visibility 집합을 만들고 callback을 호출한다.
- `src/runtime/app-runtime.js:899`의 `onRegionVisibilityChange`는 전체 visual state를 적용하고, 기본 옵션에서 `syncNormalRegionColorVisibility()`를 호출한다.
- 같은 파일 `:706`의 함수는 `mapSceneRenderer.renderBaseColors()`를 호출한다.
- `src/render/map-scene-renderer.js:150`의 `renderBaseColors()`는 모든 보이는 지역을 filter/map하고, fragment를 만든 뒤 레이어를 무조건 교체한다.
- `src/render/map-layers.js:145`의 `createGroupedVisualFillFragment()`는 그룹별 path를 `join(' ')`한다. 비용은 DOM 개수뿐 아니라 geometry 문자열 길이에도 비례한다.

제안: 마지막으로 적용한 시나리오/geometry revision, base mode/색상 입력, 보이는 지역 집합, world-copy context가 같으면 레이어 재생성을 생략한다. 우선 단일 마지막 결과만 보관하고, 다중 geometry 문자열 캐시는 측정 없이 도입하지 않는다. key를 만들기 위해 매번 전체 path 문자열을 직렬화하는 것은 피한다.

언어 refresh에서도 `applyFilters()`가 실행된다(`app-runtime.js:914`). 언어만 바뀌고 실제 보이는 지역이 같다면 기본 색상을 유지할 수 있지만, 번역된 검색어의 일치 집합이 달라지면 반드시 갱신해야 한다. 시나리오 전환 및 reset/destroy에서 이전 key와 DOM 상태를 함께 무효화한다.

기존 완화: 같은 색상의 지역은 이미 그룹 path로 병합되어 있다. 시나리오/world-wrap refresh 일부는 `renderBaseColors: false`로 중복 호출을 억제한다. 이 최적화를 새 제안으로 중복 구현하지 않는다.

검증: 동일 visibility/base mode의 재적용에서 DOM identity 유지와 교체 횟수 0을 확인한다. 검색 가시성 변경, base mode 변경, 시나리오 전환, wrap 전환에서는 올바르게 갱신되어야 한다. `baseColorRenderCalls`는 현재 호출 횟수이므로 실제 rebuild/skip 지표를 구분할 필요가 있다. `tests/unit/render-services.test.js`, `tests/e2e/search.spec.js`, `language.spec.js`, `rendering.spec.js`, `world-wrap.spec.js`를 활용한다.

## 후보 3 — 검색 계산 비용 감소

근거:

- `src/ui/search-controller.js:21`의 `regionSearchText()`는 `applyFilters()`에서 query가 있을 때 지역마다 localized label, 배열, join, lowercase를 다시 만든다.
- `src/data/search-catalog.js:109`의 `nationMatchRank()`는 sort comparator가 호출될 때마다 alias와 project alias를 소문자로 변환한다.
- 같은 파일 `:121`의 `filterSearchCatalog()`는 `regionLimit: 0`이어도 region filter를 수행한다. `applyFilters()`는 국가 결과만 필요한 호출에 이 옵션을 넘긴다.

제안: catalog 생성 시 rank용 정규화 값을 준비하고, query별 rank는 매칭 국가당 한 번만 계산한다. limit가 0인 category는 탐색을 생략한다. 지도 필터용 지역 검색 문자열을 context/catalog revision별로 준비한다.

주의: dropdown의 region searchText에는 `prettyRegionName()`이 있지만 지도 필터의 `regionSearchText()`에는 없다. 두 문자열을 그대로 통합하면 일치 의미가 바뀐다. 현재 의미를 각각 보존하거나 의미 변경을 별도 제안으로 남긴다. 지도 필터는 runtime이 전달한 `mapSceneRenderer.getCanonicalRegions()`를 사용하므로 전체 catalog 지역으로 무조건 대체하지 말고 canonical 집합과 순서를 보존한다. 동률의 label/tag 정렬, 결과 상한, 언어·시나리오·context 변경 시 invalidation을 유지한다. 기존 catalog의 searchText 사전 계산은 이미 존재한다.

검증: `tests/unit/search-overlay-panel.test.js`, `tests/unit/ui-controllers.test.js`, `tests/e2e/search.spec.js`에서 국가 tag/alias/project 검색, 한글·영문 지역명, 빈 검색, 동률 순서, 지도 visibility 집합을 전후 비교한다. 후보 1과 비용을 따로 측정한다. debounce나 역색인은 실제 지연이 남을 때만 검토한다.

## 후보 4 — wheel 쓰기 병합

근거:

- `src/interaction/map-view-controller.js:107`: `onWheel()` → `pointFromClient()`의 `getBoundingClientRect()` → `zoomAt()` → `apply()`의 즉시 `viewBox` 쓰기.
- pan은 이미 `src/interaction/map-interaction-controller.js:194`의 `scheduleMapViewRender()`로 requestAnimationFrame 병합을 수행한다. wheel은 `onSvgWheel()`에서 별도 callback으로 전달된다.

제안: 먼저 빠른 wheel 입력에서 실제 event 수/프레임당 viewBox 쓰기 수/브라우저 layout 비용을 측정한다. 필요하면 논리적 줌 상태는 이벤트 순서대로 업데이트하되 DOM 반영만 프레임당 한 번으로 제한하는 방향을 검토한다. viewport rect 재사용 범위는 resize/scroll/layout invalidation을 고려한다.

주의: 마지막 delta만 남기면 기존 누적 줌 배율이 달라진다. anchor가 이동하는 연속 입력, clamp, wrap, 버튼 줌, reset과 pending frame의 순서, 시나리오 전환, destroy 후 callback을 다룬다. render 모듈에서 appState를 직접 읽지 않는다. 툴팁 크기/rect 캐시와 pan viewport 캐시는 이미 구현되어 있다.

검증: `tests/unit/map-view-state.test.js`, `tests/unit/map-interaction-controller.test.js`, `tests/e2e/pan.spec.js`, `world-wrap.spec.js`, `runtime-lifecycle.spec.js`. 프레임당 DOM 반영 감소와 함께 동일 입력 시퀀스의 최종 viewBox/anchor 동작이 유지되는지 확인한다. synthetic 이벤트만으로 체감 개선을 결론 내리지 않는다.

## 후보 5 — 선택 윤곽선 render key

근거:

- `src/render/map-marker-renderer.js:445`, `renderSelectionOutlines()`는 레이어를 비우고 모든 선택 outline/marker/label을 다시 만든다.
- `src/render/map-output-controller.js:324`, `updateSelectedRegions()`는 선택 변경 여부와 무관하게 이 렌더를 호출한다.
- `src/runtime/app-runtime.js:713`, `rerenderWorldWrapLayers()`는 명시적 selection 렌더 이후 `updateSelectedRegions()`를 호출하므로 selection 레이어를 다시 생성하는 경로가 있다.
- 다른 capital/pinned/hover 렌더에는 이미 key 기반 생략이 있다. selection에도 같은 생명주기 패턴을 적용할 수 있다.

제안: 선택 지역과 순서, 각 지역의 capital 여부, 언어/label, geometry revision, copy context를 반영한 마지막 key를 renderer 내부에 보관한다. 기존 helper를 재사용하되 reset/clear/destroy가 key를 지우는지 확인한다. region ID만 key에 넣으면 시나리오 전환 시 잘못된 geometry를 유지할 수 있다.

검증: 동일 선택 반복에서 DOM identity 유지, pin/unpin 및 capital 전환에서 dot/star 동작, 언어 변경의 label 갱신, wrap 복사 수, 다른 시나리오의 같은 region ID를 검사한다. `tests/unit/render-services.test.js`, `tests/unit/map-output-controller.test.js`, `tests/e2e/pins.spec.js`, `language.spec.js`, `scenarios.spec.js`가 관련된다. 선택 수가 작으면 효과가 제한적이므로 비용 대비 판단한다.

## 측정 및 실행 순서 — 별도 승인 이후에만

1. `AGENTS.md`, `/home/affx/.codex/RTK.md`, 현재 git 상태와 HEAD를 확인한다. 모든 shell 명령은 `rtk`로 실행하고 사용자 변경을 보존한다. 현재 소스에서 위 호출 관계를 다시 확인한다.
2. 구현 승인 범위에 맞는 phase plan을 정한다. end-to-end 구현 요청이면 `phased-issue-implementation` 스킬을 읽고 적용한다. 이 문서를 완료 표시된 구현 계획으로 해석하지 않는다.
3. 현재 소스로 baseline build/검증 후 성능 기록을 남긴다. 이 repo의 e2e와 측정 도구는 `src`가 아니라 빌드된 `docs`를 제공하므로 baseline/after 각각 build가 선행되어야 한다. WSL은 `rtk proxy ./scripts/build-wsl.sh`, 일반 환경은 `rtk npm run build`를 따른다.
4. 후보 1부터 하나씩 구현·검증한다. 후보 1∼3을 동시에 바꿔 효과 원인을 잃지 않는다. 측정 이득이 없거나 복잡성이 커지면 해당 후보를 보류하고 근거를 기록한다.
5. 소스 변경 후 `rtk npm run verify`, 브라우저 동작 변경 후 `rtk npm run test:e2e`를 실행한다. `rtk npm run lint`로 정적 검사도 수행한다. 필요한 unit/e2e는 호출 모양보다 실제 결과·갱신 생략·invalidation을 검증한다.
6. 완료 보고에는 변경 전후 비용, 동작 보존, 실행한 검사와 실패/미실행 사유를 남긴다. 생성물 변경은 재빌드 결과로 요약한다. 별도 지시 없는 배포는 하지 않는다.

기존 측정 도구 예시(승인 이후 baseline과 after에서 각각 실행):

```sh
rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,3,6 --scenarios=wrap-off-labels,wrap-on-labels,wrap-on-complex-overlays-labels --summary-json --out=.chatgpt/tool-tests/performance-refactor/baseline
```

after에서는 출력 경로 끝을 `after`로 바꾼다. 동일 Chromium 버전, viewport, 데이터/선택 상태, zoom, wrap, CPU 조건을 사용하고 warm-up과 반복 편차를 기록한다. `setupOk`/`hoverProbeOk` 실패를 성공한 측정과 섞지 않는다. 여기서 `--scenarios`는 게임 시나리오가 아니라 측정 preset 이름이다. 게임 시나리오 전환은 별도로 확인한다.

측정 한계:

- `mapViewApplyMs`는 JS의 viewBox 반영 구간이며 실제 SVG paint/composite 완료 시간이 아니다.
- `panFrameMs`는 전달된 scheduledAt부터 viewBox 반영 직후까지다. 완전한 화면 frame time이나 FPS로 해석하지 않는다.
- 기존 `zoomMap()`은 wheel 사이에 60ms를 기다리므로 고빈도 wheel 병합 효과를 검증하기에 부족하다. 별도 burst 측정과 브라우저 trace가 필요하다.
- debug SVG 통계는 DOM query 비용을 추가한다. debug counter로 중복 작업을 확인하고, debug를 끈 브라우저 trace로 체감 성능을 별도 확인한다.
- 기존 도구는 검색 타이핑 latency나 선택 outline 교체를 모두 직접 측정하지 않는다. 승인 후 해당 후보에 필요한 최소 계측만 추가한다. wall-clock 임계값을 환경 독립적인 단위 테스트에 고정하지 않는다.

## 이번 범위에서 권장하지 않는 변경

Canvas/WebGL 전환, SVG geometry 단순화, world-wrap 제거, 대규모 구조 재분리, 전역 무제한 캐시, 외부 게임 데이터 재추출은 이번 후보의 선행 조건이 아니다. claim presentation에는 이미 LRU 캐시가 있고 claim overlay에는 key와 buffer 재사용이 있다. 이 기능을 다시 만드는 작업은 피한다. Python build pipeline의 추가 최적화는 별도 profiling 근거가 확보되면 후속 후보로 다룬다.

## 후속 모델에 전달할 지침

> GPT-5.6 Sol high로 이 handout과 현재 AGENTS.md를 읽어라. 상태는 구현 미승인이다. 사용자의 별도 구현 지시가 없으면 작업을 시작하지 마라. 구현 지시가 있으면 그 범위에서 현재 소스를 재확인하고 baseline을 확보한 뒤, 확인된 중복 작업부터 작은 단계로 개선하라. 기존 검색/선택/언어/시나리오/wrap 동작과 모듈 경계를 보존하라. 생성물을 직접 수정하지 말고 소스 수정 후 정해진 build/verify/e2e를 수행하라. 측정하지 않은 성능 향상을 주장하지 마라.
