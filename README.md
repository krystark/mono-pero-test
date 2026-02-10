
# ПОРТАЛ — руководство по проекту

**krystark-app-portal** — монорепозиторий корпоративного портала (главное веб‑приложение) для внутренних сервисов группы компаний ССК.  
Фронтенд: React + TypeScript + Vite + Tailwind, модульная архитектура через ядро `@krystark/app-kernel` и отдельные модули‑пакеты.

https://docs.google.com/document/d/15Iq9gp4POgv7rw0-WFwSpIYmqS1IGBh0P0lYoNBwNbA/edit?tab=t.0#heading=h.99vax446mw92



## 1. Структура монорепозитория

```text
.
├─ package.json           # корневой конфиг монорепы (workspaces)
├─ .env                   # токены для GitHub Packages (локально/CI)
├─ apps/
│  └─ web/                # приложение @krystark/portal-web (Vite + React)
│      ├─ src/
│      ├─ index.html
│      ├─ vite.config.ts
│      ├─ tailwind.config.ts
│      ├─ tsconfig.json
│      ├─ .env.development
│      └─ .env.production
└─ packages/
   ├─ app-kernel/         # @krystark/app-kernel — ядро портала
   ├─ app-contracts/      # @krystark/app-contracts — типы и контракты
   └─ app-common/         # @krystark/app-common — общая инфраструктура
```

Во фронтенд‑приложении также используются внешние (для этого репозитория) модули:

- `@krystark/ui-kit-components`, `@krystark/ui-kit-icons`, `@krystark/ui-kit-theme` — дизайн‑система / UI‑Kit.
- `@krystark/commerce` — модуль коммерции (квартирограмма, карточки товаров и т.д.).
- `@krystark/car-sharing` — модуль автопарка и бронирования.
- `@krystark/portal-juridic` — юридический модуль.
- `@krystark/portal-marketing` — маркетинг.
- `@krystark/portal-analitics` — аналитика.

Эти модули подключаются как npm‑пакеты из GitHub Packages и динамически регистрируют свои роуты/навигацию в ядре портала.

## 2. Требования

- **Node.js** `>= 20.0.0` (жёсткое требование, прописано в `engines`).
- npm 9+ (или совместимая версия pnpm/yarn, но официально используется npm).
- Доступ к **GitHub Packages** с правом чтения (и публикации — для мейнтейнеров).
- Современный браузер с поддержкой ES2022 (для билда на прод).

Основные технологии:

- React 18, React Router 7.
- TypeScript 5.
- Vite 6.
- MobX 6 + mobx-react-lite.
- @tanstack/react-query 5.
- TailwindCSS 3 + SCSS.
- ESLint 9 + TypeScript ESLint.

## 3. Workspaces и корневой package.json

Корень репозитория:

