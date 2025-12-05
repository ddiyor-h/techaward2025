# Building Digital Twin Platform

An open-source digital twin platform for commercial building energy optimization, delivering 15-30% energy savings through real-time monitoring, predictive control, and operational optimization.

## Overview

Commercial building digital twins enable significant energy savings by creating a virtual replica of physical building systems. This platform integrates BMS data, semantic modeling, physics simulation, and machine learning to optimize HVAC, lighting, and demand response.

## MVP Features

- **Data Ingestion**: BACnet/Modbus protocol gateway translating to MQTT
- **Time-Series Storage**: Sensor history in InfluxDB or TimescaleDB
- **Semantic Layer**: Brick Schema metadata for standardized building context
- **Physics Simulation**: EnergyPlus model with Python EMS integration
- **Predictive Control**: MPC controller with 1-24 hour optimization horizon
- **Visualization**: Web dashboard for monitoring and manual override

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌────────┐    ┌───────────────┐
│  BMS / IoT  │───▶│ Protocol Gateway │───▶│  MQTT  │───▶│ Time-Series DB│
│  (BACnet,   │    │ (HMS Intesis,    │    │ Broker │    │  (InfluxDB)   │
│   Modbus)   │    │  Node-RED)       │    │        │    │               │
└─────────────┘    └──────────────────┘    └────┬───┘    └───────┬───────┘
                                                │                │
                                                ▼                ▼
                                    ┌───────────────────────────────────┐
                                    │      Brick Schema Metadata        │
                                    │  (Equipment, Points, Locations)   │
                                    └───────────────────┬───────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────┐
                    │                                   │               │
                    ▼                                   ▼               ▼
          ┌─────────────────┐              ┌─────────────────┐  ┌──────────────┐
          │   EnergyPlus    │◀────────────▶│  MPC Controller │  │  Dashboard   │
          │  (Simulation)   │              │ (Optimization)  │  │    (Web)     │
          └─────────────────┘              └─────────────────┘  └──────────────┘
```

## Tech Stack

| Layer | Technology | License |
|-------|------------|---------|
| Protocol Gateway | MQTT Broker + Node-RED | Open Source |
| Time-Series DB | InfluxDB / TimescaleDB | MIT / Apache 2.0 |
| Semantic Model | Brick Schema + py-brickschema | BSD-3-Clause |
| Simulation | EnergyPlus + Python EMS | BSD |
| Optimization | MPC (cvxpy / do-mpc) | Apache 2.0 |
| Frontend | React / Grafana | MIT |

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

### Visualization
- Real-time sensor data display
- Historical trend analysis
- Energy consumption dashboards
- Alert and anomaly notifications
- Manual override capability

## Expected Outcomes

| Metric | Target |
|--------|--------|
| Energy Reduction | 15-30% |
| Data Latency | < 1 second |
| Optimization Horizon | 1-24 hours |
| Model Accuracy (CVRMSE) | < 15% |
| MPC Cycle Time | < 5 minutes |

## Getting Started

### Prerequisites
- Python 3.10+
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

# Install Python dependencies
pip install -r requirements.txt

# Configure building model
cp config/example.yaml config/building.yaml
```

### Configuration
1. Configure protocol gateway for BMS connection
2. Define building metadata in Brick Schema
3. Calibrate EnergyPlus model with historical data
4. Set MPC optimization parameters
5. Deploy dashboard

## Roadmap

### Phase 1: MVP
- [ ] Protocol gateway setup
- [ ] Time-series database
- [ ] Basic Brick Schema model
- [ ] EnergyPlus integration
- [ ] Simple MPC controller
- [ ] Monitoring dashboard

### Phase 2: Advanced Features
- [ ] Reinforcement learning control
- [ ] Demand response (OpenADR)
- [ ] Predictive maintenance
- [ ] Multi-building portfolio

### Phase 3: Scale
- [ ] GPU-accelerated simulation (NVIDIA PhysicsNeMo)
- [ ] Optimization acceleration (NVIDIA cuOpt)
- [ ] 3D visualization (Omniverse)

## References

- [Brick Schema](https://brickschema.org/)
- [EnergyPlus](https://energyplus.net/)
- [Eclipse Ditto](https://www.eclipse.org/ditto/)
- [FIWARE](https://www.fiware.org/)
- [Project Haystack](https://project-haystack.org/)

## License

MIT
