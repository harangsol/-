# 하랑솔루션 25초 홍보영상 프롬프트 패키지

**콘셉트** 대서사 항해 영화 톤 · **길이** 25초 · **도구** Claude(기획·카피·프롬프트 다듬기) + ChatGPT(이미지·영상 생성)

---

## 0. 먼저 알아둘 것

- **영화 제목·감독 이름은 프롬프트에 넣지 않는다.** "오디세이처럼", "놀란 감독 스타일" 같은 표현은 생성 도구에서 거부되거나 결과가 흐려진다. 대신 그 느낌을 만드는 요소(70mm 필름 질감, 실제 바다와 폭풍, 거대한 스케일 대비, 최소한의 대사, 저음 위주의 음악)를 풀어서 쓴다. 아래 프롬프트는 모두 그렇게 작성했다.
- **이미지·영상 프롬프트는 영어로 쓴다.** 생성 모델은 영어 묘사에 더 정확히 반응한다. 화면에 들어갈 한국어 자막과 로고는 생성 도구가 아니라 편집 단계(프리미어, 캡컷 등)에서 얹는다. 생성 도구에 한글을 쓰게 하면 글자가 깨진다.
- **순서**: ① Claude로 대본 확정 → ② ChatGPT 이미지로 컷별 키프레임 6장 → ③ 키프레임을 첫 프레임으로 넣어 영상 생성(Sora 등) → ④ 편집에서 자막·로고·음악·내레이션 합성.

## 1. 콘셉트

**"모든 신호는, 반드시 닿는다."**

오디세이는 폭풍의 바다를 건너 집으로 돌아가는 이야기다. 이 영상에서 바다는 끊기고 흩어진 세상이고, 하랑솔루션은 그 어둠을 가로질러 **메시지와 연결을 끝까지 전달하는 등대**다. B2B 솔루션 회사의 본질(메시지 전송, 방송, 연결)을 한 척의 배와 한 줄기 빛으로 번역한다.

- **색감**: 깊은 남색 바다와 폭풍(브랜드 딥 블루) → 마지막에 시안빛 신호가 어둠을 가른다(브랜드 시안).
- **리듬**: 앞 15초는 느리고 무겁게, 16초에 빛이 터지면서 템포가 바뀌고, 마지막 5초는 정적과 로고.
- **소리**: 대사 없음. 파도, 삐걱이는 목재, 저음 브라스 한 음, 그리고 신호음 하나가 음악의 주제가 된다.

## 2. 25초 샷 구성

| 시간 | 샷 | 화면 | 자막(편집에서 삽입) | 소리 |
| --- | --- | --- | --- | --- |
| 0–4초 | S1 | 칠흑 같은 바다, 수평선 위 번개. 작은 배 한 척이 거대한 파도 앞에 서 있다 | — | 깊은 저음 드론, 멀리서 천둥 |
| 4–8초 | S2 | 선원의 손이 젖은 밧줄을 움켜쥔다. 눈가에 빗물, 먼 곳을 응시 | 세상은 넓고, 길은 끊겨 있었다 | 거친 숨, 밧줄이 당겨지는 소리 |
| 8–12초 | S3 | 폭풍 속 부감. 배가 파도 골짜기로 떨어진다. 어둠 속 흩어진 작은 불빛들(다른 배들)이 서로 닿지 못한다 | 모든 목소리가 닿지 못하던 곳 | 파도 굉음, 음악 고조 |
| 12–16초 | S4 | 절벽 위 등대. 거대한 렌즈가 회전을 시작한다 | — | 금속 기어 소리, 정적 1박 |
| 16–21초 | S5 | 시안빛 광선이 바다를 가로지르고, 흩어진 불빛들이 하나씩 응답하며 빛의 그물로 연결된다 | 우리는 연결을 만듭니다 | 신호음 + 브라스 풀 오케스트라 |
| 21–25초 | S6 | 폭풍이 걷힌 새벽 바다, 빛의 선이 수평선으로 이어진다. 화면이 어두워지며 로고 | **함께, 더 높이. 하랑솔루션** | 음악 끝음, 파도 한 번, 정적 |

