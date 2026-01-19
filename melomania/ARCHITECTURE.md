# MeloMania — Архитектура проекта

## 1. Общая архитектура

### Стек технологий
- **Runtime:** Electron (Node.js + Chromium)
- **Frontend:** React 18 + TypeScript
- **Сборка:** Vite
- **Стейт:** Zustand (глобальный) + React useState (локальный)
- **Стили:** Inline styles (объекты JS) + CSS-in-JS
- **Аудио:** Web Audio API

### Тип приложения
- Desktop-приложение для Windows
- Два окна: Host (ведущий) + Projector (проектор/публика)
- Синхронизация через `postMessage` и `localStorage`

### Архитектурные слои
```
┌─────────────────────────────────────────────┐
│  Screens (экраны)                           │
│  └─ HostScreen, MainScreen, PublicScreen    │
├─────────────────────────────────────────────┤
│  Components (UI компоненты)                 │
│  └─ pubquiz/, GameEditor, GameLibrary...    │
├─────────────────────────────────────────────┤
│  Hooks (бизнес-логика)                      │
│  └─ useQuizGame, useResponsive              │
├─────────────────────────────────────────────┤
│  Store (глобальное состояние)               │
│  └─ gameStore.ts (Zustand)                  │
├─────────────────────────────────────────────┤
│  Types (типизация)                          │
│  └─ game.ts                                 │
├─────────────────────────────────────────────┤
│  Services (утилиты)                         │
│  └─ audio/, themes/, utils/                 │
└─────────────────────────────────────────────┘
```

---

## 2. Структура папок

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # Точка входа, создание окон
│   └── preload.ts           # IPC bridge
│
└── renderer/                # React приложение
    ├── App.tsx              # Корневой компонент
    ├── main.tsx             # Точка входа React
    │
    ├── screens/             # Экраны приложения
    │   ├── MainScreen.tsx   # Главное меню
    │   ├── HostScreen.tsx   # Экран ведущего (оба режима)
    │   └── PublicScreen.tsx # Экран проектора
    │
    ├── components/          # UI компоненты
    │   ├── pubquiz/         # ⭐ Модуль PubQuiz (см. раздел 3)
    │   ├── MainMenu.tsx     # Главное меню
    │   ├── GameLibrary.tsx  # Библиотека игр
    │   ├── GameEditor.tsx   # Редактор (Своя Игра)
    │   ├── GameBoard.tsx    # Доска (Своя Игра)
    │   ├── QuestionScreen.tsx # Вопрос (Своя Игра)
    │   ├── Scoreboard.tsx   # Табло очков
    │   ├── GameStats.tsx    # Статистика
    │   └── Decorations.tsx  # Визуальные эффекты (снежинки, листья)
    │
    ├── hooks/               # Кастомные хуки
    │   ├── index.ts
    │   └── useResponsive.ts # Адаптивность
    │
    ├── store/               # Глобальный стейт
    │   └── gameStore.ts     # Zustand store
    │
    ├── types/               # TypeScript типы
    │   ├── game.ts          # Все типы игры
    │   └── electron.d.ts    # Типы Electron API
    │
    ├── themes/              # Цветовые темы
    │   └── index.ts         # 9 тем (nordic, winter, cyber...)
    │
    ├── audio/               # Аудио система
    │   ├── audioManager.ts  # Менеджер аудио
    │   └── SystemSounds.ts  # Системные звуки (base64)
    │
    ├── styles/              # Глобальные стили
    │   └── global.css
    │
    └── utils/               # Утилиты
        ├── index.ts
        └── performance.ts   # Оптимизация
```

---

## 3. Модуль PubQuiz — детальная структура

### 3.1 Файловая структура

```
components/pubquiz/
├── index.ts                 # Реэкспорт
├── PubQuizModule.tsx        # 🔴 Контейнер всего модуля
├── PubQuizHost.tsx          # 🔴 UI ведущего + превью
├── PubQuizPublic.tsx        # UI публичного экрана (deprecated?)
├── PubQuizEditor.tsx        # Редактор квиза
├── designSystem.ts          # Дизайн-система (цвета, стили)
├── TimerAudio.ts            # Аудио таймера
├── BlankGenerator.ts        # Генератор бланков ответов
│
├── hooks/
│   ├── index.ts
│   └── useQuizGame.ts       # 🟢 ВСЯ ЛОГИКА ИГРЫ
│
├── phases/                  # UI фаз игры (для Host)
│   ├── index.ts
│   ├── RoundIntro.tsx       # Вступление к раунду
│   ├── QuestionPhase.tsx    # Фаза вопросов
│   ├── AnswerPhase.tsx      # Фаза ответов
│   ├── CollectBlanks.tsx    # Сбор бланков
│   ├── BreakPhase.tsx       # Перерыв
│   ├── StandingsPhase.tsx   # Таблица лидеров
│   └── GameEnd.tsx          # Конец игры
│
├── ui/                      # UI компоненты Host
│   ├── index.ts
│   ├── HostHeader.tsx       # Шапка с навигацией
│   ├── Sidebar.tsx          # Боковая панель (очки, вопросы)
│   ├── Timer.tsx            # Таймер
│   ├── MediaPlayer.tsx      # Плеер аудио/видео
│   └── SoundSettings.tsx    # Настройки звука
│
└── projector/               # 🔴 РЕНДЕР ПРОЕКТОРА
    ├── index.ts
    ├── renderer.ts          # Генерация HTML для проектора
    └── styles.ts            # Стили проектора
