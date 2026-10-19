# 하늘소리 암송말씀

하늘소리교회에서 Expo SDK 55 / React Native / TypeScript로 만든 Android·iOS 암송 타이핑 앱입니다.

실사용 테스트는 **빌드된 앱을 실제 Android 휴대폰과 iPhone에 설치**하여 진행합니다. 로컬 빌드 명령으로 APK·IPA를 만들거나, GitHub Actions의 **Build and distribute app**을 실행하고 **Artifacts → install-files**에서 받습니다. 계정 설정과 설치 방법은 아래 **GitHub에서 설치 파일 배포**를 참고하세요.

에뮬레이터·시뮬레이터나 Expo Go는 실사용 테스트에 사용하지 않습니다. 개발 서버 없이 설치된 앱을 실행합니다.

첫 화면 입력창에 바로 포커스하고, `지난달 말씀`으로 지난 말씀을 보고 입력합니다. 한글 마지막 글자의 오답 판정은 다음 글자나 공백을 입력할 때까지 유예합니다. 문장부호, 중복 공백, NFC 차이는 비교에서 제외합니다.

## 말씀 원본

`매월 암송 말씀.md`는 업로드된 HWP 본문 추출 기록이며, 12개월 본문과 구절 주소를 검증한 뒤 HWP는 삭제했습니다. HWP에는 연도가 없어 현재 연도인 **2026년**으로 반영했습니다. 앱 콘텐츠의 유일한 원본은 `content/verses.json`입니다. 번역본 및 저작권 사용 허락은 미해결입니다.

## 콘텐츠 업데이트

1. 공개 GitHub 저장소에 이 프로젝트를 올립니다.
2. `.env.example`을 `.env`로 복사하고 `EXPO_PUBLIC_VERSES_URL=https://raw.githubusercontent.com/OWNER/REPO/main/content/verses.json`을 실제 주소로 바꿉니다. EAS production 환경에도 같은 값을 설정합니다.
3. 새 달을 JSON에 추가하고 `version`을 1 올립니다. `npm run check:content` 후 main에 머지합니다.
4. 앱을 다시 실행하면 새 콘텐츠를 받습니다. URL은 최초 앱 빌드에 포함되므로 URL 자체 변경에는 새 빌드가 필요하지만, 같은 URL의 말씀 변경에는 앱 업데이트가 필요 없습니다.

앱은 번들로 즉시 표시하고, 유효한 캐시와 원격 데이터로 갱신합니다. 네트워크 실패, 잘못된 데이터, 오래된 버전은 기존 콘텐츠를 유지합니다. 로컬 월 이전의 가장 최근 말씀을 폴백으로 사용하며, 이전 데이터 자체가 없으면 안내 메시지를 표시하고 미래 말씀은 노출하지 않습니다. 미래 달은 지난달 목록에서 제외합니다. 완료 횟수와 마지막 시각은 기기에만 저장합니다.

현재 공개 저장소/호스팅 URL은 제공되지 않아 원격 배포는 설정이 필요합니다. URL이 비어 있어도 번들 및 캐시로 동작합니다.

## 검증

자동 검사는 로직·콘텐츠·타입·번들 생성 확인용이며 실제 휴대폰 테스트를 대신하지 않습니다.

```sh
npm ci
npm test
npm run check:content
npx tsc --noEmit
npx expo export --platform ios --platform android
```

로컬에서 빌드하거나 GitHub에서 받은 APK·Ad Hoc IPA를 실제 휴대폰에 설치한 후 확인할 항목(Android·iOS 각각):

- 앱 종료 후 재실행: 홈/온보딩 없이 이달 말씀 입력창과 키보드 표시.
- `지난달 말씀` 한 번 탭: 직전 등록 달로 이동, 키보드가 있어도 원문 영역 표시. 긴 본문은 해당 영역에서 스크롤.
- `ㅎ → 하 → 한` 조합 중 마지막 글자는 빨갛게 깜빡이지 않음.
- 가리고 쓰기, 오답 밑줄, 완료 1회 저장, 다시 쓰기, 앱 재실행 후 기록 유지.
- 시스템 글자 크기 확대 시 스크롤과 입력 가능 여부.
- 오프라인 첫 실행, 캐시 후 오프라인, 새 버전 원격 갱신, 기기 월 경계.

두 플랫폼의 실제 휴대폰에서 설치·실행 검증 및 원격 콘텐츠 갱신 테스트를 통과하기 전에는 R1~R5의 최종 인수 완료로 보지 않습니다. 태그 배포로 재빌드한 출시 파일도 실제 휴대폰에서 다시 확인합니다.