```jsonc
{
  "name": "krystark-app-portal",
  "private": true,
  "version": "1.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "web:install": "dotenv -e .env -- npm install -w @krystark/portal-web --install-strategy=nested",
    "web:ci": "dotenv -e .env -- npm ci -w @krystark/portal-web --install-strategy=nested",
    "web:dev": "npm run dev -w @krystark/portal-web",
    "web:preview": "npm run preview -w @krystark/portal-web",
    "web:typecheck": "npm run typecheck -w @krystark/portal-web",
    "web:lint": "npm run lint -w @krystark/portal-web",
    "web:lint-fix": "npm run lint-fix -w @krystark/portal-web",

    "build:common": "npm run build -w @krystark/app-common",
    "build:contracts": "npm run build -w @krystark/app-contracts",
    "build:kernel": "npm run build -w @krystark/app-kernel",
    "build:packages": "npm run build:contracts && npm run build:kernel && npm run build:common",
    "build:web": "npm run build -w @krystark/portal-web",
    "build": "npm run build:packages && npm run build:web",

    "clean": "npx rimraf \"apps/**/dist\" \"packages/**/dist\" \"**/node_modules/.vite\"",

    "publish:common": "npx dotenv -e .env -- npm publish -w @krystark/app-common --access=restricted",
    "publish:kernel": "npx dotenv -e .env -- npm publish -w @krystark/app-kernel --access=restricted",
    "publish:contracts": "npx dotenv -e .env -- npm publish -w @krystark/app-contracts --access=restricted"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

> Все команды `web:*` и `build:*` строго привязаны к workspace‑пакетам. Запуск «из корня» всегда идёт через `-w @krystark/...`.

## 4. Настройка доступа к GitHub Packages

Доступ к приватным пакетам `@krystark/*` осуществляется через **GitHub Packages**.

### 4.1. Корневой `.env`

В корне репозитория лежит `.env` (не коммитится в публичный репозиторий с реальными значениями):

```env
NODE_AUTH_TOKEN=        # токен с правом публикации (publish)
NODE_AUTH_TOKEN_READ=   # токен только на чтение (install)
```

- `NODE_AUTH_TOKEN` используется в скриптах `publish:*`.
- `NODE_AUTH_TOKEN_READ` можно использовать для локальной установки зависимостей или CI, где запрещён publish.

### 4.2. Локальный `.npmrc` (обязателен)

Файл `.npmrc` добавлен в `.gitignore`, потому что в нём может быть разный токен у разных разработчиков/окружений.  
**Каждый разработчик обязан создать свой `.npmrc` в корне проекта.**

Рекомендуемое содержимое:

```ini
@krystark:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
always-auth=true
```

Варианты использования:

- Для **локальной разработки только с чтением** можно:
    - либо использовать единый токен и выставить его в `NODE_AUTH_TOKEN`,
    - либо поменять переменную в `.npmrc` на `${NODE_AUTH_TOKEN_READ}`.
- Для **публикации пакетов** в CI/локально необходимо, чтобы `NODE_AUTH_TOKEN` имел права `write:packages`.

> Скрипты `web:install` и `web:ci` запускаются через `dotenv -e .env`, поэтому переменные из `.env` автоматически подтягиваются в `.npmrc`.

## 5. Переменные окружения фронта (apps/web)

Все переменные для фронтенда лежат в `apps/web/.env.*` и читаются через `import.meta.env`.  
Обязателен префикс `VITE_`.

### 5.1. `.env.development`

```env
VITE_MODE=development

VITE_PATH_URL=/
VITE_CANONICAL=

VITE_API_URL=
VITE_API_CAR_SHARING_URL=
VITE_WS_URL=

VITE_CHESS_API=
VITE_API_TOKEN_BASIC=

VITE_KEY_LOGIN=           # ключ источника логина (например, portal21)
VITE_TEST_USER_AUTH_TOKEN=# dev-токен для обхода авторизации (по необходимости)
```

### 5.2. `.env.production`

```env
VITE_MODE=production

VITE_PATH_URL=/portal/
VITE_CANONICAL=

VITE_API_URL=
VITE_API_CAR_SHARING_URL=
VITE_WS_URL=

VITE_BX_WEB_URL=
VITE_BX_API_URL=

VITE_CHESS_API=
VITE_API_TOKEN_BASIC=

VITE_KEY_LOGIN=
```

### 5.3. Назначение ключей

- `VITE_MODE` — логический режим приложения (`development` / `production`), используется для отдельных фич.
- `VITE_PATH_URL` — публичный префикс приложения:
    - в dev обычно `/`;
    - на Bitrix — `/portal/` или другой путь.
      Используется:
    - как `base` в `vite.config.ts`,
    - как `basename` в `BrowserRouter`.
- `VITE_CANONICAL` — канонический URL раздела портала (для `<link rel="canonical">` в SEO).
- `VITE_API_URL` — базовый REST API портала (основные сервисы).
- `VITE_API_CAR_SHARING_URL` — URL микросервиса бронирования авто.
- `VITE_WS_URL` — адрес WebSocket/real‑time сервиса.
- `VITE_CHESS_API` — API для создания/управления сделками (шахматка/CRM).
- `VITE_API_TOKEN_BASIC` — Basic‑токен для `VITE_CHESS_API` (создание сделки и т.п.).
- `VITE_BX_WEB_URL` — базовый URL веб‑интерфейса Bitrix (для ссылок/редиректов).
- `VITE_BX_API_URL` — REST‑endpoint Bitrix (`/rest`).
- `VITE_KEY_LOGIN` — ключ источника для OAuth‑логина (гет‑параметр `source`), чтобы бэкенд понимал, что пользователь пришёл из Портала.
- `VITE_TEST_USER_AUTH_TOKEN` — тестовый токен авторизации для локальной разработки; на проде **не используется**.

## 6. Конфигурация приложения @krystark/portal-web

### 6.1. package.json (apps/web)

```jsonc
{
  "name": "@krystark/portal-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "lint": "eslint ..",
    "lint-fix": "eslint .. --fix",
    "typecheck": "tsc -p ."
  },
  "dependencies": {
    "@krystark/app-common": "*",
    "@krystark/app-contracts": "*",
    "@krystark/app-kernel": "*",

    "@krystark/ui-kit-components": "^0.8.3",
    "@krystark/ui-kit-icons": "0.2.2",
    "@krystark/ui-kit-theme": "0.3.8",

    "@krystark/commerce": "0.9.8",
    "@krystark/car-sharing": "0.1.3",
    "@krystark/portal-juridic": "0.0.1",
    "@krystark/portal-marketing": "0.0.1",
    "@krystark/portal-analitics": "0.0.1",

    "@tanstack/react-query": "^5.74.0",
    "dayjs": "^1.11.9",
    "mobx": "^6.12.4",
    "mobx-react": "^9.1.1",
    "mobx-react-lite": "^4.0.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-helmet": "^6.1.0",
    "react-router": "^7.1.1",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.13.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/react-helmet": "^6.1.11",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.13.0",
    "eslint-plugin-react": "^7.37.2",
    "globals": "^15.11.0",
    "postcss": "^8.4.49",
    "sass": "^1.83.4",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.11.0",
    "vite": "^6.3.5"
  }
}
```

### 6.2. tsconfig (apps/web/tsconfig.json)

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "baseUrl": ".",
    "types": ["vite/client"],
    "paths": {
      "@krystark/app-kernel": ["../../packages/kernel/src"],
      "@krystark/app-contracts": ["../../packages/contracts/src"],
      "@krystark/app-common": ["../../packages/common/src"]
    }
  },
  "include": ["src", "vite.config.ts", "tailwind.config.js", "postcss.config.js"]
}
```

> Для dev‑режима пакеты `app-*` подключаются прямо из исходников (`paths`), для сборки/прод деплоя — используются скомпилированные/dist‑версии.

### 6.3. Tailwind (apps/web/tailwind.config.ts)

```ts
import path from 'node:path';
import type { Config } from 'tailwindcss';
import themePreset from '@krystark/ui-kit-theme/tailwind.preset';

const r = (p: string) => path.resolve(__dirname, p).replace(/\\/g, '/');
const isDev = process.env.NODE_ENV !== 'production';

function pkgDir(pkg: string) {
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`)).replace(/\\/g, '/');
  } catch {
    return null;
  }
}

const commonPkg = pkgDir('@krystark/app-common');

const content: string[] = [
  r('./index.html'),
  r('./src/**/*.{js,ts,jsx,tsx}'),

  // ядро
  r('../../packages/common/src/**/*.{js,jsx,tsx}'),

  // UI-kit пакеты
  r('./node_modules/@krystark/ui-kit-components/dist/**/*.{js,jsx,tsx}'),
  r('./node_modules/@krystark/ui-kit-icons/dist/**/*.{js,jsx,tsx}'),

  // commerce
  r('./node_modules/@krystark/commerce/dist/**/*.{js,jsx,tsx}'),
  r('../../../portal-commerce/src/**/*.{ts,tsx,js,jsx}'),

  // car-sharing
  r('./node_modules/@krystark/car-sharing/dist/**/*.{js,jsx,tsx}'),
  r('../../../portal-car-sharing/src/**/*.{ts,tsx,js,jsx}'),

  // portal-juridic
  r('./node_modules/@krystark/portal-juridic/dist/**/*.{js,jsx,tsx}'),
  r('../../../portal-juridic/src/**/*.{ts,tsx,js,jsx}'),

  // portal-marketing
  r('./node_modules/@krystark/portal-marketing/dist/**/*.{js,jsx,tsx}'),
  r('../../../portal-marketing/src/**/*.{ts,tsx,js,jsx}'),

  // portal-analitics
  r('./node_modules/@krystark/portal-analitics/dist/**/*.{js,jsx,tsx}'),
  r('../../../portal-analitics/src/**/*.{ts,tsx,js,jsx}')
];