```

### 3.2 Экраны и состояния (Phases)

```
┌─────────────────────────────────────────────────────────────┐
│                         PHASES                               │
├─────────────────────────────────────────────────────────────┤
│  'round-intro'    → Слайд правил раунда                     │
│  'questions'      → Показ вопросов (таймер, медиа)          │
│  'collect-blanks' → Сбор бланков (музыка)                   │
│  'show-answers'   → Показ ответов по очереди                │
│  'break'          → Перерыв (музыка, слайд)                 │
│  'standings'      → Таблица лидеров                         │
│  'game-end'       → Финальный экран                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Разделение UI и логики

| Файл | Тип | Можно менять UI? |
|------|-----|------------------|
| `useQuizGame.ts` | 🟢 ЛОГИКА | ❌ Нет — ломает всё |
| `PubQuizHost.tsx` | 🟡 UI + связка | ⚠️ Осторожно — связан с хуком |
| `PubQuizModule.tsx` | 🟡 Контейнер | ⚠️ Осторожно — роутинг фаз |
| `phases/*.tsx` | 🟢 UI | ✅ Да — чистый UI |
| `ui/*.tsx` | 🟢 UI | ✅ Да — чистый UI |
| `projector/renderer.ts` | 🔴 HTML генерация | ⚠️ Осторожно — строки HTML |
| `projector/styles.ts` | 🟢 Стили | ✅ Да — только CSS |
| `designSystem.ts` | 🟢 Стили | ✅ Да — только стили |

---

## 4. Ключевые файлы PubQuiz

### 4.1 `hooks/useQuizGame.ts`
- **Путь:** `src/renderer/components/pubquiz/hooks/useQuizGame.ts`
- **Отвечает за:** ВСЯ игровая логика
  - Навигация (раунды, вопросы, ответы)
  - Управление фазами
  - Таймер
  - Очки
  - Аудио (music, sfx)
- **Экспортирует:** `QuizState`, `QuizActions`
- **UI менять:** ❌ НЕТ — это чистая логика

### 4.2 `PubQuizHost.tsx`
- **Путь:** `src/renderer/components/pubquiz/PubQuizHost.tsx`
- **Отвечает за:**
  - Превью проектора (iframe)
  - Синхронизация с проектором (postMessage)
  - Контролы управления
  - Лейаут Host-экрана
- **Зависимости:** `useQuizGame`, `renderProjector`
- **UI менять:** ⚠️ Осторожно — много связей

