# Техническое задание: Frontend Dashboard для цифрового двойника здания

**Версия:** 1.0  
**Дата:** Декабрь 2025  
**Целевые пользователи:** ESG-отдел, Facility Managers

---

## 1. Общее описание системы

### 1.1 Назначение

Frontend-дашборд предназначен для визуализации, мониторинга и управления цифровым двойником коммерческого здания с фокусом на энергоэффективность, ESG-отчётность и оптимизацию эксплуатации.

### 1.2 Цели системы

- Снижение энергопотребления на 15-30% через визуализацию и оптимизацию
- Обеспечение ESG-отчётности и соответствия нормативам
- Централизованный мониторинг всех инженерных систем здания
- Предиктивное обслуживание оборудования
- Интеграция с системами demand response

### 1.3 Целевые пользователи

| Роль | Основные задачи | Приоритетные функции |
|------|-----------------|---------------------|
| ESG-менеджер | Отчётность, анализ углеродного следа, compliance | ESG-дашборды, автогенерация отчётов, бенчмаркинг |
| Facility Manager | Операционное управление, обслуживание | Алерты, контроль оборудования, планирование |
| Энергетик | Оптимизация потребления, тарифы | Энергоаналитика, прогнозы, demand response |
| Руководитель | Стратегические решения | KPI-overview, ROI-анализ, сравнение объектов |

---

## 2. Функциональные требования

### 2.1 Модуль аутентификации и авторизации

#### 2.1.1 Аутентификация
- [ ] Вход по email/пароль с валидацией
- [ ] Двухфакторная аутентификация (TOTP, SMS)
- [ ] SSO интеграция (SAML 2.0, OAuth 2.0, OpenID Connect)
- [ ] Восстановление пароля через email
- [ ] Автоматический logout при неактивности (настраиваемый таймаут)
- [ ] Журнал входов с IP-адресами и геолокацией

#### 2.1.2 Авторизация (RBAC)
- [ ] Предустановленные роли: Admin, ESG Manager, Facility Manager, Viewer
- [ ] Кастомные роли с гранулярными правами
- [ ] Права на уровне: модуль → здание → этаж → зона → оборудование
- [ ] Ограничение доступа к чувствительным данным (финансы, персональные)
- [ ] Audit log всех действий пользователей

### 2.2 Главный дашборд (Overview)

#### 2.2.1 KPI-панель верхнего уровня
- [ ] Общее энергопотребление (кВт·ч) — текущее, за день/неделю/месяц/год
- [ ] Сравнение с базовым периодом (% экономии/перерасхода)
- [ ] Углеродный след (тонны CO₂e) — Scope 1, 2, 3
- [ ] Energy Use Intensity (EUI) — кВт·ч/м²/год
- [ ] Water Use Intensity (WUI) — л/м²/год
- [ ] Общий ESG-скор здания (композитный индекс)
- [ ] Статус оборудования: работает / предупреждение / авария / офлайн
- [ ] Прогноз потребления на текущий день/неделю
- [ ] Экономия в денежном эквиваленте (₽, $, €)

#### 2.2.2 Интерактивная 3D-модель здания
- [ ] Загрузка BIM-модели (IFC, Revit через USD)
- [ ] Навигация: вращение, масштабирование, перемещение
- [ ] Послойное отображение: этажи, зоны, системы
- [ ] Цветовое кодирование по параметрам:
  - Температура (тепловая карта)
  - Энергопотребление (интенсивность)
  - Качество воздуха (CO₂, PM2.5)
  - Заполненность (occupancy)
  - Статус оборудования
- [ ] Клик по объекту → всплывающая карточка с данными
- [ ] Режим сравнения: план vs факт
- [ ] Экспорт скриншотов и видео

#### 2.2.3 Лента событий и алертов
- [ ] Real-time уведомления с приоритизацией (критичный/высокий/средний/низкий)
- [ ] Фильтрация по типу: оборудование, энергия, комфорт, безопасность
- [ ] Acknowledge/Resolve workflow с комментариями
- [ ] Эскалация при игнорировании
- [ ] История событий с поиском и фильтрами
- [ ] Привязка к объектам на 3D-модели

### 2.3 Модуль энергетического мониторинга

#### 2.3.1 Дашборд энергопотребления
- [ ] Общее потребление с разбивкой по:
  - Системам (HVAC, освещение, лифты, IT, прочее)
  - Зонам/этажам
  - Времени суток
  - Типу энергоносителя (электричество, газ, тепло, холод)