content.push(r('./node_modules/@krystark/app-common/dist/**/*.{js,jsx,tsx}'));

// В dev дополнительно сканируем src пакета common из монорепы
if (isDev) {
  content.push(r('../../packages/common/src/**/*.{ts,tsx}'));
} else if (commonPkg) {
  content.push(`${commonPkg}/**/*.{js,jsx,ts,tsx}`);
}

const config: Config = {
  presets: [themePreset],
  content,
  theme: { extend: {} },
  plugins: []
};

export default config;
```

Ключевые моменты:

- Tailwind использует **общий пресет** дизайн‑системы из `@krystark/ui-kit-theme/tailwind.preset`.
- Сканируются:
    - исходники самого приложения;
    - общие пакеты из монорепы;
    - дистрибутивы UI‑Kit и модулей;
    - при наличии — локальные исходники модулей (`portal-commerce`, `portal-car-sharing`, и т.д.), лежащие рядом с порталом.

### 6.4. Vite (apps/web/vite.config.ts)

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = (env.VITE_PATH_URL || '/').replace(/\/?$/, '/');

  const isDev = mode !== 'production';

  return {
    base,
    plugins: [react()],

    resolve: {
      alias: {
        // dev-ссылки на исходники модулей
        ...(isDev ? { '@krystark/commerce': path.resolve(__dirname, '../../../portal-commerce/src') } : {}),
        ...(isDev ? { '@krystark/car-sharing': path.resolve(__dirname, '../../../portal-car-sharing/src') } : {}),
        ...(isDev ? { '@krystark/portal-juridic': path.resolve(__dirname, '../../../portal-juridic/src') } : {}),
        ...(isDev ? { '@krystark/portal-marketing': path.resolve(__dirname, '../../../portal-marketing/src') } : {}),
        ...(isDev ? { '@krystark/portal-analitics': path.resolve(__dirname, '../../../portal-analitics/src') } : {}),

        '@krystark/app-kernel': path.resolve(__dirname, '../../packages/kernel/src'),
        '@krystark/app-contracts': path.resolve(__dirname, '../../packages/contracts/src'),
        '@krystark/app-common': path.resolve(__dirname, '../../packages/common/src')
      },

      dedupe: ['react', 'react-dom', 'mobx', 'mobx-react-lite']
    },

    optimizeDeps: {
      exclude: [
        '@krystark/commerce',
        '@krystark/car-sharing',
        '@krystark/portal-juridic',
        '@krystark/portal-marketing',
        '@krystark/portal-analitics'
      ]
    },

    build: { target: 'es2022', modulePreload: true },
    esbuild: { target: 'es2022' },
    server: { hmr: { protocol: 'ws', host: 'localhost' } }
  };
});
```

