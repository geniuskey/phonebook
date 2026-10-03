/* ==========================================================================
   PhoneBook 3D 스마트폰 모델 — PB.phone3d(T, opts)
   전형적인 플래그십(약 71.5 × 147 × 8 mm)을 절차적으로 만든다. 단위: mm.
   좌표: x = 폭(앞에서 볼 때 오른쪽 +), y = 두께(화면 쪽 +), z = 길이(폰 위쪽이 -z)
   특정 제품의 실제 설계가 아니라 '전형적인 배치'를 보여 주기 위한 교육용 모델이다.

   const P = PB.phone3d(T);
   P.group                    — 씬에 추가된 THREE.Group
   P.parts / P.byId[id]       — {id, name, en, color, desc, specs, chapter, group, layer, ...}
   P.setExplode(e)            — 0(조립) … 1(완전 분해)
   P.setAssembly(s)           — 조립 순서 s(0…P.order.length, 소수 가능). null이면 해제
   P.highlight(id|[ids]|null) — 부품 강조(나머지는 살짝 흐리게)
   P.setXray(on)              — 강조 부품 외 반투명
   P.setClip(x|null)          — x 위치에서 단면 자르기(세로 단면)
   P.setLabels(on|'one')      — 부품 이름 라벨
   P.partAt(object)           — 피킹된 메시가 속한 부품
   P.center(id)               — 부품의 현재 월드 중심(Vector3)
   ========================================================================== */