- [ ] Графики потребления:
  - Линейный (временной ряд) с выбором периода
  - Столбчатый (сравнение периодов)
  - Тепловая карта (час × день недели)
  - Sankey-диаграмма (потоки энергии)
- [ ] Базовая линия (baseline) и отклонения
- [ ] Нормализация по погоде (HDD/CDD)
- [ ] Нормализация по заполненности

#### 2.3.2 Субсчётчики и детализация
- [ ] Иерархическое дерево счётчиков
- [ ] Drill-down от здания до конкретного оборудования
- [ ] Баланс потребления (главный счётчик vs сумма субсчётчиков)
- [ ] Выявление потерь и небаланса
- [ ] Виртуальные счётчики (расчётные)

#### 2.3.3 Тарифы и стоимость
- [ ] Мультитарифные схемы (день/ночь, пик/полупик/ночь)
- [ ] Календарь тарифов с праздниками
- [ ] Расчёт стоимости в реальном времени
- [ ] Прогноз счёта на конец периода
- [ ] Штрафы за превышение мощности
- [ ] Анализ оптимального тарифного плана

#### 2.3.4 Demand Response
- [ ] Статус подключения к DR-программам (OpenADR)
- [ ] Текущие/предстоящие DR-события
- [ ] Автоматические/ручные стратегии реагирования
- [ ] Потенциал гибкости (kW доступно для снижения)
- [ ] История участия и выплаты
- [ ] Симуляция сценариев DR

### 2.4 Модуль управления HVAC

#### 2.4.1 Обзор системы HVAC
- [ ] Схема системы (AHU, VAV, чиллеры, котлы, насосы)
- [ ] Статус каждого компонента в реальном времени
- [ ] Ключевые параметры:
  - Температура подачи/обратки
  - Давление
  - Расход воздуха/воды
  - Положение клапанов/заслонок
  - Частота приводов (VFD)
- [ ] Режимы работы: охлаждение/отопление/вентиляция/экономайзер

#### 2.4.2 Зональный контроль
- [ ] Карта зон с текущей температурой
- [ ] Уставки: текущие, расписание, override
- [ ] Сравнение уставка vs факт
- [ ] Комфортные диапазоны (ASHRAE 55)
- [ ] Жалобы occupants с геопривязкой
- [ ] История изменений уставок

#### 2.4.3 Оптимизация HVAC
- [ ] Рекомендации по оптимизации (AI-driven)
- [ ] Сценарии "что если" (изменение уставок, расписания)
- [ ] Сравнение стратегий по энергии и комфорту
- [ ] Оптимальный старт/стоп (pre-conditioning)
- [ ] Night setback/setup оптимизация
- [ ] Economizer optimization recommendations

#### 2.4.4 Прогнозирование нагрузки
- [ ] Прогноз тепловой/холодильной нагрузки на 24-72 часа
- [ ] Учёт погоды (интеграция с weather API)
- [ ] Учёт заполненности (predicted occupancy)
- [ ] Учёт расписания мероприятий
- [ ] Confidence intervals для прогнозов

### 2.5 Модуль качества воздуха и комфорта

#### 2.5.1 Indoor Air Quality (IAQ)
- [ ] Параметры в реальном времени по зонам:
  - CO₂ (ppm)
  - PM2.5 / PM10 (мкг/м³)
  - TVOC (ppb)
  - Формальдегид (при наличии датчиков)
  - Температура
  - Влажность
- [ ] Индекс качества воздуха (AQI) — композитный
- [ ] Цветовое кодирование: отлично/хорошо/умеренно/плохо/опасно
- [ ] Тренды и корреляции с событиями
- [ ] Рекомендации по улучшению

#### 2.5.2 Тепловой комфорт
- [ ] PMV/PPD индексы (Predicted Mean Vote / Predicted Percentage Dissatisfied)
- [ ] Визуализация на плане здания
- [ ] Анализ жалоб vs объективные данные
- [ ] Adaptive comfort model (для естественной вентиляции)

#### 2.5.3 Освещённость
- [ ] Уровни освещённости по зонам (люкс)
- [ ] Соответствие нормативам (СП, EN 12464)
- [ ] Daylight factor
- [ ] Glare index

### 2.6 Модуль предиктивного обслуживания

#### 2.6.1 Мониторинг состояния оборудования
- [ ] Реестр оборудования с паспортами:
  - Модель, серийный номер, год установки
  - Гарантия, контракты обслуживания
  - Документация (мануалы, схемы)
  - История ремонтов