Особенности:

- `base` берётся из `VITE_PATH_URL` и должен соответствовать пути размещения портала на сервере.
- В dev‑режиме модули `@krystark/...` могут подключаться напрямую из соседних репозиториев (`portal-commerce`, `portal-car-sharing` и т.д.).
- Общие пакеты ядра всегда берутся из `packages/*` монорепы.
- `dedupe` исключает дублирование React/MobX при работе с модульными пакетами.

## 7. Точка входа приложения (apps/web/src/index.tsx)

Главный bootstrap:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { applyInitialTheme } from './app/functions/theme';
import App from './app/views/App';

import {
  nav,
  setStore,
  setEnv,
  attachCommonEventHandlers,
  waitForKernelIdle,
  getStore
} from '@krystark/app-kernel';
import {
  attachLightboxDelegation,
  installModals,
  installToasts,
  LightboxRoot,
  ModalRoot,
  realtime,
  safeStorage,
  ToastRoot,
  USER_STORAGE_KEY
} from '@krystark/app-common';
import { rootStore } from './app/store/rootStore';
import 'dayjs/locale/ru';

import { applyAppAdapters } from './app/adapters/applyAdapters';
import AppConfigNav from './app/AppConfigNav';
import { ScrollToTopOnRouteChange } from './app/shell/AppScrollToTopOnRouteChange';

