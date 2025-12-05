# Building Digital Twin Platform

An open-source digital twin platform for commercial building energy optimization, delivering 15-30% energy savings through real-time monitoring, predictive control, and operational optimization.

## Overview

Commercial building digital twins enable significant energy savings by creating a virtual replica of physical building systems. This platform integrates BMS data, semantic modeling, physics simulation, and machine learning to optimize HVAC, lighting, and demand response.

**Target Users:** ESG Managers, Facility Managers, Energy Engineers, Executives

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Dashboard  │  │  3D Model   │  │   Charts    │  │     Admin Panel         │ │
│  │  (Next.js)  │  │ (Three.js)  │  │ (Recharts)  │  │   (RBAC, Settings)      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                │                     │
          └────────────────┴────────────────┴─────────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │    API Gateway      │
                         │  (REST + WebSocket) │
                         └──────────┬──────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────────┐
│                              BACKEND LAYER                                       │
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │  Time-Series DB │    │  Brick Schema   │    │      MPC Controller         │  │
│  │   (InfluxDB)    │◄──▶│   (Metadata)    │◄──▶│    (Optimization)           │  │
│  └────────┬────────┘    └─────────────────┘    └─────────────┬───────────────┘  │
│           │                                                   │                  │
│           │                                    ┌──────────────┴───────────────┐  │
│           │                                    │       EnergyPlus             │  │
│           │                                    │     (Simulation)             │  │
│           │                                    └──────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────────────────────────┘
            │
┌───────────┴─────────────────────────────────────────────────────────────────────┐
│                           DATA INGESTION LAYER                                   │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────┐                          │
│  │  BMS / IoT  │───▶│ Protocol Gateway │───▶│  MQTT  │                          │
│  │  (BACnet,   │    │ (HMS Intesis,    │    │ Broker │                          │
│  │   Modbus)   │    │  Node-RED)       │    │        │                          │
│  └─────────────┘    └──────────────────┘    └────────┘                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend

| Layer | Technology | License |
|-------|------------|---------|
| Protocol Gateway | MQTT Broker + Node-RED | Open Source |
| Time-Series DB | InfluxDB / TimescaleDB | MIT / Apache 2.0 |
| Semantic Model | Brick Schema + py-brickschema | BSD-3-Clause |
| Simulation | EnergyPlus + Python EMS | BSD |
| Optimization | MPC (cvxpy / do-mpc) | Apache 2.0 |

### Frontend

| Layer | Technology | License |
|-------|------------|---------|
| Framework | Next.js 14+ / React 18+ | MIT |
| State Management | Zustand | MIT |
| Styling | Tailwind CSS + shadcn/ui | MIT |
| Charts | Recharts / Apache ECharts | Apache 2.0 |
| 3D Visualization | Three.js + React Three Fiber | MIT |
| API Client | TanStack Query | MIT |
| Real-time | WebSocket / SSE | - |
| Forms | React Hook Form + Zod | MIT |

## MVP Features

### Backend (Data & Control)
- **Data Ingestion**: BACnet/Modbus protocol gateway → MQTT
- **Time-Series Storage**: Sensor history in InfluxDB
- **Semantic Layer**: Brick Schema metadata for building context
- **Physics Simulation**: EnergyPlus model with Python EMS
- **Predictive Control**: MPC controller (1-24h horizon)

### Frontend (Dashboard)

#### Main Dashboard
- KPI panel: energy consumption, carbon footprint (CO₂), EUI (kWh/m²)
- Equipment status: running / warning / alarm / offline
- Real-time alerts with priority levels
- Energy savings in monetary value

#### Energy Monitoring
- Consumption breakdown by systems (HVAC, lighting, IT)
- Time-series charts with period selection
- Sankey diagram for energy flows
- Tariff management and cost forecasting

#### HVAC Control
- System schematic (AHU, VAV, chillers, boilers)
- Zone temperature map with setpoints
- Optimization recommendations (AI-driven)
- Load forecasting (24-72h)

#### ESG Reporting
- Carbon accounting (Scope 1, 2, 3)
- Compliance tracking (GRI, CDP, TCFD)
- Building certifications (LEED, BREEAM, WELL)
- Auto-generated reports (PDF, Excel)

#### Indoor Air Quality
- Real-time IAQ metrics: CO₂, PM2.5, TVOC, humidity
- Composite AQI index with color coding
- Thermal comfort (PMV/PPD)

#### Predictive Maintenance
- Equipment health scores (0-100%)
- Fault Detection & Diagnostics (FDD)
- Remaining Useful Life (RUL) predictions
- CMMS integration

## Functional Requirements

### Data Ingestion
- Support BACnet IP and MS/TP protocols
- Support Modbus TCP and RTU
- Edge gateway with < 1 second latency
- MQTT 3.1.1/5 compatibility

### Semantic Modeling
- Brick Schema v1.3+ ontology
- SPARQL query support
- Equipment, Point, Location, System concepts
- Cross-vendor analytics portability

