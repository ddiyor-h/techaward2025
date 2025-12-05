# PLEIAData Dataset Report

## Overview

**Dataset Name**: PLEIAData - Pleiades building dataset
**Source**: University of Murcia, Spain
**Publication**: Nature Scientific Data (2023)
**DOI**: https://doi.org/10.1038/s41597-023-02023-3
**Download**: https://zenodo.org/records/7620136
**License**: CC BY 4.0

## Building Information

**Building**: Pleiades Building, University of Murcia Campus
**Location**: Murcia, Spain (Mediterranean climate)
**Total Area**: 10,983 m²
**Structure**: 3 blocks (A, B, C) with multiple floors
**Usage**: University building (offices, classrooms, labs)

## Dataset Period

- **Start**: 2021-01-01 00:00:00 UTC
- **End**: 2021-12-18 00:00:00 UTC
- **Duration**: ~352 days (almost 1 full year)
- **Time Resolution**: 10-minute (10T) and 60-minute (60T) intervals

## File Structure

```
Data_Nature/
├── processed_data/           # Pre-processed CSV files
│   ├── consA-60T.csv         # Energy consumption Block A (hourly)
│   ├── consB-60T.csv         # Energy consumption Block B (hourly)
│   ├── consC-60T.csv         # Energy consumption Block C (hourly)
│   ├── hvac-aggA-60T.csv     # HVAC aggregated Block A (hourly)
│   ├── hvac-aggB-60T.csv     # HVAC aggregated Block B (hourly)
│   ├── hvac-aggC-60T.csv     # HVAC aggregated Block C (hourly)
│   ├── temp-sensorA-60T.csv  # Temperature sensors Block A (hourly)
│   ├── temp-sensorB-60T.csv  # Temperature sensors Block B (hourly)
│   ├── temp-sensorC-60T.csv  # Temperature sensors Block C (hourly)
│   ├── data-weather-60T.csv  # Weather data (hourly)
│   ├── data-roomA-10T.csv    # Room-level data Block A (10-min)
│   ├── data-roomB-10T.csv    # Room-level data Block B (10-min)
│   ├── data-roomC-10T.csv    # Room-level data Block C (10-min)
│   └── data-model-consumo*.csv # Consumption model data
└── raw_data/                 # Original raw data files
```

## Data Tables

### 1. Energy Consumption (`consX-60T.csv`)

**Files**: consA-60T.csv, consB-60T.csv, consC-60T.csv
**Rows**: ~8,266 per block
**Delimiter**: Semicolon (`;`)

| Column | Type | Unit | Description |
|--------|------|------|-------------|
| `Date` | datetime | ISO 8601 | Timestamp with UTC timezone |
| `dif_cons_real` | float | kWh | Differential consumption (hourly) |
| `cons_total` | float | kWh | Cumulative total consumption |
| `dif_cons_smooth` | float | kWh | Smoothed differential consumption |

**Statistics (Block A)**:
- Total consumption: 41,251 kWh (full year)
- Average hourly: ~5.0 kWh
- Peak hours: Business hours (9:00-18:00)

---

### 2. HVAC Data (`hvac-aggX-60T.csv`)

**Files**: hvac-aggA-60T.csv, hvac-aggB-60T.csv, hvac-aggC-60T.csv
**Rows**: 8,425 per block
**Delimiter**: Semicolon (`;`)

| Column | Type | Description |
|--------|------|-------------|
| `Date` | datetime | Timestamp with UTC timezone |
| `V4` | float | Number of active HVAC units (0-19) |
| `V12` | float | Average setpoint temperature (°C) |
| `V26` | float | Mode ratio (0.0-1.0, cooling fraction) |
| `V5_0` | binary | State category 0 (one-hot encoded) |
| `V5_1` | binary | State category 1 (one-hot encoded) |
| `V5_2` | binary | State category 2 (one-hot encoded) |
| `Hour_1` | binary | Time period: Morning (one-hot) |
| `Hour_2` | binary | Time period: Afternoon (one-hot) |
| `Hour_3` | binary | Time period: Night (one-hot) |
| `Season_1` | binary | Season: Winter (one-hot) |
| `Season_2` | binary | Season: Spring (one-hot) |
| `Season_3` | binary | Season: Summer (one-hot) |
| `Season_4` | binary | Season: Autumn (one-hot) |

**HVAC Variable Interpretation**:
- **V4** (state): Count of active HVAC units (0 = all off, 19 = all running)
- **V12** (setpoint): Target temperature range 14.1°C - 21.2°C
- **V26** (mode): 0.0 = heating only, 1.0 = cooling only, 0.5 = mixed

---

### 3. Temperature Sensors (`temp-sensorX-60T.csv`)

**Files**: temp-sensorA-60T.csv, temp-sensorB-60T.csv, temp-sensorC-60T.csv
**Rows**: 8,424 per block
**Delimiter**: Semicolon (`;`)

| Column | Type | Unit | Description |
|--------|------|------|-------------|
| `Date` | datetime | ISO 8601 | Timestamp with UTC timezone |
| `V2` | float | °C | Average indoor temperature |

