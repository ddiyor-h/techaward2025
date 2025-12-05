"""
Building Digital Twin Platform - Backend API

FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import router as api_router
from app.api.v1.websocket import router as ws_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## Building Digital Twin Platform API

REST API and WebSocket for commercial building energy optimization.

### Features
- **Buildings**: Get building information and metadata
- **Energy**: Time-series energy consumption data with breakdown by system
- **Equipment**: HVAC equipment status, health scores, maintenance info
- **Alerts**: Real-time alerts with severity levels
- **HVAC**: Zone temperatures, setpoints, and control
- **IAQ**: Indoor Air Quality metrics (CO2, PM2.5, TVOC)
- **KPIs**: Key performance indicators (EUI, carbon, savings)
- **WebSocket**: Real-time sensor data streaming

### Data
Currently uses mock data for development. Production will integrate with:
- InfluxDB for time-series sensor data
- MQTT for real-time BMS integration
- EnergyPlus for physics simulation
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware - allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include routers
app.include_router(api_router)
app.include_router(ws_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "mock_data": "active",
            # Future services
            # "influxdb": "connected",
            # "mqtt": "connected",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
