# PhoneBook — 인터랙티브 스마트폰 해부 교과서

스마트폰을 한 겹씩 분해하고 다시 조립하며 배우는 한국어 하드웨어 교과서입니다.
14개 챕터, 100여 개의 시뮬레이터, three.js로 만든 3D 분해·조립 모델로 구성되며, 각 장은 **스마트폰을 설계할 때 무엇이 중요한지**(트레이드오프)로 마무리합니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # → http://localhost:8000
```
KaTeX, three.js, 폰트는 CDN에서 불러오므로 인터넷 연결이 필요합니다.

## 구성
| 장 | 파일 | 주제 |
|---|---|---|
| 01 | chapters/anatomy.html | 3D 분해 뷰어, 스크롤 분해 투어, 조립 시뮬레이터, 단면, 두께·부피·전력·원가 예산 |
| 02 | chapters/display.html | OLED 적층, 서브픽셀, LTPO, PWM 디밍, 터치 |
| 03 | chapters/soc.html | SoC 블록, 공정·수율, DVFS, 스로틀링 |
| 04 | chapters/board.html | HDI PCB, 샌드위치 보드, PoP, 신호·전원 무결성 |
| 05 | chapters/battery.html | 리튬이온 셀, CC-CV, 열화, 사용 시간 |
| 06 | chapters/power.html | PMIC, 벅 컨버터, USB PD, 무선 충전 |
| 07 | chapters/rf.html | RF 체인, 금속 프레임 안테나, 빔포밍, 링크 버짓 |
| 08 | chapters/camera.html | 카메라 모듈, 범프, 잠망경, OIS |
| 09 | chapters/sensors.html | MEMS IMU, 센서 퓨전, 지문·얼굴 인식 |
| 10 | chapters/audio.html | 마이크로 스피커, MEMS 마이크, 햅틱 |
| 11 | chapters/thermal.html | 열 경로, 베이퍼 챔버, 2D 열 확산 시뮬 |
| 12 | chapters/mechanical.html | 프레임 재료, 강화 유리, 낙하, 방수, 공차 |
| 13 | chapters/design.html | 설계 플레이그라운드: 트레이드오프 종합 |
| 14 | chapters/glossary.html | 용어집, 종합 퀴즈 |

공통 코드: `css/style.css`(디자인 토큰, 라이트/다크), `js/common.js`(내비게이션, 캔버스·차트·3D 헬퍼), `js/phone3d.js`(절차적 3D 스마트폰 모델: 분해·조립·단면·강조).
챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요. 챕터를 추가하거나 제목·설명을 바꾼 뒤에는 `python3 tools/seo.py`로 메타 태그와 `sitemap.xml`을 다시 만듭니다.

3D 모델과 시뮬레이터의 수치는 전형적인 스마트폰을 단순화한 교육용 근사 모델이며, 특정 제품의 사양이 아닙니다.
자매편: [SensorBook · 이미지 센서 교과서](https://sensorbook.euiyun.com/)

## 라이선스
코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 자세한 내용은 [라이선스 안내](LICENSE.md)를 참고하세요.