### Physics Simulation
- EnergyPlus whole-building energy model
- Calibrated model accuracy: CVRMSE < 15%
- Python EMS for custom control algorithms
- FMU export for co-simulation

### Predictive Control
- Model Predictive Control (MPC)
- Rolling optimization horizon: 1-24 hours
- Comfort constraints (temperature, humidity)
- Equipment operational limits
- Real-time weather forecast integration

### Frontend Dashboard
- Authentication: email/password, SSO (OAuth 2.0, SAML)
- Authorization: RBAC with granular permissions
- Real-time data via WebSocket (< 5 sec delay)
- Interactive 3D building model (IFC/BIM import)
- Responsive design (mobile + desktop)
- Dark/Light theme support

## Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Energy Reduction | 15-30% |
| Data Latency | < 1 second |
| Page Load Time | < 2 sec (3G), < 1 sec (WiFi) |
| API Response | < 200 ms (p95) |
| Concurrent Users | ≥ 500 |
| Uptime SLA | 99.9% |
| WCAG Compliance | Level AA |

## Project Structure

```
/
├── /backend
│   ├── /gateway          # Protocol gateway (BACnet/Modbus → MQTT)
│   ├── /api              # REST API server
│   ├── /simulation       # EnergyPlus integration
│   ├── /mpc              # MPC controller
│   └── /brick            # Brick Schema models
│
├── /frontend
│   ├── /app              # Next.js App Router
│   │   ├── /(auth)       # Login, SSO
│   │   └── /(dashboard)  # Main app
│   │       ├── /overview
│   │       ├── /energy
│   │       ├── /hvac
│   │       ├── /iaq
│   │       ├── /equipment
│   │       ├── /esg
│   │       └── /admin
│   ├── /components
│   │   ├── /ui           # Base components
│   │   ├── /charts       # Visualizations
│   │   ├── /3d           # Three.js components
│   │   └── /widgets      # Dashboard widgets
│   ├── /stores           # Zustand state
│   ├── /services         # API clients
│   └── /types            # TypeScript definitions
│
├── /config               # Configuration files
├── /docs                 # Documentation
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- EnergyPlus 23.2+
- MQTT Broker (Mosquitto)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd building-digital-twin

# Start infrastructure
docker-compose up -d

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
npm run dev

# Configure building model
cp config/example.yaml config/building.yaml
```

### Configuration
1. Configure protocol gateway for BMS connection
2. Define building metadata in Brick Schema
3. Calibrate EnergyPlus model with historical data
4. Set MPC optimization parameters
5. Configure authentication (SSO/local)
6. Deploy dashboard

## Roadmap

### Phase 1: MVP
- [ ] Protocol gateway setup (BACnet/Modbus → MQTT)
- [ ] Time-series database (InfluxDB)
- [ ] Basic Brick Schema model
- [ ] EnergyPlus integration
- [ ] Simple MPC controller
- [ ] Authentication & RBAC
- [ ] Main dashboard with KPIs
- [ ] Energy monitoring module
- [ ] Basic alerts system

### Phase 2: Core Features
- [ ] 3D building visualization (IFC import)
- [ ] HVAC monitoring & control UI
- [ ] IAQ monitoring module
- [ ] ESG reporting (basic)
- [ ] Advanced analytics & charts
- [ ] Notification system (email, in-app)

### Phase 3: Advanced
- [ ] Reinforcement learning control
- [ ] Demand response (OpenADR)
- [ ] Predictive maintenance (FDD)
- [ ] Full ESG compliance reporting
- [ ] Custom dashboard builder
- [ ] Scenario simulation UI

### Phase 4: Scale
- [ ] Multi-building portfolio
- [ ] GPU-accelerated simulation (NVIDIA PhysicsNeMo)
- [ ] Optimization acceleration (NVIDIA cuOpt)
- [ ] 3D visualization (Omniverse)
- [ ] Mobile app (PWA / React Native)
- [ ] White-label capabilities

## API Examples

### REST Endpoints
```
GET    /api/v1/buildings
GET    /api/v1/buildings/{id}/energy?from=&to=&resolution=
GET    /api/v1/buildings/{id}/equipment
GET    /api/v1/buildings/{id}/alerts
POST   /api/v1/buildings/{id}/setpoints
POST   /api/v1/simulation/run
POST   /api/v1/reports/generate
```

### WebSocket Events
```json
{ "type": "subscribe", "topics": ["building.123.energy"] }
{ "type": "data", "topic": "building.123.energy", "payload": {...} }
{ "type": "alert", "severity": "high", "message": "..." }
```

## References

- [Brick Schema](https://brickschema.org/)
- [EnergyPlus](https://energyplus.net/)
- [Eclipse Ditto](https://www.eclipse.org/ditto/)
- [FIWARE](https://www.fiware.org/)
- [Project Haystack](https://project-haystack.org/)
- [ASHRAE Guideline 36](https://www.ashrae.org/)
- [WELL Building Standard](https://www.wellcertified.com/)
- [GHG Protocol](https://ghgprotocol.org/)

## License

MIT