> 컷 길이가 4~5초라서 영상 도구의 짧은 클립 단위(4~5초)에 맞춰 컷별로 생성하면 된다.

---

## 3. Claude용 프롬프트

### 3.1 대본·카피 다듬기

아래를 Claude에 그대로 붙여 넣는다.

```
너는 칸 광고제 수상 경력의 기업 브랜드 필름 감독이자 카피라이터다.

[회사]
하랑솔루션. 공공기관과 기업에 통합메시지전송(UMS), 대량메일, 모바일 푸시, 동영상 스트리밍·라이브 방송 같은 커뮤니케이션 솔루션을 공급하는 B2B 소프트웨어 회사다.
'하랑'은 "함께 높이"라는 뜻의 순우리말로 쓰인다.

[만들 것]
25초 브랜드 필름. 고대 서사시를 원작으로 한 대작 항해 영화의 톤.
- 폭풍의 바다 = 끊기고 흩어진 세상
- 등대의 빛 = 끝까지 닿는 하랑솔루션의 메시지와 연결
- 대사 없음. 자막 3줄 이하, 한 줄 15자 이내
- 마지막 컷은 브랜드 슬로건 + 로고

[아래 초안을 개선해줘]
(2장의 샷 구성 표를 붙여 넣기)

[출력 형식]
1. 자막 카피 대안 3세트 (각 세트는 무게감·시적 표현·직설 중 하나의 방향)
2. 슬로건 대안 5개
3. 확정 샷 리스트: 시간, 화면, 카메라 움직임, 조명, 사운드
4. 이 샷 리스트를 영상 생성 AI용 영어 프롬프트로 변환 (샷당 1개, 60단어 이내)
```

### 3.2 생성 결과 개선 요청

영상을 한 번 뽑은 뒤 마음에 안 드는 컷이 있으면:

```
아래는 S3 컷의 영상 생성 프롬프트와 결과에 대한 내 불만이다.
[프롬프트] (붙여 넣기)
[문제] 배가 장난감처럼 작아 보이고, 파도가 CG 티가 난다.
대작 영화의 실사 촬영처럼 보이도록 프롬프트를 고쳐줘.
카메라, 렌즈, 조명, 물리적 질감 묘사를 강화하고, 바뀐 부분을 설명해줘.
```

---

## 4. ChatGPT 이미지 프롬프트 (키프레임 6장)

**공통 스타일 블록**: 모든 샷 프롬프트 끝에 이 문단을 붙여 여섯 장의 톤을 맞춘다.

```
Style: epic large-format film still, shot on 65mm IMAX film, anamorphic 2.39:1 widescreen,
practical in-camera effects, real ocean and real weather, no CGI look.
Color grade: deep navy blues and near-black shadows, cold desaturated tones,
with a single accent of electric cyan light. Heavy natural film grain, subtle halation.
Mood: mythic, solemn, vast scale, humans tiny against nature.
No text, no letters, no logos, no watermark.
```

**S1 — 폭풍 전야**
```
A vast pitch-black ocean at night, a single small wooden sailing ship facing a towering
wave several times its height. Distant lightning splits the horizon, briefly illuminating
the storm clouds. Extreme wide shot, ship occupies less than 5% of the frame.
[공통 스타일 블록]
```

**S2 — 선원의 손**
```
Extreme close-up of a weathered sailor's hands gripping a soaked, fraying rope,
knuckles white, rain and sea spray streaming across the skin. Shallow depth of field,
background is a blur of dark waves and a faint lantern glow.
[공통 스타일 블록]
```

**S3 — 흩어진 불빛**
```
High aerial top-down view of a violent storm-tossed sea at night. One ship plunges into
the trough between enormous waves. Scattered far across the dark water are tiny isolated
lantern lights of other distant ships, each alone, unable to reach each other.
[공통 스타일 블록]
```

**S4 — 등대**
```
A monumental stone lighthouse on a sheer black cliff above crashing waves, low-angle shot
looking up. Inside the lantern room, a giant brass-and-glass Fresnel lens begins to turn,
the first sliver of cyan light catching its edges. Rain lashing sideways.
[공통 스타일 블록]
```