테스트 결과는 GitHub 이슈 등에 다음 형식으로 남깁니다. 커밋 SHA와 EAS 빌드 ID는 설치 파일과 함께 제공되는 `BUILD.txt`에서 확인합니다.

| 항목                          | 기록                 |
| ----------------------------- | -------------------- |
| 커밋 SHA / EAS 빌드 ID        |                      |
| 기기 모델 / Android·iOS 버전 |                      |
| 한글 키보드 이름 / 버전       |                      |
| 테스트 날짜 / 테스트 담당자   |                      |
| 위 체크리스트 항목별 결과     | 통과 / 실패 / 미확인 |
| 실패 시 재현 절차             |                      |

## 이번 구현에서 확인한 결과

- 자동 테스트 22개, 콘텐츠 검증, TypeScript 검사 통과.
- Android 및 iOS JavaScript/Hermes 번들 생성 성공(네이티브 앱 설치 검증과는 다름).
- Markdown과 JSON의 12개월 본문 일치 및 HWP 삭제 확인.
- 빌드된 앱을 실제 Android 휴대폰·iPhone에 설치하는 실사용 검증은 아직 미실시.
- 2026-10-18 `npm audit`: 35건(높음 21, 보통 14). Expo/Metro 및 하위 의존성에 보고되며, 권장 수정 중 SDK 주요 버전 변경이 포함되어 강제 업데이트하지 않았습니다. 배포 전 호환성 검증을 포함한 해소가 필요합니다.

## 로컬에서 설치 파일 빌드

GitHub Actions 없이 현재 컴퓨터에서 네이티브 앱을 컴파일합니다. 기존 `eas.json`의 `release` 프로필을 사용하므로 개발 서버 없이 실행되는 APK·Ad Hoc IPA가 만들어집니다.

### 준비

- 공통: Node.js 22, npm, Git 및 Expo 계정이 필요합니다. 아래 최초 설정에 따라 `app.json`의 앱 식별자와 EAS 프로젝트 ID를 설정하고 `npx eas-cli@latest login`으로 로그인합니다. Git 저장소도 초기화·연결합니다.
- Android: Linux 또는 macOS에 JDK, Android SDK(Build Tools·Platform Tools 포함), NDK를 설치합니다. `JAVA_HOME`, `ANDROID_HOME`과 실행 경로를 설정합니다. SDK/NDK 버전은 사용 중인 Expo SDK 55 / React Native 빌드 요구에 맞춥니다. 에뮬레이터는 필요 없습니다.
- iOS: macOS의 Xcode 및 명령줄 도구, CocoaPods, Fastlane과 Apple Developer 서명·등록 기기가 필요합니다. Linux에서는 iOS 빌드를 실행할 수 없습니다.
- GitHub 빌드와 동일한 EAS 서명 키를 사용합니다. 처음 실행할 때 필요한 서명 설정에 응답합니다. 다른 키로 서명하면 기존 앱 위에 업데이트 설치할 수 없습니다.
- EAS production 환경의 `EXPO_PUBLIC_VERSES_URL`을 설정합니다. 로컬 환경에서도 필요한 값은 `export EXPO_PUBLIC_VERSES_URL='https://실제-호스트/verses.json'`으로 제공합니다. Secret visibility 값은 로컬 빌드에 자동 제공되지 않으므로 필요한 경우 로컬 환경 변수로 설정합니다.

### 실행 및 결과

```sh
npm ci
npm run build:android:local
# macOS에서 iOS 파일도 필요한 경우
npm run build:ios:local
```

| 명령                            | 결과 파일                        |
| ------------------------------- | -------------------------------- |
| `npm run build:android:local` | `artifacts/bible-memorize.apk` |
| `npm run build:ios:local`     | `artifacts/bible-memorize.ipa` |

각 명령은 자동 테스트·콘텐츠·타입 및 해당 플랫폼 설정을 먼저 검사하고 `eas build --local`을 실행합니다. 결과 파일은 다음 성공 빌드에서 교체되므로 비교할 파일은 미리 보관하세요. 실패한 빌드 뒤에 남은 파일은 이전 결과일 수 있습니다. `artifacts/`는 Git에 포함되지 않습니다.

Android 휴대폰에 APK를 직접 전달해 설치합니다. IPA는 아래 iOS 설치 절차를 따릅니다. 로컬 빌드는 GitHub에 자동 업로드하지 않습니다. 공식 배포는 기존 GitHub Releases 흐름을 사용합니다.