- [ ] Health score для каждой единицы (0-100%)
- [ ] Оставшийся ресурс (RUL — Remaining Useful Life)
- [ ] Аномалии в работе (deviation from baseline)

#### 2.6.2 Fault Detection & Diagnostics (FDD)
- [ ] Автоматическое обнаружение неисправностей:
  - Залипшие клапаны
  - Неисправные датчики
  - Неэффективные режимы (simultaneous heating/cooling)
  - Утечки
  - Вибрация выше нормы
- [ ] Диагностика с указанием вероятных причин
- [ ] Приоритизация по impact (энергия, комфорт, риск)
- [ ] Рекомендуемые действия
- [ ] Интеграция с системой заявок (CMMS)

#### 2.6.3 Планирование обслуживания
- [ ] Календарь планового ТО
- [ ] Condition-based maintenance триггеры
- [ ] Оптимизация расписания (минимизация простоев)
- [ ] Расчёт ROI от предиктивного обслуживания
- [ ] Учёт запасных частей

### 2.7 Модуль ESG-отчётности

#### 2.7.1 Углеродный учёт
- [ ] Расчёт выбросов по Scope 1, 2, 3
  - Scope 1: прямые (котлы, генераторы, служебный транспорт)
  - Scope 2: косвенные от энергии (электричество, тепло, холод)
  - Scope 3: цепочка поставок (материалы, отходы, коммутация сотрудников)
- [ ] Emission factors по регионам (обновляемые)
- [ ] Market-based vs Location-based методология
- [ ] Тренды и цели декарбонизации
- [ ] Сценарии достижения net-zero

#### 2.7.2 ESG-метрики
- [ ] Соответствие стандартам:
  - GRI (Global Reporting Initiative)
  - CDP (Carbon Disclosure Project)
  - TCFD (Task Force on Climate-related Financial Disclosures)
  - SASB (Sustainability Accounting Standards Board)
  - EU Taxonomy
- [ ] Автоматический сбор данных для отчётов
- [ ] Gap-analysis по требованиям
- [ ] Benchmarking vs индустрия/регион

#### 2.7.3 Сертификации зданий
- [ ] Трекинг требований сертификаций:
  - LEED (v4.1 O+M)
  - BREEAM In-Use
  - WELL Performance
  - ENERGY STAR
  - ГОСТ Р 54964 (Россия)
- [ ] Текущий статус по кредитам/критериям
- [ ] Рекомендации по улучшению рейтинга
- [ ] Документы для подачи

#### 2.7.4 Генератор отчётов
- [ ] Шаблоны отчётов (ежемесячный, квартальный, годовой)
- [ ] Кастомизация содержания и брендинга
- [ ] Автоматическая генерация по расписанию
- [ ] Форматы экспорта: PDF, Excel, Word
- [ ] Отправка по email заинтересованным сторонам
- [ ] Версионность и архив отчётов

### 2.8 Модуль аналитики и BI

#### 2.8.1 Конструктор дашбордов
- [ ] Drag-and-drop интерфейс
- [ ] Библиотека виджетов:
  - Числовые KPI (gauge, card, sparkline)
  - Графики (line, bar, area, pie, scatter, heatmap)
  - Таблицы с сортировкой/фильтрацией
  - Карты (2D планы, геокарты)
  - 3D-визуализации
- [ ] Связывание виджетов (click на одном фильтрует другие)
- [ ] Персональные и shared дашборды
- [ ] Темплейты для типовых задач

#### 2.8.2 Ad-hoc аналитика
- [ ] Query builder для непрограммистов
- [ ] Выбор метрик, измерений, фильтров
- [ ] Агрегации (sum, avg, min, max, count, percentile)
- [ ] Группировки (по времени, локации, оборудованию)
- [ ] Сохранение запросов
- [ ] Экспорт результатов (CSV, Excel, API)

#### 2.8.3 Сравнительный анализ
- [ ] Period-over-period (MoM, YoY, custom)
- [ ] Building-to-building (для портфолио)
- [ ] Zone-to-zone внутри здания
- [ ] Бенчмарки: ENERGY STAR, CIBSE, региональные нормативы
- [ ] Regression analysis (energy vs weather, occupancy)

#### 2.8.4 Прогнозная аналитика
- [ ] Прогноз потребления (ML-модели)
- [ ] Прогноз затрат
- [ ] Прогноз выбросов
- [ ] What-if сценарии
- [ ] Confidence intervals и uncertainty