**Statistics**:
- Temperature range: 18°C - 28°C (indoor)
- Typical comfort range: 20°C - 24°C

---

### 4. Weather Data (`data-weather-60T.csv`)

**Rows**: 8,424
**Delimiter**: Semicolon (`;`)

| Column | Type | Unit | Description |
|--------|------|------|-------------|
| `Date` | datetime | ISO 8601 | Timestamp with UTC timezone |
| `tmed` | float | °C | Outdoor temperature |
| `hrmed` | float | % | Relative humidity |
| `radmed` | float | W/m² | Solar radiation |
| `vvmed` | float | m/s | Wind speed |
| `dvmed` | float | degrees | Wind direction |
| `prec` | float | mm | Precipitation |
| `dewpt` | float | °C | Dew point temperature |
| `dpv` | float | kPa | Vapor pressure deficit |

**Statistics**:
- Temperature range: -1.8°C to 45.8°C (Mediterranean climate)
- Humidity range: 5.2% to 93.4%
- Hot summers (June-August): avg 30-35°C
- Mild winters (December-February): avg 5-15°C

---

### 5. Room-Level Data (`data-roomX-10T.csv`)

**Files**: data-roomA-10T.csv (2M rows), data-roomB-10T.csv (758K rows), data-roomC-10T.csv (303K rows)
**Resolution**: 10 minutes
**Delimiter**: Semicolon (`;`)

| Column | Type | Description |
|--------|------|-------------|
| `Date` | datetime | Timestamp |
| `dif_cons` | float | Room consumption differential |
| `cons_total` | float | Room cumulative consumption |
| `IDhvac` | string | HVAC unit identifier |
| `block` | string | Building block (A/B/C) |
| `room` | string | Room identifier |
| `V12` | float | Setpoint temperature |
| `V4` | float | HVAC state |
| `V26` | float | HVAC mode |
| `V5_0, V5_1, V5_2` | binary | State categories |
| `IDsensor` | string | Temperature sensor ID |
| `V2` | float | Room temperature (°C) |
| `tmed, hrmed, ...` | float | Weather variables |
| `Hour_1, Hour_2, Hour_3` | binary | Time periods |
| `Season_1-4` | binary | Seasons |

---

## Data Quality

### Completeness
- **Coverage**: 352 days out of 365 (96.4%)
- **Missing data**: Minimal gaps, mostly in December
- **Timestamps**: Consistent hourly intervals (60T files)

### Known Issues
- Dataset ends on December 18, 2021 (not full year)
- Some HVAC units may have intermittent readings
- Weather station occasional gaps filled with interpolation

---

## Usage in Building Digital Twin API

### Mapping to API Endpoints

| PLEIAData | API Endpoint | Mapping |
|-----------|--------------|---------|
| Block A, B, C | `/buildings` | 3 buildings: pleiades-a, pleiades-b, pleiades-c |
| consX-60T.csv | `/buildings/{id}/energy` | dif_cons_real → kWh values |
| hvac-aggX-60T.csv | `/buildings/{id}/hvac` | V4, V12, V26 → zones |
| temp-sensorX-60T.csv | `/buildings/{id}/hvac` | V2 → current_temp |
| data-weather-60T.csv | External reference | Weather correlation |

### Date Handling Strategy

Since dataset is from 2021, we use **cyclic projection**:
- Any requested date is mapped to 2021 equivalent
- Example: 2025-03-15 → 2021-03-15
- Preserves real patterns (day/night, weekday/weekend, seasonal)

```python
def map_to_dataset_date(requested_date: datetime) -> datetime:
    return requested_date.replace(year=2021)
```

---

## References

1. **Paper**: Serrano-Jiménez, A. et al. "PLEIAData: A dataset of indoor environmental, HVAC and energy consumption data from a Mediterranean institutional building." *Nature Scientific Data* 10, 69 (2023).

2. **Dataset**: https://zenodo.org/records/7620136

3. **Building Info**: Pleiades Building, University of Murcia, Spain. Built 2010, LEED certified.

---

## Appendix: Sample Data

### Energy Consumption Sample
```csv
Date;dif_cons_real;cons_total;dif_cons_smooth
2021-01-01 00:00:00+00:00;1.34;2.44;1.25
2021-01-01 01:00:00+00:00;1.31;3.75;1.28
2021-01-01 02:00:00+00:00;1.28;5.03;1.30
```

### HVAC Sample
```csv
Date;V4;V12;V26;V5_0;V5_1;V5_2;Hour_1;Hour_2;Hour_3;Season_1;Season_2;Season_3;Season_4
2021-01-01 00:00:00+00:00;1.0;14.1;0.0;0;1;0;0;0;1;1;0;0;0
```

### Weather Sample
```csv
Date;tmed;hrmed;radmed;vvmed;dvmed;prec;dewpt;dpv
2021-01-01 00:00:00+00:00;3.3;64.4;0.0;0.3;208.0;0.0;-2.7;0.3
```