**S5 — 연결**
```
A powerful beam of electric cyan light sweeps across the dark stormy ocean from a distant
lighthouse. Where it touches, the scattered ship lanterns ignite in the same cyan color and
thin threads of light connect them to one another, forming a glowing network across the sea.
Wide cinematic shot, the network stretching to the horizon.
[공통 스타일 블록]
```

**S6 — 새벽**
```
Dawn after the storm, a calm silver-blue ocean with soft mist. A fleet of ships sails
together toward the horizon, joined by faint lines of cyan light that fade into the rising
sun. Serene, hopeful, vast negative space in the upper half of the frame for a title.
[공통 스타일 블록]
```

> S6의 상단 여백은 편집 단계에서 슬로건과 로고를 얹을 자리다.

---

## 5. 영상 생성 프롬프트 (컷별)

4장에서 만든 키프레임을 **첫 프레임(이미지 입력)** 으로 넣고, 아래 프롬프트로 움직임을 준다. 이미지로 이미 장면이 정해졌으므로 영상 프롬프트는 **카메라 움직임, 물리 동작, 소리** 위주로 쓴다.

| 샷 | 길이 | 프롬프트 |
| --- | --- | --- |
| S1 | 4초 | `Slow push-in toward the tiny ship as the giant wave rises and curls above it. Lightning flashes twice on the horizon. Heavy, weighty ocean motion, real water physics. Audio: deep sub-bass drone, distant rolling thunder. Cinematic 65mm film look.` |
| S2 | 4초 | `Handheld close-up, slight shake. The hands tighten on the wet rope, the rope creaks and strains, water droplets fly off. Rack focus from the hands to a distant lantern. Audio: heavy breathing, creaking rope, rain.` |
| S3 | 4초 | `Top-down aerial camera slowly descends as the ship drops into a massive wave trough and is swallowed by spray. Scattered distant lanterns flicker weakly across the dark sea. Audio: roaring waves, rising orchestral tension.` |
| S4 | 4초 | `Slow low-angle crane up the lighthouse tower. Inside, the huge Fresnel lens begins to rotate with heavy mechanical weight, a first cyan glint appears. Audio: grinding brass gears, then one beat of total silence.` |
| S5 | 5초 | `The cyan beam sweeps across the ocean in one majestic arc. Each lantern it touches ignites cyan, and threads of light link them together one by one into a glowing network to the horizon. Camera pulls back to reveal the full scale. Audio: a single clear signal tone, then a full brass and choir swell.` |
| S6 | 4초 | `Static wide shot, dawn light slowly brightening. Ships glide calmly toward the horizon, cyan light lines gently fading into sunlight. Mist drifts. Audio: final sustained orchestral note resolving, one soft wave, then silence.` |

**공통 네거티브(도구가 지원하면 넣는다)**
```
no text, no subtitles, no logos, no cartoon, no video-game look, no plastic CGI water,
no modern ships, no people facing camera, no lens flare overuse
```

---

## 6. 음악·내레이션 (선택)

- **음악**: AI 음악 도구(Suno 등)를 쓴다면 → `Epic cinematic score, 25 seconds, deep low brass and taiko drums building slowly, a single clear synth signal motif at 16 seconds, full orchestra and choir swell, ends on one sustained resolving note then silence. Mythic, maritime, no vocals lyrics.`
- **내레이션을 넣는다면**(대사 없는 버전을 먼저 권장): 저음의 남성 또는 차분한 여성 목소리로 마지막 4초에만 "함께, 더 높이. 하랑솔루션." 한 줄.

## 7. 편집 체크리스트

- [ ] 레터박스 2.39:1 유지, 최종 출력은 16:9(유튜브·홈페이지) + 9:16(쇼츠·릴스) 두 버전
- [ ] 자막 폰트는 세리프 계열(예: 본명조) 흰색, 페이드 인·아웃 0.5초
- [ ] S4→S5 전환에 0.3초 완전 암전 + 무음을 넣어 빛이 터지는 순간을 강조
- [ ] 로고는 S6 마지막 2초에 등장, 시안빛 글로우 살짝
- [ ] 전체 컷 색보정 통일(컷마다 톤이 다르면 저가 AI 영상처럼 보인다)
- [ ] 생성 도구의 상업적 이용 조건과 워터마크 여부 확인
