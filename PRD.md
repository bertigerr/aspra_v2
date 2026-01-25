Product Requirements Document (PRD) — AI Language Dictionary PWA
1. Обзор проекта
Разработка PWA-приложения (Progressive Web App) для изучения иностранных слов.
Основная ценность: Пользователь мгновенно получает контекст (перевод, примеры) для нового слова с помощью ИИ и добавляет его в алгоритмическую очередь повторения (FSRS).
Целевая платформа: Мобильные устройства (95% использования). Дизайн должен ощущаться как нативное приложение.
2. Технический Стек (Строгие правила)
Framework: Next.js 14+ (App Router).
Language: TypeScript.
Styling: Tailwind CSS.
UI Components: shadcn/ui (Radix UI).
Mobile UI Patterns: vaul (для выезжающих шторок/Drawers), lucide-react (иконки).
Database & Auth: Supabase (PostgreSQL + Auth).
Backend Logic: Next.js Server Actions.
AI: Google Gemini 1.5 Flash (via Google AI Studio API).
Spaced Repetition: библиотека ts-fsrs.
Deployment: Vercel.
3. Архитектура Данных (Database Schema)
Таблица: profiles
Автоматически создается при регистрации пользователя.
id (uuid, PK) -> references auth.users.id
native_language (text) -> родной язык пользователя (напр. 'ru')
target_language (text) -> изучаемый язык (напр. 'en', default 'en', vj;tn , может быть несколько у одного пользователя)

Таблица: words
id (uuid, PK, default: gen_random_uuid())
user_id (uuid) -> references profiles.id
text (text) -> оригинал слова (напр. "Serendipity")
definition (text) -> определение на изучаемом языке
translation (text) -> основной перевод
examples (jsonb) -> массив [{ "original": string, "translated": string }]
audio_url (text, nullable) -> пока заглушка
created_at (timestamptz)

FSRS Fields (для алгоритма):
state (int) -> 0: New, 1: Learning, 2: Review, 3: Relearning
due_date (timestamptz) -> дата следующего повтора (индекс!)
stability (float)
difficulty (float)
elapsed_days (int)
reps (int)
last_review (timestamptz)
Таблица: reviews (Logs)
id (uuid, PK)
word_id (uuid) -> references words.id
rating (int) -> 1: Again, 2: Hard, 3: Good, 4: Easy
review_time (timestamptz)
scheduled_days (int)
4. TypeScript Интерфейсы (Contracts)
code
TypeScript
export enum CardState { New = 0, Learning = 1, Review = 2, Relearning = 3 }
export enum Rating { Again = 1, Hard = 2, Good = 3, Easy = 4 }

export interface Example {
  original: string;
  translated: string;
}

export interface Word {
  id: string;
  text: string;
  translation: string;
  definition: string;
  examples: Example[];
  state: CardState;
  due_date: string; // ISO date
  stability: number;
  difficulty: number;
  reps: number;
}

// Контракт ответа от Gemini API
export interface AIAnalysisResult {
  text: string;        // Исправленное написание
  translation: string; // Краткий перевод (1-2 слова)
  definition: string;  // Простое объяснение
  examples: Example[]; // Максимум 3 примера
}
5. Пользовательские сценарии (User Flow)
Сценарий 1: Добавление слова (Search-First)
Главный экран: В центре крупный Input.
Ввод: Юзер тапает на Input -> Input смещается вверх (чтобы избежать перекрытия клавиатурой).
Запрос: Юзер вводит слово и жмет "на иконку отправить ввиде стрелки".
Обработка:
Показывается Skeleton loader.
Вызывается Server Action analyzeWord(query).
Backend делает запрос к Gemini: "Дай JSON с переводом, определением и примерами для слова X для носителя языка Y".
Результат: появляется экран карточки с результатом.
Сохранение: Юзер жмет кнопку "Save".
Вызывается saveWord(data).
Создается запись в БД с начальными параметрами FSRS.
Появляется в поле Недавние (Recently added). Инпут очищается.
На спринт №2
Сценарий 2: Тренировка (FSRS)
Вход: Юзер жмет FAB (кнопку Play) кнопка посередине Bottom bar nav которая выходит вверх за пределы поля навигации.
Проверка: Если нет слов со статусом due_date <= now(), показать поздравление.
Карточка:
Показывается "Лицевая сторона" (Слово).
Тап по карточке -> Переворот ("Обратная сторона": Перевод, Пример).
Оценка:
Внизу появляются 4 кнопки: Again (Забыл), Hard, Good, Easy.
При клике вызывается submitReview(wordId, rating).
Алгоритм ts-fsrs рассчитывает новые due_date, stability.
БД обновляется.
Показывается следующее слово.
6. Требования к UI/UX (Mobile Specific)
Viewport: Запретить зум.
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
Navigation: Фиксированный Bottom Bar (Home, Train, Profile).
Input: При фокусе использовать scrollIntoView или CSS-трансформацию, чтобы инпут был в верхней трети экрана.
Drawers: Для любых деталей (например, список всех слов) использовать компонент Vaul (вытягивающаяся шторка снизу), а не модальные окна.
Safe Areas: Учитывать padding-bottom: env(safe-area-inset-bottom) для навигации и FAB.
7. План разработки (Roadmap)
Setup: Инициализация Next.js, установка shadcn/ui, настройка Supabase Client.
Auth: Страница логина, Middleware для защиты роутов.
Core UI: Layout с BottomNav и настройка мобильного вьюпорта.
Feature: AI Search: Интеграция Gemini, создание компонента SearchInput и ResultCard.
Feature: Save: Подключение к БД, сохранение слов.
Feature: Training: Логика выборки слов (Query) и интерфейс флеш-карточек.
Algorithm: Интеграция ts-fsrs в процесс ревью.
Polish: PWA Manifest (иконки), спиннеры загрузки, обработка ошибок.