로컬 빌드에는 클라우드 EAS 빌드 ID가 없으므로 테스트 기록에 **로컬 빌드**, 소스 커밋·미커밋 변경 여부, 파일 SHA-256을 적습니다. Linux에서는 `sha256sum artifacts/bible-memorize.apk`, macOS에서는 `shasum -a 256 artifacts/bible-memorize.ipa`로 확인합니다.

컴파일은 로컬에서 수행하지만 Expo 인증·프로젝트 확인·서명 다운로드 및 의존성 설치에는 네트워크가 필요합니다. [Expo 로컬 빌드 공식 문서](https://docs.expo.dev/build-reference/local-builds/)

## GitHub에서 설치 파일 배포

스토어 제출은 하지 않습니다. GitHub Actions가 EAS에서 서명된 네이티브 앱을 빌드하고, APK·IPA를 GitHub에 복사합니다. Expo Go나 개발 서버 없이 실행됩니다. EAS는 빌드/서명 서비스이며 배포 파일은 GitHub에서 받습니다.

### 최초 1회 설정

1. 이 폴더를 GitHub 저장소에 올립니다. 현재 작업 폴더에는 Git 저장소 연결이 없으므로 먼저 저장소를 생성·연결해야 합니다.
2. `app.json`의 `expo.android.package`와 `expo.ios.bundleIdentifier`는 교회 웹사이트 도메인 기준 `com.heavensvoicechurch.biblememorize`로 설정되어 있습니다. 업데이트 후에도 식별자와 Android 서명 키를 유지해야 기존 앱 위에 설치하고 기록을 유지할 수 있습니다.
3. Expo 계정으로 `npx eas-cli@latest login`, `npx eas-cli@latest init`을 실행합니다. 생성된 `expo.extra.eas.projectId`와 필요한 `owner`를 포함한 app.json을 커밋합니다.
4. Expo 프로젝트의 Environment variables에서 **production** 환경에 `EXPO_PUBLIC_VERSES_URL`을 공개 HTTPS JSON 주소로 설정합니다. Visibility는 **Plain text**로 합니다. GitHub Actions의 변수나 로컬 `.env`에만 설정하면 원격 빌드에는 들어가지 않습니다. 주소가 브라우저에서 JSON으로 열리는지 확인합니다.
5. `npx eas-cli@latest build --platform android --profile release`를 로컬 터미널에서 한 번 실행해 Android 키스토어를 생성/등록합니다. 네이티브 빌드는 EAS에서 실행됩니다.
6. iOS도 필요하면 유료 Apple Developer 계정과 앱 식별자를 준비하고 `npx eas-cli@latest device:create`로 테스트 기기를 등록합니다. `npx eas-cli@latest build --platform ios --profile release`를 실행해 Ad Hoc 인증서·프로비저닝을 구성합니다. 새 기기 추가 시 이 대화형 빌드를 다시 실행해 프로파일을 갱신한 뒤 Actions를 실행합니다. CI는 기존 프로파일을 사용합니다.
7. GitHub 저장소 Settings → Secrets and variables → Actions → Secrets에 Expo 액세스 토큰을 **EXPO_TOKEN** 이름으로 추가합니다. 인증서·키 파일은 커밋하지 않습니다.
8. Settings → Actions → General에서 Actions 실행을 허용합니다. 태그 배포 작업에는 `contents: write` 권한이 필요합니다.

[Expo CI 초기 설정](https://docs.expo.dev/build/building-on-ci/)과 [iOS 내부 배포 조건](https://docs.expo.dev/build/internal-distribution/)을 참고하세요. EAS 사용량에 따른 비용/대기열이 발생할 수 있습니다.

### 설치 파일로 테스트

GitHub → Actions → **Build and distribute app** → Run workflow에서 플랫폼을 선택합니다. 처음에는 Android만 선택해도 됩니다. 테스트·콘텐츠·타입 검사 후 네이티브 빌드가 끝날 때까지 기다립니다. 성공한 실행의 **Artifacts → install-files** ZIP을 받아 압축을 풉니다.

- Android: APK를 휴대폰에 다운로드한 뒤 해당 브라우저/파일 앱의 설치 허용 설정으로 설치합니다.
- iOS: IPA를 GitHub에서 Mac으로 내려받고, 등록된 iPhone을 연결해 Apple Configurator의 Add → Apps → Choose from my Mac에서 설치합니다. iOS 16 이상에서는 개발자 모드가 필요합니다. [Apple 설치 안내](https://support.apple.com/en-au/guide/apple-configurator-mac/cad4cd08c03/mac)
- APK/IPA, `BUILD.txt`(커밋·빌드 ID), `SHA256SUMS`가 함께 제공됩니다. Actions 아티팩트는 14일 보관하며 접근에 GitHub 로그인이 필요할 수 있습니다.

**iOS 제한:** GitHub에 IPA를 게시해도 임의의 iPhone에서 설치할 수는 없습니다. 등록된 UDID, 유효한 서명/프로파일, Apple의 기기 수 제한과 만료 정책을 적용받습니다. 프로파일 만료 시 갱신·재빌드해야 합니다. 일반 사용자 전체에 무제한 설치하는 경로는 이 구성에 포함되지 않습니다.

### 테스트 통과 후 GitHub Releases에 게시

1. 위 실기기 체크리스트를 Android·iOS에서 확인합니다.
2. 출시할 앱 버전을 `app.json`에 반영하고 해당 커밋으로 수동 테스트 빌드를 만듭니다.
3. 테스트한 커밋에 버전 태그를 붙여 push합니다. 예: `git tag v1.0.0 TESTED_COMMIT_SHA`, `git push origin v1.0.0`.
4. `v*` 태그는 **양쪽 플랫폼**을 빌드하고 모두 성공하면 GitHub Release에 APK·IPA·해시·빌드 정보를 게시합니다. 따라서 iOS 초기 설정도 완료해야 태그 배포가 성공합니다. 수동 실행은 아티팩트만 생성합니다.
5. 태그 작업은 같은 소스 커밋을 재빌드하며 빌드 번호는 자동 증가합니다. 출시된 파일로 설치·업데이트를 다시 확인합니다. 정확히 테스트했던 바이너리 자체의 승격은 구현하지 않았습니다.

Releases 접근 권한은 저장소 공개/비공개 설정을 따릅니다. 공개 배포가 필요하면 공개 저장소를 사용합니다. 실패한 빌드는 게시하지 않습니다. 기존 Release를 자동 덮어쓰지 않으므로 배포를 수정할 때는 새 버전 태그를 사용합니다.

## 교회 로고

`assets/church-logo.png`는 `~/workspace/project/hvchurch/public/icon-512.png`의 원본 사본입니다. 화면의 **made by 하늘소리교회** 표시에 사용하며 시작 화면에 추가 단계를 두지 않습니다.

## 월 선택과 출석

- 지난달 화면에 올해 1월~이달 버튼을 표시합니다. 없는 월은 비활성, 미래 월은 숨깁니다. 1월에는 전년도 1~12월을 앞에 표시합니다. 이달 버튼은 시작 화면으로 돌아갑니다.
- 지난달에서도 가리고 쓰기를 사용할 수 있습니다. 월을 바꾸면 입력만 초기화하고 가리기 상태는 유지합니다.
- 실행·포그라운드 복귀와 분 단위 시각 갱신으로 이달·지난달을 다시 판정합니다.
- 어떤 월의 말씀이라도 완전히 맞게 입력하면 완료 순간의 기기 로컬 날짜를 출석으로 저장합니다. 같은 날은 한 번만 기록합니다.
- 시작 화면의 출석 요약을 누르면 달력으로 이동합니다. 오늘 미완료여도 어제까지 이어진 연속 출석은 유지합니다. 미래 달로는 이동하지 않습니다.
- 기존 완료 기록은 유지하며 과거 완료 횟수로 출석을 추정하거나 소급 생성하지 않습니다.

추가 실기기 확인: 부분 입력은 미출석, 최초 완료 시 알림·달력 체크, 같은 날 재완료 시 출석 1일 유지, 지난달 완료의 출석 반영, 월 선택 후 가리기 유지, 자정 전후 완료 날짜, 10월→11월 및 12월→1월 전환을 확인합니다.

## 말씀 앱 아이콘

`assets/word-icon.png`는 내장 image_gen 도구로 생성한 새 아이콘입니다. 짙은 녹색 바탕, 펼쳐진 성경, 금빛 십자가 모양의 빛으로 말씀을 표현하며 교회 제작 로고와 구분합니다.

생성 프롬프트: Use case: logo-brand. Asset type: final mobile app icon, square 1024x1024 opaque PNG, for a Korean Bible verse memorization typing app. Primary request: a new distinctive icon emphasizing God's Word, not a church building or the church logo. Subject: one beautifully simple open Bible with warm ivory pages and a small golden light rising from the central fold, the light subtly suggests a cross. Style: polished minimal flat illustration, bold clean shapes, extremely legible at 48px, very restrained soft shading. Palette: deep forest green background, ivory book, warm gold light, matching a calm reading app. Composition: centered compact symbol within the central 60% of the square, ample clear padding on all sides for Android circular masking. Full-bleed solid forest-green square background with square corners, no pre-rounded icon frame. No words, letters, numbers, watermark, border, church silhouette, photo mockup, or device. Deliver only the finished icon.
