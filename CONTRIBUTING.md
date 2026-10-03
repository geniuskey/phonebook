# PhoneBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요. 제3자 자료를 추가할 때는 재사용·배포가 허용되는지 확인하고 출처와 해당 라이선스를 명시하세요.

빌드 과정 없는 정적 사이트다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 공대 학부생과 하드웨어 입문 엔지니어(전자/물리/기계 기초가 있다고 가정). 영어 원어는 `<span class="en">(Power Management IC)</span>`처럼 병기.
- 부품 소개 → 직관 그림(SVG) → 원리·수식(KaTeX) → 시뮬레이터 → 실제 수치 예 → **설계 시 무엇이 중요한가(트레이드오프)** → 요약/퀴즈 순서.
- 수치는 최근 플래그십/보급형 스마트폰에서 합리적인 범위를 쓴다(예: 배터리 4,000~5,000 mAh, 두께 7~9 mm, AP 최대 전력 5~12 W 순간·지속 3~5 W). 특정 제품의 비공개 사양처럼 쓰지 않는다.
- 외부 라이브러리는 아래 head 템플릿에 있는 것만(KaTeX, three.js r147). 이미지 파일 대신 인라인 SVG/canvas로 그린다.
- 색은 하드코딩하지 말고 CSS 변수(`var(--accent)` 등)나 `PB.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다. 단, 물리적 색(파장색, R/G/B 필터색)은 고정색 가능.
- 모바일(폭 360px)에서 가로 스크롤이 생기면 안 된다. SVG는 `viewBox`만 주고 width/height 속성 생략.

## head 템플릿
```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>배터리 · PhoneBook</title>
<meta name="description" content="한 문장 설명">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
<!-- 3D가 필요한 페이지만 -->
<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js"></script>
<!-- 전체 폰 3D 모델이 필요한 페이지만 -->
<script src="../js/phone3d.js"></script>
</head>
<body data-chapter="battery">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 05</div>
    <h1>배터리</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
  </header>

  <section id="intro"><h2>제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 여기서 PB 사용 */ </script>
</body>
</html>
```
상단바, 챕터 서랍, 목차, 이전/다음, 푸터, 테마 토글, 퀴즈 동작, KaTeX 렌더는 `common.js`가 자동 처리한다.
새 챕터는 `common.js`의 `CHAPTERS`에 등록한 뒤 `python3 tools/seo.py`를 실행한다. canonical·Open Graph·JSON-LD 태그가 `<meta name="description">` 바로 아래에 삽입되고 `sitemap.xml`이 갱신된다(직접 쓰지 않는다).

## 컴포넌트
```html
<figure class="diagram"><svg viewBox="0 0 800 300">...</svg><figcaption><b>그림 3-1.</b> 설명</figcaption></figure>
```
SVG 안 유틸 클래스: `.t .t-dim .t-mono .t-acc`(텍스트), `.s-line .s-axis .s-acc`(선), `.f-surface .f-elev .f-acc .f-acc-soft .f-acc2-soft`(면).

```html
<div class="sim" id="sim-qe">
  <div class="sim-head"><span class="sim-tag">SIMULATOR</span><h3>제목</h3></div>   <!-- 3D는 <span class="sim-tag three">3D</span> -->
  <div class="sim-body side">                                    <!-- side: 넓은 화면에서 컨트롤을 오른쪽에 -->
    <div class="sim-view"><canvas id="cv-qe"></canvas></div>     <!-- 3D는 <div class="sim-view three" id="v3d"></div> -->
    <div class="sim-controls">
      <label class="ctrl"><span>파장 <output id="wl-out"></output></span><input type="range" id="wl" min="350" max="1100" value="550"></label>
      <div class="ctrl"><span>모드</span><div class="seg" id="mode"><button data-value="fsi" class="on">FSI</button><button data-value="bsi">BSI</button></div></div>
      <label class="check"><input type="checkbox" id="showx"> 옵션</label>
      <button class="btn primary" id="run">실행</button>
    </div>
  </div>
  <div class="sim-readout">
    <div class="stat"><span class="k">흡수 깊이</span><span class="v" id="o-depth">—</span></div>
  </div>
  <div class="sim-note">해볼 것: ...</div>
