# ROI и Экономические Расчёты - EqII Digital Twin Platform

## Содержание
1. [Входные данные и константы](#1-входные-данные-и-константы)
2. [Расчёт экономии энергии](#2-расчёт-экономии-энергии)
3. [Расчёт стоимости](#3-расчёт-стоимости)
4. [ROI формулы](#4-roi-формулы)
5. [Примеры расчётов](#5-примеры-расчётов)
6. [Источники данных](#6-источники-данных)

---

## 1. Входные данные и константы

### 1.1 Данные здания (PLEIAData - Университет Мурсии)

| Здание | Площадь (m²) | Этажи | Базовое потребление |
|--------|--------------|-------|---------------------|
| Block A (Pleiades) | 4,500 | 5 | 90,000 kWh/месяц |
| Block B | 2,500 | 2 | 50,000 kWh/месяц |
| Block C | 1,200 | 1 | 24,000 kWh/месяц |

### 1.2 Экономические константы

```python
# Файл: backend/app/simulation/scenarios.py (строки 247-249)

ELECTRICITY_COST_EUR = 0.15      # EUR/kWh - средний тариф
PEAK_COST_EUR = 0.25             # EUR/kWh - пиковый тариф (14:00-18:00)
CARBON_FACTOR = 0.25             # kg CO2/kWh - углеродный коэффициент испанской сети
```

### 1.3 Тарифы по времени (TOU - Time of Use)

```python
# Файл: backend/app/simulation/mpc_controller.py (строки 463-470)

# Испанские тарифы (PVPC)
OFF_PEAK = 0.10    # EUR/kWh - ночь (00:00-08:00)
SHOULDER = 0.18    # EUR/kWh - полупик (08:00-10:00, 14:00-18:00, 22:00-24:00)
PEAK = 0.25        # EUR/kWh - пик (10:00-14:00, 18:00-22:00)
```

### 1.4 Параметры оборудования

```python
# Файл: backend/app/simulation/mpc_controller.py (строки 55-56)

COP_heat = 4.0      # Коэффициент производительности отопления
COP_cool = 3.5      # Коэффициент производительности охлаждения

# Это означает:
# - Для получения 1 kWh тепла нужно 0.25 kWh электричества
# - Для получения 1 kWh холода нужно 0.286 kWh электричества
```

---

## 2. Расчёт экономии энергии

### 2.1 Базовое потребление здания

```
Формула:
baseline_energy = floor_area × EUI × period_factor

Где:
- floor_area = площадь здания (m²)
- EUI = Energy Use Intensity = 20 kWh/m²/месяц (средний показатель для офисов в Средиземноморье)
- period_factor = days / 30 (коэффициент периода)
```

**Пример для Block A (30 дней):**
```
baseline_energy = 4,500 m² × 20 kWh/m²/месяц × (30/30)
baseline_energy = 90,000 kWh
```

### 2.2 Сценарии оптимизации и их эффект

| Сценарий | Экономия (%) | Механизм | Источник |
|----------|--------------|----------|----------|
| Night Setback -3°C | 18.5% | Снижение setpoint с 22°C до 19°C ночью (22:00-06:00) | scenarios.py:106 |
| Peak Shaving | 12.0% | Pre-cooling + coasting в часы пика (14:00-18:00) | scenarios.py:197 |
| Wider Deadband ±1.5°C | 8.0% | Расширение зоны комфорта, снижение cycling HVAC | scenarios.py:116 |
| Occupancy-Based Ventilation | 6.0% | Вентиляция по CO2, снижение over-ventilation | custom |
| LED Retrofit | 5.5% | Замена освещения (30% здания) | custom |

### 2.3 Формула общей экономии

```
Формула:
total_savings_percent = Σ(optimization_i.energy_impact_percent)

total_savings_kwh = baseline_energy × (total_savings_percent / 100)

actual_energy = baseline_energy - total_savings_kwh
```

**Пример:**
```
total_savings_percent = 18.5% + 12.0% + 8.0% + 6.0% + 5.5% = 50%
total_savings_kwh = 90,000 × 0.50 = 45,000 kWh
actual_energy = 90,000 - 45,000 = 45,000 kWh
```

---

## 3. Расчёт стоимости

### 3.1 Базовая стоимость энергии

```
Формула:
baseline_cost = baseline_energy × average_price

Где average_price = 0.15 EUR/kWh (средневзвешенный тариф)
```

**Пример:**
```
baseline_cost = 90,000 kWh × 0.15 EUR/kWh = €13,500/месяц
```

### 3.2 Стоимость каждой оптимизации

```python
# Файл: backend/app/api/v1/router.py (строки 143, 153, 163, etc.)

# Для обычных часов:
cost_impact = baseline_energy × energy_impact_percent × 0.15

# Для пиковых часов (Peak Shaving):
cost_impact = baseline_energy × energy_impact_percent × 0.25
```

**Пример расчёта по оптимизациям:**

| Оптимизация | Energy Impact | Цена | Cost Saved |
|-------------|---------------|------|------------|
| Night Setback | 18.5% | €0.15 | 90,000 × 0.185 × 0.15 = €2,497.50 |
| Peak Shaving | 12.0% | €0.25 | 90,000 × 0.12 × 0.25 = €2,700.00 |
| Wider Deadband | 8.0% | €0.15 | 90,000 × 0.08 × 0.15 = €1,080.00 |
| Occupancy Ventilation | 6.0% | €0.15 | 90,000 × 0.06 × 0.15 = €810.00 |
| LED Retrofit | 5.5% | €0.15 | 90,000 × 0.055 × 0.15 = €742.50 |
| **ИТОГО** | **50%** | - | **€7,830.00** |

### 3.3 Расчёт углеродного следа

```
Формула:
co2_baseline = baseline_energy × CARBON_FACTOR
co2_reduced = total_savings_kwh × CARBON_FACTOR
co2_actual = co2_baseline - co2_reduced
```

**Пример:**
```
co2_baseline = 90,000 × 0.25 = 22,500 kg CO2
co2_reduced = 45,000 × 0.25 = 11,250 kg CO2
co2_actual = 22,500 - 11,250 = 11,250 kg CO2
```

---

## 4. ROI формулы

### 4.1 Годовая экономия

```
Формула:
annual_energy_cost = annual_energy_kwh × energy_price
annual_savings = annual_energy_cost × (savings_percent / 100)
net_annual_savings = annual_savings - maintenance_cost
```

**Файл:** `backend/app/api/v1/simulation.py` (строки 500-502)

### 4.2 Срок окупаемости (Payback Period)

```
Формула:
payback_years = implementation_cost / net_annual_savings
payback_months = payback_years × 12
```

**Файл:** `backend/app/api/v1/simulation.py` (строки 504-506)

### 4.3 NPV (Net Present Value) - Чистая приведённая стоимость

```
Формула:
NPV = -implementation_cost + Σ(net_annual_savings / (1 + discount_rate)^year)

Где:
- discount_rate = 0.05 (5% годовых)
- years = 1 to 5
```

**Файл:** `backend/app/api/v1/simulation.py` (строки 508-513)

```python
# Код расчёта NPV:
discount_rate = 0.05
years = 5
npv = -implementation_cost
for year in range(1, years + 1):
    npv += net_annual_savings / ((1 + discount_rate) ** year)
```

### 4.4 IRR (Internal Rate of Return) - упрощённый

```
Формула (упрощённая):
IRR ≈ (net_annual_savings / implementation_cost) × 100
```

**Файл:** `backend/app/api/v1/simulation.py` (строки 515-517)

---

## 5. Примеры расчётов

### 5.1 Пример: Block A - полный расчёт

**Входные данные:**
```
Здание: Block A (Pleiades)
Площадь: 4,500 m²
Годовое потребление: 90,000 kWh × 12 = 1,080,000 kWh
Цена электричества: €0.15/kWh
Ожидаемая экономия: 50%
Стоимость внедрения: €50,000
Годовое обслуживание: €5,000
```

**Расчёт:**

```
1. Годовая стоимость энергии:
   annual_energy_cost = 1,080,000 × 0.15 = €162,000

2. Годовая экономия (валовая):
   annual_savings = 162,000 × 0.50 = €81,000

3. Чистая годовая экономия:
   net_annual_savings = 81,000 - 5,000 = €76,000

4. Срок окупаемости:
   payback_years = 50,000 / 76,000 = 0.66 года
   payback_months = 0.66 × 12 = 7.9 месяцев

5. NPV (5 лет, 5% дисконт):
   NPV = -50,000
         + 76,000/1.05
         + 76,000/1.05²
         + 76,000/1.05³
         + 76,000/1.05⁴
         + 76,000/1.05⁵
   NPV = -50,000 + 72,381 + 68,934 + 65,652 + 62,526 + 59,548
   NPV = €279,041

6. IRR (упрощённый):
   IRR = (76,000 / 50,000) × 100 = 152%

7. Сокращение CO2:
   carbon_reduction = 1,080,000 × 0.50 × 0.25 / 1000 = 135 тонн CO2/год
```

### 5.2 API Endpoint для расчёта ROI

```bash
GET /api/v1/simulation/roi/calculate?
    annual_energy_kwh=1080000&
    energy_price_eur=0.15&
    savings_percent=50&
    implementation_cost_eur=50000&
    maintenance_cost_eur=5000
```

**Ответ:**
```json
{
    "annual_energy_cost_eur": 162000.00,
    "annual_savings_eur": 81000.00,
    "net_annual_savings_eur": 76000.00,
    "payback_months": 7.9,
    "payback_years": 0.66,
    "npv_5_years_eur": 279041.00,
    "irr_percent": 152.0,
    "5_year_total_savings_eur": 380000.00,
    "carbon_reduction_tons": 135.0
}
```

---

## 6. Источники данных

### 6.1 Тарифы на электроэнергию

| Источник | Значение | Ссылка |
|----------|----------|--------|
| PVPC (Испания) | €0.10-0.25/kWh | [REE](https://www.ree.es/es/actividades/operacion-del-sistema-electrico/precio-voluntario-pequeno-consumidor) |
| EU Average | €0.22/kWh | [Eurostat](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Electricity_price_statistics) |
| Наш расчёт | €0.15/kWh (avg) | Средневзвешенное |

### 6.2 Углеродный коэффициент

| Страна | kg CO2/kWh | Источник |
|--------|------------|----------|
| Испания | 0.25 | [EEA](https://www.eea.europa.eu/data-and-maps/indicators/overview-of-the-electricity-production-3/assessment) |
| EU Average | 0.27 | European Environment Agency |
| Германия | 0.35 | Umweltbundesamt |

### 6.3 EUI (Energy Use Intensity)

| Тип здания | kWh/m²/год | Источник |
|------------|------------|----------|
| Office (EU) | 150-250 | BPIE |
| Office (Spain) | 180-220 | IDAE |
| Наш расчёт | 240 (20×12) | PLEIAData analysis |

### 6.4 COP оборудования

| Тип | COP | Источник |
|-----|-----|----------|
| Современный чиллер | 3.5-4.5 | ASHRAE |
| Тепловой насос | 3.5-5.0 | EU Ecodesign |
| Наш расчёт | 3.5 (cool), 4.0 (heat) | Conservative estimate |

---

## Формулы в коде

### Файл: `backend/app/api/v1/router.py`

```python
# Строки 75-79: Базовое потребление
baseline_energy_per_m2 = 20  # kWh/m²/month
baseline_monthly_kwh = floor_area_m2 * baseline_energy_per_m2
baseline_energy = baseline_monthly_kwh * (days / 30)

# Строки 189-193: Суммарная экономия
total_energy_savings_percent = sum(opt["energy_impact_percent"] for opt in optimizations)
total_energy_savings_kwh = baseline_energy * (total_energy_savings_percent / 100)
total_cost_savings_eur = sum(opt["cost_impact_eur"] for opt in optimizations)
total_co2_reduction_kg = total_energy_savings_kwh * 0.25
```

### Файл: `backend/app/api/v1/simulation.py`

```python
# Строки 500-528: ROI калькулятор
annual_energy_cost = annual_energy_kwh * energy_price_eur
annual_savings = annual_energy_cost * (savings_percent / 100)
net_annual_savings = annual_savings - maintenance_cost_eur

# Payback
payback_years = implementation_cost_eur / net_annual_savings
payback_months = payback_years * 12

# NPV (5 лет, 5% дисконт)
discount_rate = 0.05
npv = -implementation_cost_eur
for year in range(1, 6):
    npv += net_annual_savings / ((1 + discount_rate) ** year)

# IRR (упрощённый)
irr = (net_annual_savings / implementation_cost_eur) * 100

# Carbon reduction
carbon_reduction_tons = annual_energy_kwh * (savings_percent/100) * 0.25 / 1000
```

### Файл: `backend/app/simulation/mpc_controller.py`

```python
# Строки 358-363: Расчёт стоимости MPC
total_energy = sum(opt_energy)
total_cost = sum(e * p for e, p in zip(opt_energy, prices))
baseline_cost = baseline_energy * np.mean(prices)
savings_percent = ((baseline_cost - total_cost) / baseline_cost * 100)
```

---

## Резюме ключевых показателей

| Показатель | Значение | Единица |
|------------|----------|---------|
| Средний тариф | 0.15 | EUR/kWh |
| Пиковый тариф | 0.25 | EUR/kWh |
| Углеродный коэффициент | 0.25 | kg CO2/kWh |
| EUI (офисы) | 20 | kWh/m²/месяц |
| COP охлаждения | 3.5 | - |
| COP отопления | 4.0 | - |
| Целевая экономия | 15-50% | % |
| Типичный Payback | 8-24 | месяцев |
| Дисконт для NPV | 5% | годовых |

---

*Документ создан: 2025-12-06*
*Версия: 1.0*
*EqII Digital Twin Platform*