dayjs.locale('ru');
applyInitialTheme();

// 1) MobX‑store
setStore(rootStore);

// 2) env + общие обработчики
setEnv(import.meta.env as any);
attachCommonEventHandlers();
attachLightboxDelegation();

// 2a) провайдер токена для realtime
realtime.setTokenProvider(() => {
  try {
    const raw = safeStorage.get(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token ?? null : null;
  } catch {
    return null;
  }
});

realtime.connect();

window.addEventListener('storage', (e) => {
  if (e.key === USER_STORAGE_KEY) {
    try {
      realtime.close();
    } catch {}
    realtime.connect();
  }
});

// 3) UI‑инфраструктура (модалки/тосты)
installModals();
installToasts();

// 4) внешние модули — регистрируют свои роуты/навигацию
await Promise.all([
  import('@krystark/commerce'),
  import('@krystark/car-sharing'),
  import('@krystark/portal-juridic'),
  import('@krystark/portal-marketing'),
  import('@krystark/portal-analitics')
]);

// 5) внутренние роуты портала
await import('./app/registerCore');

// Ждём, пока ядро закончит регистрацию модулей/пунктов меню
await waitForKernelIdle({ quietMs: 0, maxMs: 2000 });

// Обогащаем навигацию и модули (кастом портала)
if (AppConfigNav) applyAppAdapters(AppConfigNav);

const queryClient = new QueryClient();

const RAW_BASE = import.meta.env.VITE_PATH_URL || '/';
const BASENAME = RAW_BASE.replace(/\/+$/, '');
const routerBasename = BASENAME === '' || BASENAME === '/' ? undefined : BASENAME;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={routerBasename}>
        <ScrollToTopOnRouteChange behavior="smooth">
          <LightboxRoot />
          <ModalRoot />
          <ToastRoot />
          <App />
        </ScrollToTopOnRouteChange>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
```

Кратко по этапам:

1. Настраивается локаль `dayjs` и начальная тема (`applyInitialTheme`).
2. В ядро (`app-kernel`) прокидывается глобальный MobX‑store и `env`.
3. Подключаются общие обработчики (`attachCommonEventHandlers`) и делегирование для лайтбокса (`attachLightboxDelegation`).
4. Настраивается realtime‑клиент (`realtime`), который берёт токен из `safeStorage` и умеет реагировать на его смену в другой вкладке.
5. Регистрируются корневые модалки/тосты (`ModalRoot`, `ToastRoot`) и соответствующие инсталлеры.
6. Динамически импортируются и инициализируются внешние модули (`@krystark/commerce` и др.); каждый модуль добавляет свои роуты и пункты меню через ядро.
7. Импортируется внутренний регистратор `./app/registerCore` (роуты самого портала).
8. Через `waitForKernelIdle` дожидаемся, пока все `queueMicrotask/init` внутри модулей отработают.
9. Навигация дополняется адаптерами портала (`applyAppAdapters(AppConfigNav)`).
10. Строится `BrowserRouter` с `basename`, вычисленным из `VITE_PATH_URL`, плюс обёртка `ScrollToTopOnRouteChange` для плавного скролла вверх при смене роутов.

## 8. Скрипты и типичные сценарии

### 8.1. Корень репозитория

- `npm run web:install` — установка зависимостей для `@krystark/portal-web` (dev‑режим).  
  Используется `dotenv -e .env` для подстановки токена в `.npmrc`.
- `npm run web:ci` — установка зависимостей через `npm ci` (чистая установка для CI).
- `npm run web:dev` — запуск dev‑сервера Vite для портала.
- `npm run web:preview` — предпросмотр собранного приложения.
- `npm run web:typecheck` — проверка типов TypeScript.
- `npm run web:lint` / `web:lint-fix` — ESLint‑проверка и автопочинка.

- `npm run build:common` / `build:contracts` / `build:kernel` — сборка соответствующих пакетов.
- `npm run build:packages` — последовательная сборка всех пакетов ядра.
- `npm run build:web` — сборка только фронтенд‑приложения.
- `npm run build` — полная сборка: пакеты ядра + веб‑приложение.
- `npm run clean` — очистка `dist` и кешей Vite в монорепе.

- `npm run publish:common` / `publish:kernel` / `publish:contracts` — публикация соответствующих пакетов в GitHub Packages (требуется `NODE_AUTH_TOKEN` с правом `write:packages`).

### 8.2. Внутри apps/web

- `npm run dev` — dev‑сервер Vite (если вы находитесь в `apps/web` и не хотите запускать через workspace).
- `npm run build` — typecheck + `vite build`.
- `npm run preview` — предпросмотр собранного приложения.
- `npm run lint` / `lint-fix` — линтер.
- `npm run typecheck` — TS‑проверка (`tsc -p .`).

## 9. Быстрый старт для разработчика

1. **Клонировать** репозиторий монорепы портала.
2. В корне создать файл **`.npmrc`** со своим токеном GitHub Packages (см. раздел 4.2).
3. В корне создать файл **`.env`** и заполнить хотя бы один из токенов:
   ```env
   NODE_AUTH_TOKEN_READ=ghp_...
   # при необходимости publish:
   NODE_AUTH_TOKEN=ghp_...
   ```
4. Перейти в корень и установить зависимости фронта:
   ```bash
   npm run web:install
   ```
5. В `apps/web` создать `.env.development` (см. раздел 5.1) и заполнить ключевые URL (`VITE_API_URL`, `VITE_API_CAR_SHARING_URL`, `VITE_WS_URL` и т.д.).
6. Запустить dev‑сервер:
   ```bash
   npm run web:dev
   ```
7. Приложение будет доступно по адресу `http://localhost:5173` (по умолчанию), с префиксом `VITE_PATH_URL` (чаще всего `/` в dev).

## 10. Модульная архитектура

Портал строится как оболочка вокруг модулей:

- Ядро `@krystark/app-kernel`:
    - хранит глобальный MobX‑store;
    - регистрирует роуты и пункты меню;
    - предоставляет общие адаптеры навигации и механизмы инициализации модулей.
- `@krystark/app-common`:
    - общие утилиты (`safeStorage`, `realtime`, `toast`, `openModal` и т.д.);
    - инфраструктура модалок, тостов и MediaLightbox;
    - вспомогательные хуки и функции.
- `@krystark/app-contracts`:
    - общие типы сущностей (пользователи, товары, сделки, и т.п.);
    - контракты API между фронтом и бэком.

Каждый модуль (`@krystark/commerce`, `@krystark/car-sharing`, `@krystark/portal-*`) предоставляет свою зону роутов, состояние и UI, но не дублирует инфраструктуру: всё общее поведение идёт через ядро и common‑пакет.

> Детали создания/расширения модулей описываются в отдельном документе **MODULE_GUIDE.md**.

---

Этот README описывает актуальную архитектуру и конфигурацию **главного приложения ПОРТАЛ**: монорепозиторий, ядро, модульную схему, настройки окружения и шаги для запуска и сборки.
