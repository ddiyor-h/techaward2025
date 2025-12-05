# Тестирование Building Digital Twin MVP в реальных условиях

## Обзор

Это руководство описывает способы валидации MVP системы Building Digital Twin с реальными данными и оборудованием.

---

## 1. Бесплатные датасеты реальных зданий

### Рекомендуемые датасеты (Nature Scientific Data)

| Датасет | Описание | Данные | Ссылка |
|---------|----------|--------|--------|
| **CU-BEMS** | 7-этажное офисное здание, Бангкок, 11,700 м² | 18 месяцев: кондиционеры, освещение, температура, влажность (1 мин интервал) | [nature.com](https://www.nature.com/articles/s41597-020-00582-3) |
| **HouseZero** | Ультра-низкое потребление, офис с естественной вентиляцией | 2 года: энергия, PV, CO2, температура, влажность | [nature.com](https://www.nature.com/articles/s41597-024-03770-7) |
| **Berkeley Office** | 300+ сенсоров, офисное здание в Калифорнии | 3 года: HVAC, IAQ, занятость, погода | [nature.com](https://www.nature.com/articles/s41597-022-01257-x) |
| **PLEIAData** | Университет Мурсии, Испания (Horizon 2020) | Энергопотребление, HVAC, температура, погода | [nature.com](https://www.nature.com/articles/s41597-023-02023-3) |
| **ORNL Multizone** | Oak Ridge National Lab, тестовое здание | HVAC сценарии: 4 отопления, 3 охлаждения | [nature.com](https://www.nature.com/articles/s41597-022-01858-6) |
| **Smart Company Building** | 6 лет данных, Германия (2018-2023) | HVAC, PV 749 kWp, чиллеры, когенерация | [nature.com](https://www.nature.com/articles/s41597-025-05186-3) |

### Публичные API

| API | Описание | Доступ |
|-----|----------|--------|
| **U.S. EIA Open Data** | Данные энергопотребления США | Бесплатный API ключ: [eia.gov/opendata](https://www.eia.gov/opendata/) |
| **DOE Building Performance Database** | Крупнейшая база энергоэффективности зданий | [energy.gov/bpd](https://www.energy.gov/eere/buildings/building-performance-database-bpd) |
| **NREL Developer Network** | API для энергоэффективности и возобновляемых источников | [developer.nrel.gov](https://developer.nrel.gov/docs/) |

---

## 2. IoT сенсоры для тестирования

### ESP32 + сенсоры (рекомендуется)

**Минимальный набор на 1 узел:**
```
ESP32 DevKit          ~$10
BME280 (темп/влажн)   ~$15
MQ-135 (CO2/VOC)      ~$8
Провода + breadboard  ~$5
----------------------------
Итого:                ~$35-40
```

**Характеристики BME280:**
- Температура: ±1°C
- Влажность: ±1%
- Давление: ±1 hPa
- Интерфейс: I2C/SPI

**Где купить:**
- [Adafruit BME280](https://www.adafruit.com/product/2652)
- [Amazon ESP32 Kit](https://www.amazon.com/LAFVIN-Starter-Development-Tutorial-Compatible/dp/B0BVZBTP8V)
- AliExpress (дешевле, дольше доставка)

### Raspberry Pi вариант

```
Raspberry Pi 4        ~$45-55
BME280               ~$15
Питание + SD карта   ~$20
----------------------------
Итого:               ~$80-90
```

**Плюсы:** Полноценный Linux, легче отлаживать
**Минусы:** Выше энергопотребление, больше размер

### Arduino вариант

- [Arduino Sensor Kit Base](https://store.arduino.cc/products/sensor-kit-base) ~$50
- [Smart Environmental Monitoring Bundle](https://store-usa.arduino.cc/pages/smart-environmental-monitoring-bundle) ~$100

---

## 3. Архитектура подключения

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ESP32 +    │     │   MQTT      │     │  FastAPI    │
│  Sensors    │────▶│   Broker    │────▶│  Backend    │
│  (x5-10)    │     │  (HiveMQ)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  InfluxDB   │
                                        │  + Grafana  │
                                        └─────────────┘
```

### Пример кода ESP32 (Arduino)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

// WiFi
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

// MQTT
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "building/zone1/sensors";

WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_BME280 bme;

void setup() {
  Serial.begin(115200);

  // BME280
  if (!bme.begin(0x76)) {
    Serial.println("BME280 not found!");
    while (1);
  }

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    client.connect("ESP32_Zone1");
  }
  client.loop();

  // Read sensors
  float temp = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;

  // Create JSON
  String payload = "{";
  payload += "\"zone_id\":\"zone1\",";
  payload += "\"temperature\":" + String(temp) + ",";
  payload += "\"humidity\":" + String(humidity) + ",";
  payload += "\"pressure\":" + String(pressure);
  payload += "}";

  // Publish
  client.publish(mqtt_topic, payload.c_str());

  delay(60000); // Every minute
}
```

---

## 4. Облачные IoT платформы (бесплатные тарифы)

### AWS IoT Core
- **Лимит:** 500,000 сообщений/мес (12 месяцев)
- **Плюсы:** Production-ready, интеграция с AWS
- **Сайт:** [aws.amazon.com/iot-core](https://aws.amazon.com/iot-core/pricing/)

### Azure IoT Hub
- **Лимит:** 8,000 сообщений/день (бессрочно)
- **Плюсы:** 500 устройств бесплатно
- **Минус:** Нельзя апгрейдить, только пересоздать
- **Сайт:** [azure.microsoft.com/iot-hub](https://azure.microsoft.com/en-us/pricing/details/iot-hub/)

### HiveMQ Cloud
- **Лимит:** 100 устройств, 10GB/мес
- **Плюсы:** MQTT 5.0, без карты
- **Сайт:** [hivemq.com/mqtt-cloud-broker](https://www.hivemq.com/products/mqtt-cloud-broker/)

### ThingsBoard (рекомендуется)
- **Лимит:** Без ограничений (self-hosted)
- **Плюсы:** Open-source, 600+ виджетов, готовые шаблоны для зданий
- **Сайт:** [thingsboard.io](https://thingsboard.io/)
- **GitHub:** [github.com/thingsboard/thingsboard](https://github.com/thingsboard/thingsboard)

### Grafana Cloud
- **Лимит:** 3 пользователя, 10,000 метрик
- **Плюсы:** Красивые дашборды, интеграция с InfluxDB
- **Сайт:** [grafana.com/pricing](https://grafana.com/pricing/)

---

## 5. Места для пилотного тестирования

### Быстрые варианты

| Место | Плюсы | Как получить доступ |
|-------|-------|---------------------|
| **Дом/квартира** | Полный контроль, бесплатно | — |
| **Офис** | Несколько зон HVAC | Договориться с арендодателем |
| **Коворкинг** | Много зон, реальные пользователи | Предложить бесплатный мониторинг |
| **Университет** | Большие здания, интерес к инновациям | Связаться с facilities management |

### Акселераторы со зданиями

| Программа | Фокус | Преимущества |
|-----------|-------|--------------|
| **[MetaProp](https://www.metaprop.org/)** | PropTech, Smart Buildings | Доступ к партнёрам-застройщикам |
| **[Urban-X](https://www.urban-x.com/)** | Smart Cities (NYC) | Тестирование в зданиях NYC |
| **[Elemental Excelerator](https://elementalexcelerator.com/)** | Climate Tech | $500K-$1M + пилоты |
| **[TechNexus](https://technexus.com/)** | Corporate Innovation | 900+ Fortune 500 партнёров |
| **[Plug and Play](https://www.plugandplaytechcenter.com/)** | Smart Cities | 500+ корпоративных партнёров |

### Стратегия партнёрства с университетами

1. Найти отдел Facilities Management или Sustainability Office
2. Предложить бесплатный пилот на 3 месяца
3. Подготовить презентацию ROI (20-30% экономии энергии)
4. Предложить совместную публикацию результатов

---

## 6. Симуляция зданий (бесплатно)

### OpenStudio + EnergyPlus

**Что это:** Моделирование энергопотребления здания

**Возможности:**
- Создание 3D модели здания
- Симуляция HVAC систем (VAV, AHU, чиллеры)
- Генерация почасовых данных за год
- Экспорт в CSV для импорта в бэкенд

**Установка:**
```bash
# Ubuntu/Debian
wget https://github.com/NREL/OpenStudio/releases/download/v3.7.0/OpenStudio-3.7.0+d5269793f1-Ubuntu-22.04-x86_64.deb
sudo dpkg -i OpenStudio-3.7.0+d5269793f1-Ubuntu-22.04-x86_64.deb
```

**Ресурсы:**
- [openstudio.net](https://openstudio.net/)
- [energyplus.net](https://energyplus.net/)
- [Udemy курс](https://www.udemy.com/course/energy-modelling-in-energyplus-and-openstudio-module-1/)

### BOPTEST (тест алгоритмов управления)

**Что это:** Фреймворк для тестирования алгоритмов HVAC через REST API

**Плюсы:**
- HTTP API — идеально для вашего FastAPI
- Готовые модели зданий
- Автоматический расчёт KPI

**Использование:**
```python
import requests

# Инициализация
requests.post("http://localhost:5000/initialize",
              json={"start_time": 0, "end_time": 86400})

# Чтение сенсоров
sensors = requests.get("http://localhost:5000/measurements").json()

# Управление HVAC
requests.post("http://localhost:5000/advance",
              json={"u": {"hvac_setpoint": 22.0}})
```

**GitHub:** [github.com/ibpsa/project1-boptest](https://github.com/ibpsa/project1-boptest)

---

## 7. План действий

### Фаза 1: Валидация на данных (Неделя 1-2)

- [ ] Скачать CU-BEMS датасет
- [ ] Написать скрипт импорта в формат API
- [ ] Заменить mock данные на реальные
- [ ] Протестировать алерты и KPI

### Фаза 2: Железо (Неделя 2-3)

- [ ] Купить 2x ESP32 + BME280
- [ ] Прошить код для MQTT
- [ ] Настроить HiveMQ broker
- [ ] Подключить к FastAPI через MQTT клиент

### Фаза 3: Пилот (Неделя 3-6)

- [ ] Найти помещение для теста
- [ ] Установить 5-10 сенсоров
- [ ] Собрать данные 2-4 недели
- [ ] Подготовить отчёт с метриками

### Фаза 4: Масштабирование (Месяц 2-3)

- [ ] Подать заявку в акселератор
- [ ] Подготовить case study
- [ ] Найти первого клиента

---

## 8. Бюджет

### Минимальный (proof of concept)

| Компонент | Стоимость |
|-----------|-----------|
| 2 сенсорных узла (ESP32 + BME280) | ~$70 |
| MQTT broker (HiveMQ free) | $0 |
| VPS для бэкенда (опционально) | $5/мес |
| **Итого** | **~$75** |

### Полный пилот (5-10 зон)

| Компонент | Стоимость |
|-----------|-----------|
| 10 сенсорных узлов | ~$350 |
| Дополнительные сенсоры (CO2, PIR) | ~$100 |
| VPS + база данных | $20/мес |
| **Итого** | **~$500** |

---

## 9. Полезные ссылки

### Документация
- [FastAPI MQTT](https://fastapi-mqtt.netlify.app/)
- [Paho MQTT Python](https://pypi.org/project/paho-mqtt/)
- [InfluxDB Python Client](https://influxdb-client.readthedocs.io/)

### Сообщества
- [r/homeautomation](https://www.reddit.com/r/homeautomation/)
- [r/esp32](https://www.reddit.com/r/esp32/)
- [Home Assistant Forum](https://community.home-assistant.io/)

### Курсы
- [EnergyPlus Advanced (Udemy)](https://www.udemy.com/course/energyplus-advanced-complex-building-energy-simulation/)
- [IoT Specialization (Coursera)](https://www.coursera.org/specializations/iot)

---

*Документ создан: декабрь 2025*
*Проект: Building Digital Twin Platform*