(function () {
  "use strict";
  const PB = window.PB;

  const W = 71.5, L = 147, R = 10.5, TH = 8.0;

  const PART_INFO = [
    { id: "cover", name: "커버 글라스", en: "Cover Glass", layer: 8.2, color: 0x9fd3ff, chapter: "mechanical",
      desc: "화학 강화(이온 교환) 알루미노실리케이트 유리. 터치를 받아들이고 화면을 보호한다. 표면 압축응력 층이 균열 성장을 막는다.",
      specs: { "두께": "0.5–0.7 mm", "표면 압축응력": "~800 MPa", "압축층 깊이": "~100 µm" } },
    { id: "display", name: "OLED 디스플레이 패널", en: "OLED Panel", layer: 7.1, color: 0x6c5ce7, chapter: "display",
      desc: "원편광판 + 터치 센서 + 박막 봉지 + 유기 발광층 + LTPO TFT 백플레인. 폰에서 전력을 가장 많이 쓰는 부품 중 하나다.",
      specs: { "크기": "6.1–6.9″", "주사율": "1–120 Hz", "피크 휘도": "2,000–3,000 nit", "모듈 두께": "~0.6–1.0 mm" } },
    { id: "frontcam", name: "전면 카메라·근접 센서", en: "Front Camera / Proximity", layer: 6.2, color: 0xf5b93a, chapter: "sensors",
      desc: "펀치홀 아래의 셀피 카메라와 근접·조도 센서, 수화부 스피커. 화면에 가려지지 않도록 화면 상단에 모여 있다.",
      specs: { "전면 카메라": "~12 MP, f/1.9–2.2", "펀치홀": "Ø 3–4 mm", "근접 센서": "940 nm IR" } },
    { id: "frame", name: "프레임·미드플레이트", en: "Frame / Mid-plate", layer: 5, color: 0xa7adb8, chapter: "mechanical",
      desc: "측면 레일과 중간판이 한 덩어리로 가공된 뼈대. 강성과 접지를 맡고, 측면 금속은 분할선으로 나뉘어 안테나로도 쓰인다.",
      specs: { "재료": "Al 7000계 / Ti Gr.5", "측면 레일 두께": "~1.2–1.6 mm", "안테나 분할선": "4–6곳" } },
    { id: "vc", name: "베이퍼 챔버", en: "Vapor Chamber", layer: 4.55, color: 0xd9874a, chapter: "thermal",
      desc: "얇은 구리 판 속 소량의 물이 증발–응축을 반복하며 AP의 열을 넓게 퍼뜨린다. 열은 결국 화면과 후면으로 빠져나간다.",
      specs: { "두께": "0.3–0.5 mm", "유효 열전도도": "수천 W/m·K", "작동 유체": "물(감압)" } },
    { id: "boardTop", name: "메인보드 상판 (RF·모뎀)", en: "Logic Board — Top", layer: 4, color: 0x2f8f5b, chapter: "rf",
      desc: "모뎀·RF 트랜시버, 파워앰프·필터 모듈(FEM), Wi-Fi/BT 칩, 그리고 각종 보드 대 보드 커넥터. 차폐 캔이 칩 사이의 간섭을 막는다.",
      specs: { "층수": "10–12층 HDI", "차폐 캔": "니켈 은/SUS", "커넥터": "디스플레이·카메라·배터리" } },
    { id: "interposer", name: "인터포저", en: "Interposer", layer: 3, color: 0xc7a35a, chapter: "board",
      desc: "두 장의 보드를 수직으로 잇는 액자 모양의 PCB. 보드를 2층으로 쌓아(샌드위치) 면적을 절반 가까이 줄이고, 그만큼 배터리를 키운다.",
      specs: { "연결 수": "수백 개 패드", "높이": "~1.5 mm", "효과": "보드 면적 ~40% 절감" } },
    { id: "boardBottom", name: "메인보드 하판 (AP·메모리)", en: "Logic Board — Bottom", layer: 2, color: 0x23704a, chapter: "soc",
      desc: "AP(SoC) 위에 LPDDR 메모리를 겹쳐 올린 PoP, UFS 저장장치, 전원 관리 IC(PMIC)가 모인 폰의 두뇌.",
      specs: { "AP": "3 nm급 SoC", "메모리": "LPDDR5X 8–16 GB (PoP)", "저장": "UFS 4.x 128 GB–1 TB" } },
    { id: "cameras", name: "후면 카메라 모듈", en: "Rear Cameras", layer: 2, color: 0x4f6bed, chapter: "camera",
      desc: "광각(메인)·초광각·잠망경 망원. 큰 센서와 긴 광로가 필요해 폰에서 가장 두꺼운 부품이고, 그래서 카메라 범프가 생긴다.",
      specs: { "메인": "50 MP, 1/1.3″급, OIS", "망원": "3–5× 잠망경", "모듈 높이": "~6–9 mm" } },
    { id: "battery", name: "배터리", en: "Li-ion Battery", layer: 2, color: 0xc7ccd6, chapter: "battery",
      desc: "리튬이온 폴리머 파우치 셀. 내부 부피의 1/3 이상을 차지하는 가장 큰 단일 부품이며 폰 크기·무게·사용 시간을 결정한다.",
      specs: { "용량": "4,000–5,000 mAh", "에너지": "15–19 Wh @ 3.85 V", "에너지 밀도": "~700–800 Wh/L" } },
    { id: "bottom", name: "하단 모듈 (스피커·햅틱·USB-C)", en: "Bottom Module", layer: 2, color: 0x8e6bd8, chapter: "audio",
      desc: "USB-C 포트가 달린 서브보드, 마이크로 스피커와 공명 공간(스피커 박스), 리니어 진동 모터(LRA), 하단 마이크.",
      specs: { "USB": "USB-C, 최대 USB 3.x", "LRA 공진": "~150–240 Hz", "스피커": "~1 W, 박스 ~1 cc" } },
    { id: "flex", name: "메인 플렉스 케이블", en: "Main Flex (FPC)", layer: 1.6, color: 0xe0a030, chapter: "board",
      desc: "하단 서브보드와 메인보드를 잇는 연성회로기판(FPC). USB 고속 신호, 오디오, 안테나 급전선이 배터리 옆을 지나간다.",
      specs: { "기재": "폴리이미드(PI) / LCP", "두께": "~0.1–0.3 mm", "신호": "USB, RF, 전원" } },
    { id: "wireless", name: "무선 충전 코일·자석", en: "Wireless Charging Coil", layer: 1, color: 0xd9822b, chapter: "power",
      desc: "평면 구리 코일과 그 뒤의 페라이트 시트, 정렬용 자석 링, NFC 안테나. 충전기 코일과 자기적으로 결합해 전력을 받는다.",
      specs: { "출력": "15–25 W (Qi2)", "주파수": "~100–200 kHz", "자석": "정렬용 링 자석" } },
    { id: "backglass", name: "후면 글라스·카메라 범프", en: "Back Glass", layer: 0, color: 0x3d4a5c, chapter: "mechanical",
      desc: "무선 충전 자기장과 전파가 통과해야 하므로 금속이 아닌 유리(또는 세라믹·플라스틱)를 쓴다. 카메라 범프가 튀어나와 있다.",
      specs: { "두께": "~0.6 mm", "범프 높이": "~1.5–3 mm", "마감": "무광 에칭" } },
  ];

  // 조립 순서(공장 조립 흐름을 단순화): 화면 쪽에서 시작해 후면으로 닫는다
  const ORDER = ["frame", "display", "cover", "frontcam", "vc", "boardTop", "interposer", "boardBottom", "cameras", "flex", "bottom", "battery", "wireless", "backglass"];
  const STEP_TEXT = {
    frame: ["프레임 준비", "알루미늄/티타늄 블록을 CNC로 깎아 만든 프레임이 모든 부품의 기준면이 된다."],
    display: ["OLED 패널 부착", "화면 모듈을 프레임 앞면에 접착한다. 패널의 연성 회로(FPC)는 아래쪽에서 뒤로 접혀 들어간다."],
    cover: ["커버 글라스", "실제로는 패널과 커버 글라스가 광학 투명 접착제(OCA)로 붙은 한 모듈로 들어온다."],
    frontcam: ["전면 카메라·센서", "펀치홀 바로 뒤에 셀피 카메라와 근접·조도 센서, 수화부 스피커를 맞춰 넣는다."],
    vc: ["베이퍼 챔버", "AP가 놓일 자리 바로 위에 열 확산판을 붙인다. 열 인터페이스 물질(TIM)이 칩과 판을 잇는다."],
    boardTop: ["메인보드 상판", "RF·모뎀 쪽 보드. 다음 단계의 인터포저, 하판과 함께 미리 한 덩어리(샌드위치)로 조립된다."],
    interposer: ["인터포저", "상판과 하판 사이에서 수백 개의 신호를 수직으로 잇는 '액자'."],
    boardBottom: ["메인보드 하판", "AP와 메모리가 올라간 보드. 샌드위치가 완성되면 나사 몇 개로 프레임에 고정한다."],
    cameras: ["후면 카메라", "메인·초광각·망원 모듈을 브래킷에 넣고 보드 커넥터에 꽂는다. 가장 두꺼운 부품이다."],
    flex: ["메인 플렉스", "배터리 자리 옆으로 하단과 상단을 잇는 연성 케이블을 깐다."],
    bottom: ["하단 모듈", "USB-C 서브보드, 스피커 박스, 진동 모터. 포트 주변은 방수 가스켓으로 막는다."],
    battery: ["배터리", "가장 큰 부품. 당김 탭(pull-tab) 접착제로 붙여 수리 시 떼어낼 수 있게 한다."],
    wireless: ["무선 충전 코일", "코일과 페라이트, 정렬 자석을 후면 쪽에 올린다."],
    backglass: ["후면 글라스로 닫기", "방수 접착제를 두르고 후면 글라스를 눌러 붙이면 IP68 하우징이 완성된다."],
  };

  /* ------------------------------------------------------------ shape helpers */
  function rrPath(target, cx, cy, w, h, r) {
    const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    r = Math.min(r, w / 2, h / 2);
    target.moveTo(x0 + r, y0);
    target.lineTo(x1 - r, y0); target.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
    target.lineTo(x1, y1 - r); target.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
    target.lineTo(x0 + r, y1); target.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
    target.lineTo(x0, y0 + r); target.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
    return target;
  }

  PB.phone3d = function (T, opts = {}) {
    const THREE = T.THREE;
    const root = new THREE.Group();
    T.scene.add(root);

    const rr = (cx, cy, w, h, r) => rrPath(new THREE.Shape(), cx, cy, w, h, r);
    const hole = (s, cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); s.holes.push(p); return s; };
    const rrHole = (s, cx, cy, w, h, r) => { s.holes.push(rrPath(new THREE.Path(), cx, cy, w, h, r)); return s; }; // 감김 방향은 ExtrudeGeometry가 자동 보정
    const poly = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
    /** 형상을 y0부터 두께 t만큼 압출(형상 +y → 폰 위쪽 = -z) */
    function slab(shape, y0, t, bevel = 0, curve = 18) {
      const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, t - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: curve });
      g.rotateX(-Math.PI / 2);
      g.translate(0, y0 + bevel, 0);
      return g;
    }
    const mats = []; // 모든 재질(엑스레이/클리핑 일괄 적용)
    function mat(color, o = {}) {
      const M = o.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
      const p = Object.assign({ color, roughness: 0.5, metalness: 0.1 }, o);
      delete p.physical;
      const m = new M(p);
      m.userData.base = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite, emissive: m.emissive ? m.emissive.getHex() : 0, emissiveIntensity: m.emissiveIntensity, side: m.side };
      mats.push(m);
      return m;
    }
    function mesh(geo, m, parent) { const o = new THREE.Mesh(geo, m); parent.add(o); return o; }
    function box(parent, m, w, h, d, sx, y, sy) { // sx,sy 형상 좌표(중심), y 바닥 높이
      const o = mesh(new THREE.BoxGeometry(w, h, d), m, parent);
      o.position.set(sx, y + h / 2, -sy);
      return o;
    }
    function cyl(parent, m, r, h, sx, y, sy, seg = 32, rTop) {
      const o = mesh(new THREE.CylinderGeometry(rTop == null ? r : rTop, r, h, seg), m, parent);
      o.position.set(sx, y + h / 2, -sy);
      return o;
    }
    // 결정적 난수(매번 같은 보드 배치)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    const parts = [], byId = {};
    function part(id) {
      const info = PART_INFO.find((p) => p.id === id);
      const g = new THREE.Group();
      g.name = id;
      root.add(g);
      const P = Object.assign({ group: g, meshes: [], base: new THREE.Vector3(), anchor: new THREE.Vector3() }, info);
      P.mats = [];
      parts.push(P); byId[id] = P;
      return P;
    }
    function finish(P) {
      P.group.traverse((o) => { if (o.isMesh) { P.meshes.push(o); o.userData.part = P.id; const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (!P.mats.includes(m)) P.mats.push(m); }); } });
    }

    /* ---------------------------------------------------- materials (공용 팔레트) */
    const C = {
      pcb: 0x1d5a3c, pcbTop: 0x22663f, gold: 0xd4a648, chip: 0x22252b, chipTop: 0x34383f, shield: 0xc4c8cf,
      copper: 0xc8733a, ferrite: 0x2a2b2e, magnet: 0x8a8f99, flex: 0xd99a2b, black: 0x101114,
    };

    /* ======================================================= 1. 후면 글라스 */
    {
      const P = part("backglass");
      const bump = { cx: 19, cy: 55, w: 28, h: 31, r: 7.5 };
      const lens = [{ x: 12.6, y: 62.6, r: 5.6 }, { x: 12.6, y: 47.4, r: 5.0 }, { x: 25.6, y: 55, r: 5.0 }];
      const sh = rr(0, 0, W - 1.2, L - 1.2, R - 0.6);
      lens.forEach((l) => hole(sh, l.x, l.y, l.r - 0.4));
      const glassM = mat(0x2e3a4b, { physical: true, roughness: 0.38, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.5 });
      mesh(slab(sh, 0, 0.62, 0.22), glassM, P.group);
      // 카메라 범프(바깥쪽 = -y 방향으로 돌출)
      const bs = rr(bump.cx, bump.cy, bump.w, bump.h, bump.r);
      lens.forEach((l) => hole(bs, l.x, l.y, l.r - 0.4));
      mesh(slab(bs, -1.5, 1.52, 0.35), mat(0x354255, { physical: true, roughness: 0.15, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }), P.group);
      // 렌즈 링(금속) + 렌즈 커버
      const ringM = mat(0xb9bec7, { metalness: 0.9, roughness: 0.25 });
      const lensM = mat(0x0b0e16, { physical: true, roughness: 0.05, metalness: 0.3, clearcoat: 1 });
      lens.forEach((l) => {
        const tor = mesh(new THREE.TorusGeometry(l.r, 0.55, 12, 40), ringM, P.group);
        tor.rotation.x = Math.PI / 2; tor.position.set(l.x, -1.9, -l.y);
        cyl(P.group, ringM, l.r + 0.35, 0.9, l.x, -2.25, l.y, 40).scale.set(1, 1, 1);
        cyl(P.group, lensM, l.r - 0.3, 0.2, l.x, -2.4, l.y, 40);
      });
      // 플래시, 마이크
      cyl(P.group, mat(0xfff4d6, { roughness: 0.2, emissive: 0x332a10, emissiveIntensity: 0.6 }), 1.9, 0.3, 26.5, -1.62, 66, 24);
      cyl(P.group, mat(0x111111), 0.5, 0.2, 26.5, -1.56, 43.5, 12);
      P.anchor.set(-20, -0.5, 20);
      P.bump = bump; P.lens = lens;
      finish(P);
    }

    /* ======================================================= 2. 무선충전 코일 */
    {
      const P = part("wireless");
      const cy = -6;
      cyl(P.group, mat(C.ferrite, { roughness: 0.8 }), 24.5, 0.18, 0, 0.66, cy, 64);
      const cu = mat(C.copper, { metalness: 0.85, roughness: 0.32 });
      for (let i = 0; i < 11; i++) {
        const t = mesh(new THREE.TorusGeometry(8.5 + i * 1.25, 0.42, 6, 72), cu, P.group);
        t.rotation.x = Math.PI / 2; t.scale.set(1, 1, 0.45); t.position.set(0, 0.95, -cy);
      }
      // 정렬 자석 링
      const mg = mat(C.magnet, { metalness: 0.7, roughness: 0.35 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const m = box(P.group, mg, 4.2, 0.5, 2.2, Math.cos(a) * 25.8, 0.66, cy + Math.sin(a) * 25.8);
        m.rotation.y = -a + Math.PI / 2;
      }
      // NFC 루프(사각) — 얇은 FPC
      const nfc = rr(0, cy, 44, 52, 6); rrHole(nfc, 0, cy, 41, 49, 5);
      mesh(slab(nfc, 0.66, 0.12), mat(C.flex, { roughness: 0.5, metalness: 0.3 }), P.group);
      // 연결 탭
      box(P.group, mat(C.flex, { metalness: 0.3 }), 4, 0.12, 22, -14, 0.66, 28);
      P.anchor.set(0, 1.0, 6);
      finish(P);
    }

    /* ======================================================= 3. 배터리 */
    {
      const P = part("battery");
      const b = { cx: 0, cy: -21.5, w: 64.5, h: 72, r: 3 };
      mesh(slab(rr(b.cx, b.cy, b.w, b.h, b.r), 1.05, 4.35, 0.6, 8), mat(0xcfd3da, { metalness: 0.55, roughness: 0.42 }), P.group);
      // 라벨
      const lab = box(P.group, mat(0x15171c, { roughness: 0.7 }), 54, 0.05, 40, 0, 5.4, -22);
      lab.userData.noPickSoft = true;
      box(P.group, mat(0xd8dde4, { roughness: 0.5 }), 30, 0.06, 4, -8, 5.42, -9);
      // 보호회로(PCM) + 커넥터 플렉스 (위쪽 끝)
      box(P.group, mat(C.pcb), 22, 1.0, 3.5, -12, 2.6, 15.6);
      box(P.group, mat(C.flex, { metalness: 0.3 }), 6, 0.15, 9, -14, 3.2, 20.5);
      // 당김 탭(흰 접착 띠)
      const tabM = mat(0xf2f2ee, { roughness: 0.8 });
      box(P.group, tabM, 6, 0.08, 10, -20, 1.0, -61.5); box(P.group, tabM, 6, 0.08, 10, 20, 1.0, -61.5);
      P.anchor.set(0, 5.6, 22);
      finish(P);
    }

    /* ======================================================= 4. 메인보드 (샌드위치) */
    // L자 보드 윤곽: 아래쪽은 폭 전체, 위쪽은 카메라 영역(오른쪽 위)을 비켜 간다
    const boardPts = [[-33, 16.5], [33, 16.5], [33, 37], [4.5, 37], [4.5, 71], [-29, 71], [-33, 67]];
    const boardShape = () => poly(boardPts);
    {
      const P = part("boardBottom");
      mesh(slab(boardShape(), 1.05, 0.8, 0, 4), mat(C.pcb, { roughness: 0.6 }), P.group);
      const yTop = 1.85;
      // AP + PoP DRAM
      box(P.group, mat(0x2b3a2f, { roughness: 0.6 }), 15.5, 0.25, 15.5, -14, yTop, 52);         // 패키지 기판
      box(P.group, mat(C.chip, { roughness: 0.35, metalness: 0.3 }), 14.5, 0.55, 14.5, -14, yTop + 0.25, 52); // AP
      box(P.group, mat(0x3a3f47, { roughness: 0.45 }), 14, 0.6, 14, -14, yTop + 0.8, 52);       // LPDDR (PoP)
      box(P.group, mat(0xd4d6da, { roughness: 0.6 }), 7, 0.02, 3, -14, yTop + 1.4, 54);          // 각인 느낌
      // UFS
      box(P.group, mat(C.chip, { roughness: 0.4, metalness: 0.2 }), 11.5, 1.0, 13, -17, yTop, 27);
      // PMIC ×2
      box(P.group, mat(C.chip, { roughness: 0.4 }), 7, 0.6, 7, 2, yTop, 27);
      box(P.group, mat(C.chip, { roughness: 0.4 }), 5.5, 0.6, 5.5, 13, yTop, 25);
      // 오디오 코덱 등
      box(P.group, mat(C.chip), 4.5, 0.5, 4.5, 24, yTop, 31);
      box(P.group, mat(C.chip), 4, 0.5, 6, -4, yTop, 62);
      P.anchor.set(-14, 3.5, -52);
      P.apPos = new THREE.Vector3(-14, 3, -52);
      finish(P);
    }
    {
      const P = part("interposer");
      const s = poly(boardPts);
      const inner = [[-31, 18.3], [31, 18.3], [31, 35.2], [2.7, 35.2], [2.7, 69.2], [-28.3, 69.2], [-31.2, 66.3]];
      s.holes.push(new THREE.Path(inner.map(([x, y]) => new THREE.Vector2(x, y)).reverse()));
      mesh(slab(s, 1.86, 1.6, 0, 4), mat(0x6b5a2e, { roughness: 0.6 }), P.group);
      // 위아래 패드 줄(금색 점) — 인스턴싱
      const padM = mat(C.gold, { metalness: 0.9, roughness: 0.3 });
      const pads = [];
      const along = (a, b, n) => { for (let i = 0; i <= n; i++) pads.push([a[0] + (b[0] - a[0]) * (i / n), a[1] + (b[1] - a[1]) * (i / n)]); };
      const mid = boardPts.map((p, i) => [(p[0] + inner[i][0]) / 2, (p[1] + inner[i][1]) / 2]);
      for (let i = 0; i < mid.length; i++) { const a = mid[i], b = mid[(i + 1) % mid.length]; along(a, b, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.4)); }
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 8), padM, pads.length * 2);
      const m4 = new THREE.Matrix4();
      pads.forEach(([x, y], i) => { m4.makeTranslation(x, 3.47, -y); im.setMatrixAt(i * 2, m4); m4.makeTranslation(x, 1.83, -y); im.setMatrixAt(i * 2 + 1, m4); });
      P.group.add(im);
      P.anchor.set(-31, 2.7, -40);
      finish(P);
    }
    {
      const P = part("boardTop");
      mesh(slab(boardShape(), 3.5, 0.75, 0, 4), mat(C.pcbTop, { roughness: 0.6 }), P.group);
      const y = 4.25;
      const sh = mat(C.shield, { metalness: 0.85, roughness: 0.38 });
      // 차폐 캔들
      box(P.group, sh, 30, 0.9, 16, -14, y, 52);
      box(P.group, sh, 20, 0.9, 12.5, -20, y, 27);
      box(P.group, sh, 17, 0.9, 12, 3, y, 26);
      box(P.group, sh, 9, 0.9, 8, 23, y, 30);
      // 보드 대 보드 커넥터 (디스플레이/카메라/배터리)
      const con = mat(0x30343a, { roughness: 0.5 });
      [[-2, 66, 3, 8], [0, 47, 3, 9], [-26, 20, 9, 3], [14, 20, 8, 3], [27, 20, 3, 6]].forEach(([x, yy, w, h]) => box(P.group, con, w, 0.8, h, x, y, yy));
      // 동축 RF 커넥터
      const rf = mat(0xd9dde3, { metalness: 0.9, roughness: 0.3 });
      [[-29, 64], [29, 22], [-30, 34]].forEach(([x, yy]) => cyl(P.group, rf, 0.7, 0.6, x, y, yy, 16));
      P.anchor.set(-14, 5.5, -52);
      finish(P);
    }
    // 수동소자 흩뿌리기 (두 보드 모두) — 인스턴싱
    function scatter(P, yTop, n, avoid) {
      const inside = (x, y) => {
        // L 다각형 내부 판정
        let c = false;
        for (let i = 0, j = boardPts.length - 1; i < boardPts.length; j = i++) {
          const [xi, yi] = boardPts[i], [xj, yj] = boardPts[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const im = new THREE.InstancedMesh(geo, mat(0xffffff, { roughness: 0.55 }), n);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
      const cols = [new THREE.Color(0xb89a6a), new THREE.Color(0x1b1b1b), new THREE.Color(0x8a7656), new THREE.Color(0xc9c4b8)];
      let k = 0, guard = 0;
      while (k < n && guard++ < n * 30) {
        const x = -32 + rnd() * 65, y = 17.5 + rnd() * 53;
        if (!inside(x, y) || x > 3.6 && y > 36) continue;
        if (avoid.some(([ax, ay, aw, ah]) => Math.abs(x - ax) < aw / 2 + 0.6 && Math.abs(y - ay) < ah / 2 + 0.6)) continue;
        const big = rnd() < 0.15;
        const w = big ? 1.6 : 0.6 + rnd() * 0.5, d = big ? 0.8 : 0.3, h = big ? 0.8 : 0.3;
        const rot = rnd() < 0.5 ? 0 : Math.PI / 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        m4.compose(p.set(x, yTop + h / 2, -y), q, s.set(w, h, d));
        im.setMatrixAt(k, m4);
        im.setColorAt(k, cols[Math.floor(rnd() * cols.length)]);
        k++;
      }
      im.count = k;
      P.group.add(im);
      P.meshes.push(im); im.userData.part = P.id;
      if (!P.mats.includes(im.material)) P.mats.push(im.material);
    }
    scatter(byId.boardBottom, 1.85, 260, [[-14, 52, 17, 17], [-17, 27, 13, 14.5], [2, 27, 8.5, 8.5], [13, 25, 7, 7], [24, 31, 6, 6], [-4, 62, 5.5, 7.5]]);
    scatter(byId.boardTop, 4.25, 160, [[-14, 52, 31, 17], [-20, 27, 21, 13.5], [3, 26, 18, 13], [23, 30, 10, 9], [-2, 66, 4, 9], [0, 47, 4, 10], [-26, 20, 10, 4], [14, 20, 9, 4], [27, 20, 4, 7]]);

    /* ======================================================= 5. 베이퍼 챔버 */
    {
      const P = part("vc");
      const s = poly([[-31, 19], [2.5, 19], [2.5, 68], [-28, 68], [-31, 65]]);
      mesh(slab(s, 5.15, 0.35, 0, 4), mat(0xd08a52, { metalness: 0.85, roughness: 0.3 }), P.group);
      // 열 인터페이스(TIM) 패드
      box(P.group, mat(0x8fa7b8, { roughness: 0.9 }), 15, 0.08, 15, -14, 5.08, 52);
      P.anchor.set(-14, 5.6, -40);
      finish(P);
    }

    /* ======================================================= 6. 후면 카메라 */
    {
      const P = part("cameras");
      const lens = byId.backglass.lens;
      const bodyM = mat(0x24272d, { roughness: 0.45, metalness: 0.4 });
      const canM = mat(0xa4aab3, { metalness: 0.85, roughness: 0.35 });
      const glass = mat(0x0a0c14, { physical: true, roughness: 0.03, metalness: 0.4, clearcoat: 1 });
      const coat = mat(0x3a2f7a, { physical: true, roughness: 0.05, metalness: 0.8, clearcoat: 1, transparent: true, opacity: 0.85 });
      // 메인(광각): 큰 VCM 캔 + 경통
      box(P.group, canM, 14, 4.6, 14, lens[0].x, 0.75, lens[0].y);
      cyl(P.group, bodyM, lens[0].r - 0.6, 2.4, lens[0].x, -1.6, lens[0].y, 36);
      cyl(P.group, coat, lens[0].r - 1.3, 0.1, lens[0].x, -1.62, lens[0].y, 36);
      box(P.group, mat(C.flex, { metalness: 0.3 }), 5, 0.15, 12, lens[0].x - 6, 4.5, lens[0].y - 9);
      // 초광각
      box(P.group, canM, 11, 3.8, 11, lens[1].x, 0.75, lens[1].y);
      cyl(P.group, bodyM, lens[1].r - 0.6, 2.4, lens[1].x, -1.6, lens[1].y, 32);
      cyl(P.group, coat, lens[1].r - 1.2, 0.1, lens[1].x, -1.62, lens[1].y, 32);
      // 잠망경 망원: 프리즘 블록 + 누운 경통 + 센서
      const tx = lens[2].x, ty = lens[2].y;
      box(P.group, canM, 10, 4.4, 9, tx, 0.75, ty + 1);                 // 프리즘 하우징
      box(P.group, bodyM, 9, 4.2, 18, tx, 0.85, ty - 13);               // 렌즈군 + 센서 (아래쪽으로 누움)
      const prism = mesh(new THREE.CylinderGeometry(3.4, 3.4, 7, 3), mat(0x9ec9ff, { physical: true, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1 }), P.group);
      prism.rotation.set(0, 0, Math.PI / 2); prism.position.set(tx, 2.6, -ty - 1);
      cyl(P.group, bodyM, lens[2].r - 0.6, 2.4, tx, -1.6, ty, 32);
      cyl(P.group, coat, lens[2].r - 1.2, 0.1, tx, -1.62, ty, 32);
      // 브래킷
      const br = rr(19, 52, 29, 34, 4); rrHole(br, 19, 52, 25, 30, 3);
      mesh(slab(br, 0.75, 1.0, 0, 6), mat(0x8d939c, { metalness: 0.8, roughness: 0.4 }), P.group);
      P.anchor.set(19, 6, -55);
      finish(P);
    }

    /* ======================================================= 7. 하단 모듈 */
    {
      const P = part("bottom");
      const yb = 1.1;
      mesh(slab(rr(0, -65.5, 62, 10.5, 2), yb, 0.7, 0, 4), mat(C.pcb, { roughness: 0.6 }), P.group);
      // USB-C 리셉터클
      const usb = mesh(slab(rr(0, 0, 9.0, 3.3, 1.6), 0, 7.5, 0, 10), mat(0xc0c5cc, { metalness: 0.9, roughness: 0.3 }), P.group);
      usb.rotation.x = Math.PI / 2; usb.position.set(0, 3.9, 73.2 - 7.5); // 바닥 끝(+z)으로 향함
      // 스피커 박스(오른쪽 = +x)
      box(P.group, mat(0x2b2d33, { roughness: 0.7 }), 21, 3.8, 12, 19.5, 1.3, -65);
      cyl(P.group, mat(0x55606e, { roughness: 0.4, metalness: 0.4 }), 4.2, 0.4, 19.5, 5.1, -65, 28);
      // LRA 진동 모터(왼쪽)
      box(P.group, mat(0x9aa0aa, { metalness: 0.75, roughness: 0.35 }), 20, 3.4, 9, -19.5, 1.4, -65.5);
      box(P.group, mat(C.flex, { metalness: 0.3 }), 4, 0.15, 6, -8, 4.6, -63);
      // 하단 마이크
      box(P.group, mat(0x222428), 3.5, 1.2, 2.8, -7, 1.8, -70.5);
      // 방수 가스켓(포트 주위)
      const gk = mesh(new THREE.TorusGeometry(4.8, 0.45, 8, 30), mat(0x111111, { roughness: 0.9 }), P.group);
      gk.scale.set(1, 0.5, 1); gk.position.set(0, 3.9, 72.6);
      P.anchor.set(0, 5.5, 65.5);
      finish(P);
    }

    /* ======================================================= 8. 메인 플렉스 */
    {
      const P = part("flex");
      const fm = mat(C.flex, { metalness: 0.35, roughness: 0.45 });
      box(P.group, fm, 3, 0.2, 77, 33.8 - 1.5, 1.05, -21.5 - 0);  // 배터리 오른쪽 옆
      box(P.group, fm, 8, 0.2, 3, 28.5, 1.05, -59.5);
      box(P.group, fm, 8, 0.2, 3, 28.5, 1.05, 17.5);
      box(P.group, mat(0x30343a), 5, 0.6, 2.5, 28, 1.25, 18);
      box(P.group, mat(0x30343a), 5, 0.6, 2.5, 28, 1.25, -60);
      P.anchor.set(32.3, 1.5, 21);
      finish(P);
    }

    /* ======================================================= 9. 프레임 + 미드플레이트 */
    {
      const P = part("frame");
      const ring = rr(0, 0, W, L, R); rrHole(ring, 0, 0, W - 3.0, L - 3.0, R - 1.5);
      const frameM = mat(0x9ea3ab, { metalness: 0.88, roughness: 0.3 });
      mesh(slab(ring, 0.0, TH, 0.5, 24), frameM, P.group);
      // 미드플레이트: 전면 카메라 자리만 구멍
      const mp = rr(0, 0, W - 2.6, L - 2.6, R - 1.3);
      hole(mp, 0, 66.5, 3.4);
      rrHole(mp, 0, 70.6, 14, 2.4, 1.2);
      mesh(slab(mp, 5.55, 0.55, 0, 16), mat(0xaab0b9, { metalness: 0.75, roughness: 0.45 }), P.group);
      // 안테나 분할선(수지) — 측면 레일을 끊는다
      const splitM = mat(0x2a2c31, { roughness: 0.6 });
      P.splits = [];
      [[-1, 56.5], [1, 56.5], [-1, -56.5], [1, -56.5], [-1, 20], [1, -28]].forEach(([side, y]) => {
        const s = box(P.group, splitM, 1.75, TH - 0.4, 1.0, side * (W / 2 - 0.82), 0.2, y);
        P.splits.push(s);
      });
      [[-14, 1], [14, -1]].forEach(([x, top]) => { // 위·아래 레일 분할
        const s = box(P.group, splitM, 1.0, TH - 0.4, 1.75, x, 0.2, top * (L / 2 - 0.82)); P.splits.push(s);
      });
      // 버튼: 전원(오른쪽 +x), 볼륨(왼쪽 -x)
      const btnM = mat(0x8e939b, { metalness: 0.9, roughness: 0.28 });
      box(P.group, btnM, 0.8, 2.4, 16, W / 2 + 0.25, 2.8, 33);
      box(P.group, btnM, 0.8, 2.4, 10, -(W / 2 + 0.25), 2.8, 40);
      box(P.group, btnM, 0.8, 2.4, 10, -(W / 2 + 0.25), 2.8, 27);
      // 하단 포트 구멍 + 스피커 그릴 (어두운 표시)
      const dark = mat(0x08090b, { roughness: 0.9 });
      const port = mesh(slab(rr(0, 0, 9.4, 3.6, 1.8), 0, 0.3, 0, 10), dark, P.group);
      port.rotation.x = Math.PI / 2; port.position.set(0, 4.0, L / 2 + 0.02 - 0.3 + 0.3);
      for (let i = 0; i < 7; i++) {
        const g1 = cyl(P.group, dark, 0.55, 0.3, 0, 0, 0, 10); g1.rotation.x = Math.PI / 2; g1.position.set(13 + i * 2.2, 4.0, L / 2 + 0.05);
        const g2 = cyl(P.group, dark, 0.55, 0.3, 0, 0, 0, 10); g2.rotation.x = Math.PI / 2; g2.position.set(-13 - i * 2.2, 4.0, L / 2 + 0.05);
      }
      P.anchor.set(-W / 2, 4, 0);
      finish(P);
    }

    /* ======================================================= 10. 전면 카메라·센서 */
    {
      const P = part("frontcam");
      const y0 = 4.4;
      box(P.group, mat(0x2a2d33, { metalness: 0.5, roughness: 0.4 }), 6, 2.0, 6, 0, y0, 66.5);
      cyl(P.group, mat(0x0b0d12, { physical: true, roughness: 0.05, clearcoat: 1 }), 1.6, 1.4, 0, y0 + 2.0, 66.5, 24);
      box(P.group, mat(0x30343a, { roughness: 0.5 }), 3.5, 1.2, 2.5, 8, y0 + 0.6, 66.8);       // 근접·조도
      box(P.group, mat(0x55606e, { roughness: 0.5, metalness: 0.4 }), 13, 1.4, 2.2, 0, y0 + 0.8, 70.6); // 수화부
      box(P.group, mat(C.flex, { metalness: 0.3 }), 3, 0.15, 12, -4, y0, 60);
      P.anchor.set(0, 7, -66.5);
      finish(P);
    }

    /* ======================================================= 11. 디스플레이 */
    {
      const P = part("display");
      // 화면 텍스처
      const cv = document.createElement("canvas"); cv.width = 512; cv.height = 1052;
      const g = cv.getContext("2d");
      const gr = g.createLinearGradient(0, 0, 512, 1052);
      gr.addColorStop(0, "#061a2e"); gr.addColorStop(0.45, "#0e4f5a"); gr.addColorStop(0.78, "#a8460c"); gr.addColorStop(1, "#24102e");
      g.fillStyle = gr; g.fillRect(0, 0, 512, 1052);
      for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + i * 0.015})`; g.beginPath(); g.arc(100 + i * 90, 640 - i * 40, 220 - i * 30, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#fff"; g.textAlign = "center";
      g.font = "600 92px -apple-system, 'Segoe UI', sans-serif"; g.fillText("9:41", 256, 230);
      g.font = "500 26px -apple-system, 'Segoe UI', sans-serif"; g.fillText("PhoneBook", 256, 280);
      const icols = ["#2dd4bf", "#ff9a52", "#5b8cff", "#f5b93a", "#ff6b6b", "#a585ff", "#3fcf7f", "#e6ebf5"];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { g.fillStyle = icols[(r * 4 + c) % 8]; const x = 70 + c * 124, y = 760 + r * 120; g.beginPath(); g.roundRect ? g.roundRect(x - 40, y - 40, 80, 80, 22) : g.rect(x - 40, y - 40, 80, 80); g.fill(); }
      g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.roundRect ? g.roundRect(56, 990, 400, 34, 17) : g.rect(56, 990, 400, 34); g.fill();
      const tex = new THREE.CanvasTexture(cv);
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      const dw = W - 3.4, dl = L - 3.4;
      tex.repeat.set(1 / dw, 1 / dl); tex.offset.set(0.5, 0.5);
      const ds = rr(0, 0, dw, dl, R - 1.7); hole(ds, 0, 66.5, 1.9);
      const screenM = mat(0x000000, { roughness: 0.7, envMapIntensity: 0.3, metalness: 0.0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85 });
      const sideM = mat(0x15161a, { roughness: 0.6 });
      const geo = slab(ds, 6.15, 0.95, 0, 18);
      const dm = new THREE.Mesh(geo, [screenM, sideM]); P.group.add(dm);
      // 바닥면(백플레인 쪽)은 어두운 색이 보이도록 별도 얇은 판
      mesh(slab(rr(0, 0, dw - 0.4, dl - 0.4, R - 1.9), 6.1, 0.06, 0, 18), mat(0x2b2e36, { roughness: 0.5, metalness: 0.4 }), P.group);
      // 접히는 패널 FPC + DDIC
      const fm = mat(C.flex, { metalness: 0.35, roughness: 0.45 });
      const bend = mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 16, Math.PI), fm, P.group);
      bend.rotation.set(0, Math.PI / 2, Math.PI / 2); bend.position.set(0, 6.55, L / 2 - 1.6);
      box(P.group, fm, 24, 0.12, 12, 0, 5.95, -(L / 2 - 1.7 - 6));
      box(P.group, mat(C.chip, { roughness: 0.35 }), 14, 0.25, 1.6, 0, 5.75, -63.5);
      P.screenMat = screenM; P.screenTex = tex;
      P.anchor.set(-24, 7.2, 30);
      finish(P);
    }

    /* ======================================================= 12. 커버 글라스 */
    {
      const P = part("cover");
      const cm = mat(0xcfe8ff, { physical: true, roughness: 0.14, metalness: 0.0, transparent: true, opacity: 0.18, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.5, depthWrite: false });
      const cs = rr(0, 0, W - 0.7, L - 0.7, R - 0.35);
      rrHole(cs, 0, 71.6, 11, 0.9, 0.45);  // 수화부 슬릿
      mesh(slab(cs, 7.15, 0.75, 0.3, 24), cm, P.group);
      // 테두리 검은 인쇄(BM)
      const bm = rr(0, 0, W - 1.0, L - 1.0, R - 0.5); rrHole(bm, 0, 0, W - 4.6, L - 4.6, R - 2.3);
      mesh(slab(bm, 7.12, 0.04, 0, 24), mat(0x050506, { roughness: 0.8 }), P.group);
      P.anchor.set(26, 8, -10);
      finish(P);
    }

    /* ------------------------------------------------------------ 상태/기본 위치 */
    parts.forEach((P) => {
      const bb = new THREE.Box3().setFromObject(P.group);
      P.size = bb.getSize(new THREE.Vector3());
      P.localCenter = bb.getCenter(new THREE.Vector3());
      P.group.userData.part = P.id;
    });
    // 메인보드 3장은 서로 붙어 다니되, 분해 시 약간 벌어진다(샌드위치 열기)
    const FRAME_LAYER = 5;
    const spacing = opts.spacing || 13;
    const state = { explode: 0, assembly: null, highlight: null, xray: false, clip: null, labels: false, extra: {} };
    const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

    function partOffset(P, e) {
      const d = P.layer - FRAME_LAYER;
      // 바깥 부품이 먼저 출발하는 스태거
      const delay = (1 - Math.min(1, Math.abs(d) / 5)) * 0.35;
      const k = ease((e - delay) / (1 - 0.35 + 1e-6) + (e >= 1 ? 1 : 0));
      return d * spacing * Math.min(1, k);
    }
    function apply() {
      parts.forEach((P) => {
        let y = partOffset(P, state.explode);
        let vis = true, op = 1;
        if (state.assembly != null) {
          const i = ORDER.indexOf(P.id);
          const p = SBclamp(state.assembly - i, 0, 1);
          vis = p > 0;
          const d = P.layer - FRAME_LAYER || 0.0001;
          const far = Math.sign(d) * (40 + Math.abs(d) * 6);
          y += far * (1 - ease(p));
          op = Math.min(1, p * 2.2);
        }
        P.group.position.set(0, y, 0);
        P.group.visible = vis;
        P._assemblyOpacity = op;
        if (state.extra[P.id]) { const e = state.extra[P.id]; P.group.position.x += e.x || 0; P.group.position.y += e.y || 0; P.group.position.z += e.z || 0; }
      });
      if (state.assembly != null || state._wasAssembly) restyle();
      state._wasAssembly = state.assembly != null;
      api && api.updateLabels();
    }
    const SBclamp = (x, a, b) => Math.min(b, Math.max(a, x));
    function restyle() {
      parts.forEach((P) => {
        const hl = state.highlight;
        const isHL = !!hl && hl.includes(P.id);
        const dim = hl && !isHL;
        const xray = state.xray && !isHL;
        const aop = P._assemblyOpacity == null ? 1 : P._assemblyOpacity;
        P.mats.forEach((m) => {
          const b = m.userData.base;
          let op = b.opacity;
          if (xray) op = Math.min(op, 0.12);
          else if (dim) op = Math.min(op, 0.35);
          op *= aop;
          const tr = b.transparent || op < 0.999;
          m.transparent = tr; m.opacity = op;
          m.depthWrite = tr ? (xray || dim ? false : b.depthWrite) : true;
          if (m.emissive) {
            if (isHL) { m.emissive.setHex(P.color); m.emissiveIntensity = 0.32; }
            else { m.emissive.setHex(b.emissive); m.emissiveIntensity = b.emissiveIntensity; }
          }
          m.clippingPlanes = state.clip != null ? clipPlanes : null;
          m.side = state.clip != null ? THREE.DoubleSide : b.side;
          // 셰이더 재컴파일은 비싸다: 프로그램이 바뀌는 경우에만 needsUpdate
          const key = (tr ? 1 : 0) + "|" + (state.clip != null ? 1 : 0);
          if (m.userData.key !== key) { m.userData.key = key; m.needsUpdate = true; }
        });
        P.meshes.forEach((o) => (o.renderOrder = isHL ? 2 : P.id === "cover" ? 3 : 0));
      });
    }
    const clipPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)];

    /* ------------------------------------------------------------ labels */
    const labels = {};
    parts.forEach((P) => {
      const L = T.label(P.name, P.anchor);
      L.obj = P.group;
      L.setVisible(false);
      labels[P.id] = L;
    });

    let api = null;
    api = {
      group: root, parts, byId, order: ORDER, stepText: STEP_TEXT, info: PART_INFO, dims: { W, L, TH },
      setExplode(e) { state.explode = e; apply(); },
      setAssembly(s) { state.assembly = s; apply(); },
      setOffset(id, v) { state.extra[id] = v; apply(); },
      highlight(id) { state.highlight = id ? (Array.isArray(id) ? id : [id]) : null; restyle(); api.updateLabels(); },
      setXray(on) { state.xray = !!on; restyle(); },
      setClip(x) { state.clip = x; if (x != null) clipPlanes[0].constant = x; restyle(); },
      setLabels(mode) { state.labels = mode; api.updateLabels(); },
      updateLabels() {
        parts.forEach((P) => {
          const show = P.group.visible && (state.labels === true || (!!state.highlight && state.highlight.includes(P.id)));
          labels[P.id].setVisible(show);
        });
      },
      partAt(obj) { while (obj && !obj.userData.part) obj = obj.parent; return obj ? byId[obj.userData.part] : null; },
      center(id) { const P = byId[id]; return P.group.localToWorld(P.localCenter.clone()); },
      get state() { return state; },
      labels,
    };
    restyle();
    apply();
    return api;
  };

  /** 부품 정보 카드 HTML */
  PB.partCardHTML = function (P, root) {
    const hex = "#" + P.color.toString(16).padStart(6, "0");
    const specs = Object.entries(P.specs || {}).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    const ch = PB.CHAPTERS.find((c) => c.slug === P.chapter);
    const link = ch ? `<a class="go" href="${root || ""}${ch.slug}.html">${ch.num}장 · ${ch.title} →</a>` : "";
    return `<button class="x" aria-label="닫기">×</button><h4><i style="background:${hex}"></i>${P.name}</h4><p>${P.desc}</p><dl>${specs}</dl>${link}`;
  };

  /** 카메라를 부드럽게 이동: PB.flyTo(T, [x,y,z], [tx,ty,tz], 초) */
  PB.flyTo = function (T, pos, target, dur = 1.2) {
    const THREE = T.THREE;
    const p0 = T.camera.position.clone(), t0 = T.controls ? T.controls.target.clone() : new THREE.Vector3();
    const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...target);
    let t = 0;
    if (T._fly) T._fly.done = true;
    const job = { done: false };
    T._fly = job;
    if (!T._flyHooked) {
      T._flyHooked = true;
      T.onFrame((dt) => { const j = T._fly; if (j && !j.done) j.step(dt); });
    }
    job.step = (dt) => {
      t = Math.min(1, t + dt / dur);
      const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      T.camera.position.lerpVectors(p0, p1, k);
      if (T.controls) T.controls.target.lerpVectors(t0, t1, k);
      else T.camera.lookAt(t1);
      if (t >= 1) job.done = true;
    };
  };
})();