### 4.3 `PubQuizModule.tsx`
- **Путь:** `src/renderer/components/pubquiz/PubQuizModule.tsx`
- **Отвечает за:**
  - Роутинг между фазами
  - Передача props в phases/*
  - Обёртка для всего модуля
- **UI менять:** ⚠️ Осторожно — влияет на все фазы

### 4.4 `projector/renderer.ts`
- **Путь:** `src/renderer/components/pubquiz/projector/renderer.ts`
- **Отвечает за:**
  - Генерация HTML для проектора
  - Все слайды (вопросы, ответы, standings, break...)
  - CSS стили проектора
  - Атмосферные эффекты (снежинки, листья)
- **Особенность:** HTML генерируется как строка (template literals)
- **UI менять:** ⚠️ Осторожно — строки, не JSX
- **Важно:** Использует виртуальный viewport 1920×1080 + auto-scale

### 4.5 `phases/*.tsx`
- **Путь:** `src/renderer/components/pubquiz/phases/`
- **Файлы:** RoundIntro, QuestionPhase, AnswerPhase, CollectBlanks, BreakPhase, StandingsPhase, GameEnd
- **Отвечают за:** UI контролов для каждой фазы
- **UI менять:** ✅ Да — это чистые презентационные компоненты

### 4.6 `ui/*.tsx`
- **Путь:** `src/renderer/components/pubquiz/ui/`
- **Файлы:** HostHeader, Sidebar, Timer, MediaPlayer, SoundSettings
- **Отвечают за:** Переиспользуемые UI компоненты
- **UI менять:** ✅ Да — изолированные компоненты

### 4.7 `designSystem.ts`
- **Путь:** `src/renderer/components/pubquiz/designSystem.ts`
- **Отвечает за:**
  - Цвета, отступы, шрифты
  - Функция `getDS(theme)` — возвращает дизайн-систему для темы
  - Функция `getStyles(ds)` — возвращает объекты стилей
- **UI менять:** ✅ Да — только стили

---

## 5. Поток данных

```
┌──────────────────────────────────────────────────────────────┐
│                         HOST WINDOW                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ useQuizGame │───▶│ PubQuizHost │───▶│ renderProj. │       │
│  │   (логика)  │    │    (UI)     │    │   (HTML)    │       │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘       │
│                            │                   │              │
│                    ┌───────▼───────┐   ┌──────▼──────┐       │
│                    │    iframe     │   │ postMessage │       │
│                    │   (превью)    │   │             │       │
│                    └───────────────┘   └──────┬──────┘       │
└──────────────────────────────────────────────┬───────────────┘
                                               │
                    ┌──────────────────────────▼───────────────┐
                    │              PROJECTOR WINDOW             │
                    │  ┌─────────────────────────────────────┐ │
                    │  │         HTML из renderer.ts          │ │
                    │  │    (виртуальный viewport 1920×1080)  │ │
                    │  └─────────────────────────────────────┘ │
                    └──────────────────────────────────────────┘
```

---

## 6. Что должен знать ChatGPT для безопасного UX/UI рефактора PubQuiz

### 6.1 Критические правила

1. **НЕ ТРОГАТЬ `useQuizGame.ts`**
   - Это единственный источник истины для состояния игры
   - Любое изменение ломает синхронизацию

2. **НЕ МЕНЯТЬ сигнатуры `QuizState` и `QuizActions`**
   - Все компоненты зависят от этих интерфейсов
   - Добавлять можно, удалять/переименовывать — нельзя

3. **`renderer.ts` — это HTML-строки, не JSX**
   - Изменения через template literals
   - CSS встроен в `<style>` тег
   - Нет React-компонентов

4. **Виртуальный viewport 1920×1080**
   - Все размеры в `renderer.ts` в пикселях
   - Auto-scale скрипт масштабирует под окно
   - НЕ использовать `vw`, `vh`, `clamp()`

### 6.2 Безопасные зоны для рефактора

✅ **Можно свободно менять:**
- `phases/*.tsx` — UI контролов
- `ui/*.tsx` — изолированные компоненты
- `designSystem.ts` — цвета, стили
- `projector/styles.ts` — стили проектора

⚠️ **Менять осторожно:**
- `PubQuizHost.tsx` — лейаут, но не логику связки
- `PubQuizModule.tsx` — структуру, но не роутинг фаз
- `renderer.ts` — HTML структуру, но не логику рендера

❌ **НЕ трогать:**
- `useQuizGame.ts`
- Типы в `game.ts` (только добавлять)
- `postMessage` синхронизацию

### 6.3 Зависимости между файлами

```
useQuizGame.ts
    │
    ├──▶ PubQuizHost.tsx
    │        │
    │        ├──▶ phases/*.tsx
    │        ├──▶ ui/*.tsx
    │        └──▶ renderer.ts
    │
    └──▶ PubQuizModule.tsx
             │
             └──▶ phases/*.tsx
```

### 6.4 Как тестировать изменения

1. Запустить `npm run dev`
2. Открыть Host-экран
3. Открыть Projector (кнопка в шапке)
4. Проверить:
   - Превью = проектор (пиксель в пиксель)
   - Все фазы работают
   - Таймер синхронизирован
   - Медиа играет на обоих экранах

### 6.5 Термины

| Термин | Значение |
|--------|----------|
| Host | Окно ведущего (контролы + превью) |
| Projector | Окно проектора (то, что видит публика) |
| Phase | Состояние игры (round-intro, questions...) |
| Round | Раунд квиза (music, picture, text...) |
| DS | Design System — объект стилей |
| renderer | Функция генерации HTML для проектора |

---

## 7. Версия документа

- **Версия приложения:** 7.8.0
- **Дата:** 2026-01-06
- **Автор:** Claude (Anthropic)