### 2.9 Модуль симуляции (Digital Twin Core)

#### 2.9.1 Физическая модель здания
- [ ] Интеграция с EnergyPlus / OpenStudio
- [ ] Калибровка модели по историческим данным
- [ ] Параметры оболочки здания (U-values, infiltration)
- [ ] Инженерные системы (HVAC sizing, efficiency curves)
- [ ] Внутренние нагрузки (люди, оборудование, освещение)
- [ ] Расписания работы

#### 2.9.2 Сценарное моделирование
- [ ] Изменение уставок температуры
- [ ] Изменение расписания работы
- [ ] Модернизация оборудования (chiller upgrade, LED retrofit)
- [ ] Добавление возобновляемых источников (PV, BESS)
- [ ] Изменение использования здания
- [ ] Климатические сценарии (future weather files)

#### 2.9.3 Результаты симуляции
- [ ] Сравнение baseline vs scenario
- [ ] Energy savings (kWh, %)
- [ ] Cost savings (₽, $)
- [ ] Carbon savings (tCO₂e)
- [ ] Comfort impact (hours outside range)
- [ ] Simple payback period
- [ ] NPV, IRR для инвестиционных решений

### 2.10 Модуль интеграций

#### 2.10.1 BMS/SCADA интеграция
- [ ] Отображение статуса подключения
- [ ] Список точек (points) с маппингом на онтологию
- [ ] Data quality indicators (gaps, outliers, frozen values)
- [ ] Manual override capability (с подтверждением и логированием)
- [ ] Write-back для управляющих воздействий (если разрешено)

#### 2.10.2 Интеграция с внешними системами
- [ ] Weather services (OpenWeatherMap, Tomorrow.io)
- [ ] Utility data (Green Button, API энергосбытов)
- [ ] CMMS/EAM (для заявок на обслуживание)
- [ ] ERP (для финансовых данных)
- [ ] HR системы (для данных о заполненности)
- [ ] Календари (для событий и бронирований)

#### 2.10.3 API для внешних систем
- [ ] Документированный REST API
- [ ] GraphQL endpoint (опционально)
- [ ] Webhooks для событий
- [ ] Bulk data export
- [ ] Rate limiting и квоты

### 2.11 Модуль уведомлений

#### 2.11.1 Каналы уведомлений
- [ ] In-app уведомления (bell icon, notification center)
- [ ] Email (одиночные и дайджесты)
- [ ] SMS (для критичных алертов)
- [ ] Push notifications (mobile/desktop)
- [ ] Интеграция с мессенджерами (Telegram, Slack, MS Teams)

#### 2.11.2 Настройка правил
- [ ] Условия срабатывания (threshold, rate of change, anomaly)
- [ ] Severity levels
- [ ] Расписание (не беспокоить ночью)
- [ ] Эскалация (если не acknowledge за N минут)
- [ ] Группировка (не спамить однотипными)
- [ ] Персональные настройки для каждого пользователя

### 2.12 Модуль администрирования

#### 2.12.1 Управление пользователями
- [ ] CRUD пользователей
- [ ] Bulk import/export
- [ ] Назначение ролей и прав
- [ ] Деактивация без удаления
- [ ] Password policies

#### 2.12.2 Управление объектами
- [ ] Иерархия: портфолио → здание → этаж → зона → оборудование
- [ ] Метаданные объектов
- [ ] Геопривязка (адрес, координаты)
- [ ] Площади (GFA, NLA, rentable)
- [ ] Фото и документы

#### 2.12.3 Системные настройки
- [ ] Единицы измерения (метрическая/имперская)
- [ ] Часовые пояса
- [ ] Локализация интерфейса
- [ ] Брендинг (логотип, цвета)
- [ ] Feature flags

---

## 3. Нефункциональные требования

### 3.1 Производительность

| Метрика | Требование |
|---------|------------|
| Время загрузки главной страницы | < 2 сек (3G), < 1 сек (4G/WiFi) |
| Время отклика API | < 200 мс (p95) |
| Обновление real-time данных | < 5 сек задержка |
| Поддержка concurrent users | ≥ 500 на инстанс |
| Размер бандла | < 500 KB (gzipped, initial load) |
| Lighthouse Performance Score | ≥ 90 |

### 3.2 Масштабируемость

- Горизонтальное масштабирование frontend (CDN, multiple instances)
- Поддержка портфолио до 1000 зданий
- До 100,000 точек данных на здание
- До 10 лет исторических данных
- Lazy loading для тяжёлых компонентов