</div>
```
콜아웃: `<div class="callout">`, `.tip`, `.warn`, `.deep`(심화). 수식: `<div class="formula">$$...$$<div class="where">여기서 ...</div></div>`, 인라인 `\( ... \)`.
표: `<div class="table-wrap"><table>...</table></div>`. 퀴즈:
```html
<div class="quiz-q"><p>질문?</p><div class="opts">
  <button class="opt">보기</button><button class="opt" data-correct>정답</button>
</div><div class="quiz-exp">해설</div></div>
```

## JS 헬퍼 (`js/common.js`)
- `PB.canvas(el, (ctx,w,h)=>{}, {aspect:0.5, height, minHeight, maxHeight})` → `{ctx,w,h,redraw()}` HiDPI, 리사이즈/테마 시 자동 redraw(배경 `--canvas-bg`로 칠해 줌).
- `PB.chart(ctx, box|null, {x:[a,b], y:[a,b], logX, logY, xLabel, yLabel, series:[{data:[[x,y]],color,width,dash,fill}], vlines, hlines, points, bands, xFmt, yFmt})` → `{X,Y,box}`.
- `PB.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 rAF 루프 `{start,stop,toggle}`.
- `PB.range(id, fmt, onInput)` → getter `get()`, `get.set(v)`. `PB.seg(id, onChange)` → getter. `PB.stat(id, html)`.
- `PB.palette()` 테마 색, `PB.color('accent')`, `PB.onTheme(cb)`, `PB.isDark()`.
- `PB.wl2rgb(nm, alpha)`, `PB.wl2rgbArr(nm)`, `PB.randn()`, `PB.poisson(λ)`, `PB.fmt(x, digits)`, `PB.si(x,'m')`, `PB.clamp/lerp/map`, `PB.C = {h,c,q,k}`.
- `PB.three(el, {camera:[x,y,z], target:[x,y,z], fov, autoRotate, minDistance, maxDistance, clipping, env})` → `T = {THREE, scene, camera, renderer, controls, onFrame(cb), label(html, Vector3|[x,y,z]) , material(color, opts), pick(objects, onClick, onHover)}`. 조명/스튜디오 환경맵(금속 반사)/리사이즈/화면밖 정지 포함. 라벨의 `L.obj = mesh`로 두면 로컬 좌표를 따라감. `T.pick`은 드래그가 아닌 클릭만 잡는다.
- **셰이더 재컴파일 주의**: 애니메이션/슬라이더 중에 `material.needsUpdate = true`를 매 프레임 하지 말 것. 투명도는 `opacity`만 바꾸고, `transparent`·`clippingPlanes`·`side` 변경은 꼭 필요할 때만.
- `PB.flyTo(T, [x,y,z], [tx,ty,tz], 초)` 카메라를 부드럽게 이동.

## 3D 스마트폰 모델 (`js/phone3d.js`)
`const P = PB.phone3d(T)` — 약 71.5 × 147 × 8 mm 전형적 플래그십(단위 mm). 좌표: x=폭(앞에서 보아 오른쪽 +), y=두께(화면 쪽 +), z=길이(폰 위쪽이 −z). 카메라 거리는 150~300 정도가 적당.
- 부품 id: `cover, display, frontcam, frame, vc, boardTop, interposer, boardBottom, cameras, battery, bottom, flex, wireless, backglass`
- `P.setExplode(0..1)`, `P.setAssembly(s|null)`(조립 순서 `P.order`, 설명 `P.stepText[id] = [제목, 설명]`), `P.highlight(id|[ids]|null)`, `P.setXray(bool)`, `P.setClip(x|null)`(x 위치 세로 단면), `P.setLabels(true|false)`, `P.partAt(mesh)`, `P.center(id)`, `P.byId[id]`(name, desc, specs, chapter, color, group)
- 해당 장의 부품을 강조해 '폰 안에서 이 부품이 어디 있는지' 보여 주는 데 쓰면 좋다. 세부 구조(셀 내부, 패널 적층 등)는 각 장에서 별도의 작은 3D 씬으로 만든다.
- `PB.partCardHTML(part, '')` 부품 정보 카드(HTML), CSS `.part-card`.
