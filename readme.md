### 자바스크립트 코드에 타입스크립트를 적용할 때 주의해야 할 점

- 기능적인 변경은 절대 하지 않을 것 (기능 변경보다는 타입을 입히는 데 중점을 두자)  
- 테스트 커버리지가 낮을 땐 함부로 타입스크립트를 적용하지 않을 것  
- 처음부터 타입을 엄격하게 적용하지 않을 것 (처음에는 루즈하게 잡아가면서 점진적으로 strict 레벨을 증가하는 것이 좋다.)  
  
### 자바스크립트 프로젝트에 타입스크립트 적용하는 방법

0. 자바스크립트 파일에 JSDoc으로 타입 시스템 입히기
1. 타입스크립트의 기본 환경 구성  
- NPM 초기화 ( npm init -y )  
- 타입스크립트 라이브러리 설치  
```sh
npm i -D typescript @babel/core @babel/preset-env @babel/preset-typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier eslint-plugin-prettier
```
- 타입스크립트 설정 파일 생성 및 기본 값 추가 ( tsconfig.js 설정 )
- 프로젝트 폴더 바로 아래에 ESLint 설정 파일 추가
```
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        useTabs: false,
        tabWidth: 2,
        printWidth: 80,
        bracketSpacing: true,
        arrowParens: 'avoid',
      },
    ],
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
};
```
- VSCode ESLint 플러그인 설정 추가

1. VSCode의 [ESLint 플러그인](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) 설치
2. VSCode에서 `ctrl` + `shift` + `p` / `cmd` + `shift` + `p` 키를 이용하여 명령어 실행 창 표시
3. 명령어 실행 창에 `open settings (json)` 입력 후 선택

![find-user-settings-on-command-palette](./command-palette.png)
4. VSCode 사용자 정의 파일인 `settings.json` 파일의 내용에 아래와 같이 ESLint 플러그인 관련 설정 추가.

```js
{
  // ... <-- 기존 내용을 꼭 유지한 상태에서 아래 내용을 추가하고 이 주석은 제거할 것
  "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
  },
  "eslint.alwaysShowStatus": true,
  "eslint.workingDirectories": [
      {"mode": "auto"}
  ],
  "eslint.validate": [
      "javascript",
      "typescript"
  ],
}
```
5. `ctrl` + `,` 또는 `cmd` + `,` 눌러서 VSCode 설정 파일(Settings)에 들어간 후 `format on save` 검색. 아래와 같이 체크가 안되어 있는지 확인.
![format-on-save-off](./format-on-save-off.png)  
pretteir 같이 코드를 정리해주는 다른 것들과 충돌이 일어나지 않게 하기 위함.

- 자바스크립트 파일을 타입스크립트 파일로 변환 ( .js => .ts )
- package.json 파일에 "build" : "tsc" 명령어 추가  
2. 명시적인 `any` 선언하기
    - `tsconfig.json` 파일에 `noImplicitAny` 값을 `true`로 추가

### 자바스크립트 프로젝트에 타입스크립트 적용하는 절차
자바스크립트 프로젝트에 타입스크립트를 적용하는 경우 아래의 절차를 따르면 도움이 됩니다.  
  
  
>- 타입스크립트 환경 설정 및 ts 파일로 변환
>- any 타입 선언
>- any 타입을 더 적절한 타입으로 변경

### 1. 타입스크립트 프로젝트 환경 구성
- 프로젝트 생성 후 NPM 초기화 명령어로 package.json 파일을 생성합니다.
- 프로젝트 폴더에서 npm i typescript -D로 타입스크립트 라이브러리를 설치합니다.
- 타입스크립트 설정 파일 tsconfig.json을 생성하고 기본 값을 추가합니다.
```
{
  "compilerOptions": {
    "allowJs": true,
    "target": "ES5",
    "outDir": "./dist",
    "moduleResolution": "Node",
    "lib": ["ES2015", "DOM", "DOM.Iterable"]
  },
  "include": ["./src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
  
- 서비스 코드가 포함된 자바스크립트 파일을 타입스크립트 파일로 변환합니다.
- 타입스크립트 컴파일 명령어 tsc로 타입스크립트 파일을 자바스크립트 파일로 변환합니다.
### 2. 엄격하지 않은 타입 환경(loose type)에서 프로젝트 돌려보기
- 프로젝트에 테스트 코드가 있다면 테스트 코드가 통과하는지 먼저 확인합니다.
- 프로젝트의 js 파일을 모두 ts 파일로 변경합니다.
- 타입스크립트 컴파일 에러가 나는 것 위주로만 먼저 에러가 나지 않게 수정합니다.
- 여기서, `기능을 사소하게라도 변경하지 않도록 주의`합니다.
- 테스트 코드가 성공하는지 확인합니다.
### 3. 명시적인 any 선언하기
- 프로젝트 테스트 코드가 통과하는지 확인합니다
- 타입스크립트 설정 파일에 noImplicitAny: true를 추가합니다.
- 가능한 타입을 적용할 수 있는 모든 곳에 타입을 적용합니다.
    - 라이브러리를 쓰는 경우 DefinitelyTyped에서 @types 관련 라이브러리를 찾아 설치합니다.
    - 만약, 타입을 정하기 어려운 곳이 있으면 명시적으로라도 any를 선언합니다.
- 테스트 코드가 통과하는지 확인합니다.
### 4. strict 모드 설정하기
- 타입스크립트 설정 파일에 아래 설정을 추가합니다.
```
{
  "strict": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
}
```
- any로 되어 있는 타입을 최대한 더 적절한 타입으로 변환합니다.
- as와 같은 키워드를 최대한 사용하지 않도록 고민해서 변경합니다.