### 3.3 Доступность и надёжность

- Uptime SLA: 99.9%
- Graceful degradation при недоступности backend
- Offline mode для просмотра кэшированных данных
- Автоматический reconnect при потере связи
- Error boundaries для изоляции сбоев

### 3.4 Безопасность

- HTTPS only (TLS 1.3)
- Content Security Policy (CSP)
- XSS protection
- CSRF tokens
- Secure cookie handling
- Input validation и sanitization
- No sensitive data in localStorage (только encrypted)
- Regular security audits (OWASP top 10)

### 3.5 Совместимость

| Браузер | Минимальная версия |
|---------|-------------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Mobile | Android 10+ |

### 3.6 Доступность (a11y)

- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support (ARIA labels)
- Color contrast ratios ≥ 4.5:1
- Focus indicators
- Alt text для изображений
- Responsive design (320px - 4K)

### 3.7 Интернационализация

- Поддержка языков: русский, английский (минимум)
- RTL layout support (для будущего расширения)
- Локализация форматов дат, чисел, валют
- Экстернализация всех строк (i18n framework)

---

## 4. Технические требования

### 4.1 Рекомендуемый стек

```
Framework:        React 18+ / Next.js 14+
State Management: Zustand / Redux Toolkit
Styling:          Tailwind CSS + CSS Modules
UI Components:    shadcn/ui + Radix primitives
Charts:           Recharts / Apache ECharts / Plotly
3D Visualization: Three.js + React Three Fiber
Maps:             Mapbox GL / Leaflet
Forms:            React Hook Form + Zod
API Client:       TanStack Query (React Query)
Real-time:        WebSocket / SSE
Testing:          Vitest + React Testing Library + Playwright
Build:            Vite / Turbopack
```

### 4.2 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN (Static Assets)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages/    │  │  Components │  │     Shared Libs     │  │
│  │   Routes    │  │             │  │  (hooks, utils,     │  │
│  │             │  │  - UI       │  │   types, constants) │  │
│  │  - /        │  │  - Charts   │  │                     │  │
│  │  - /energy  │  │  - 3D       │  └─────────────────────┘  │
│  │  - /hvac    │  │  - Maps     │                           │
│  │  - /esg     │  │  - Tables   │  ┌─────────────────────┐  │
│  │  - /alerts  │  │  - Forms    │  │    State Layer      │  │
│  │  - /admin   │  │             │  │  (Zustand stores)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    API Gateway    │
                    └─────────┬─────────┘
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
   │  REST API   │    │  WebSocket  │    │  GraphQL    │
   │  (CRUD)     │    │  (Real-time)│    │  (Optional) │
   └─────────────┘    └─────────────┘    └─────────────┘
```

### 4.3 Структура проекта

```
/src
├── /app                    # Next.js App Router
│   ├── /(auth)            # Auth layout group
│   │   ├── /login
│   │   └── /forgot-password
│   ├── /(dashboard)       # Main app layout group
│   │   ├── /overview
│   │   ├── /energy
│   │   ├── /hvac
│   │   ├── /iaq
│   │   ├── /equipment
│   │   ├── /esg
│   │   ├── /analytics
│   │   ├── /simulation
│   │   ├── /alerts
│   │   ├── /reports
│   │   └── /admin
│   ├── /api               # API routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── /components
│   ├── /ui                # Base UI components
│   ├── /charts            # Chart components
│   ├── /3d                # 3D visualization
│   ├── /maps              # Map components
│   ├── /forms             # Form components
│   ├── /tables            # Data tables
│   └── /widgets           # Dashboard widgets
├── /hooks                 # Custom React hooks
├── /stores                # Zustand stores
├── /services              # API services
├── /lib                   # Utilities
├── /types                 # TypeScript types
├── /constants             # Constants & config
├── /styles                # Global styles
└── /public                # Static assets
```

### 4.4 API интеграция

#### REST Endpoints (примеры)

```
GET    /api/v1/buildings
GET    /api/v1/buildings/{id}
GET    /api/v1/buildings/{id}/energy?from=&to=&resolution=
GET    /api/v1/buildings/{id}/equipment
GET    /api/v1/buildings/{id}/alerts
POST   /api/v1/buildings/{id}/setpoints
GET    /api/v1/buildings/{id}/simulation/scenarios
POST   /api/v1/buildings/{id}/simulation/run
GET    /api/v1/reports/templates
POST   /api/v1/reports/generate
```

#### WebSocket Events

```
subscribe:   { type: "subscribe", topics: ["building.123.energy", "building.123.alerts"] }
data:        { type: "data", topic: "building.123.energy", payload: {...} }
alert:       { type: "alert", severity: "high", message: "...", buildingId: "123" }
heartbeat:   { type: "ping" } / { type: "pong" }
```

### 4.5 Кэширование

- **SWR/React Query**: stale-while-revalidate для API данных
- **Service Worker**: кэширование статики и offline support
- **IndexedDB**: локальное хранение больших датасетов
- **Memory cache**: часто используемые справочники

---

## 5. UX/UI требования

### 5.1 Дизайн-система

- Консистентная цветовая палитра (primary, secondary, semantic colors)
- Типографика (font family, scale, weights)
- Spacing system (4px/8px base grid)
- Border radius tokens
- Shadow tokens
- Animation/transition standards
- Responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

### 5.2 Темизация

- Light mode (default)
- Dark mode
- High contrast mode (a11y)
- Системная тема (auto)
- Возможность кастомного брендинга для white-label

### 5.3 Навигация

- Persistent sidebar (collapsible)
- Breadcrumbs
- Global search (Cmd/Ctrl + K)
- Recent items
- Favorites/bookmarks
- Context-aware help

### 5.4 Data visualization principles

- Colorblind-friendly palettes (Viridis, ColorBrewer)
- Consistent axis formatting
- Meaningful defaults (последние 7 дней, например)
- Interactive tooltips
- Zoom/pan for time series
- Export options (PNG, SVG, CSV)

---

## 6. Тестирование

### 6.1 Unit тесты

- Покрытие: ≥ 80% для критичных модулей
- Тестирование: hooks, utils, stores
- Мокирование API и WebSocket

### 6.2 Integration тесты

- Тестирование user flows
- API integration tests
- State management integration

### 6.3 E2E тесты

- Critical paths (login, navigation, key features)
- Cross-browser testing
- Mobile testing
- Visual regression testing

### 6.4 Performance тесты

- Lighthouse CI в pipeline
- Bundle size monitoring
- Render performance profiling

---

## 7. Документация

### 7.1 Для разработчиков

- README с инструкциями по запуску
- Architecture Decision Records (ADR)
- API documentation (автогенерация из OpenAPI)
- Component Storybook
- Contributing guidelines

### 7.2 Для пользователей

- User guide (контекстная справка)
- Video tutorials
- FAQ
- Release notes

---

## 8. Этапы разработки (рекомендуемые)

### Phase 1: MVP (8-12 недель)
- Аутентификация и базовая авторизация
- Главный дашборд с KPI
- Энергетический мониторинг (базовый)
- Алерты и уведомления (базовые)
- Интеграция с 1 зданием

### Phase 2: Core Features (8-12 недель)
- 3D-визуализация здания
- HVAC мониторинг и контроль
- IAQ мониторинг
- Расширенная аналитика
- ESG-отчётность (базовая)

### Phase 3: Advanced (8-12 недель)
- Предиктивное обслуживание (FDD)
- Симуляция и сценарии
- Demand Response
- Полная ESG-отчётность
- Конструктор дашбордов

### Phase 4: Scale & Polish (ongoing)
- Multi-building portfolio
- Advanced ML features
- White-label capabilities
- Mobile apps (React Native / PWA)
- Third-party integrations

---

## 9. Приложения

### Приложение А: Глоссарий

| Термин | Определение |
|--------|-------------|
| BMS | Building Management System — система автоматизации здания |
| HVAC | Heating, Ventilation, Air Conditioning |
| IAQ | Indoor Air Quality — качество воздуха в помещении |
| EUI | Energy Use Intensity — удельное энергопотребление (кВт·ч/м²/год) |
| FDD | Fault Detection & Diagnostics — обнаружение и диагностика неисправностей |
| DR | Demand Response — управление спросом |
| ESG | Environmental, Social, Governance |
| PMV | Predicted Mean Vote — прогнозируемая средняя оценка теплового комфорта |
| RUL | Remaining Useful Life — остаточный ресурс |

### Приложение Б: Референсы

- ASHRAE Guideline 36: High-Performance Sequences of Operation
- ASHRAE Standard 55: Thermal Environmental Conditions
- WELL Building Standard v2
- LEED v4.1 O+M
- ISO 50001: Energy Management Systems
- GHG Protocol Corporate Standard

---

**Документ подготовлен:** Claude AI  
**Дата:** Декабрь 2025  
**Версия:** 1.0
