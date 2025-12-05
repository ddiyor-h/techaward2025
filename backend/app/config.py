"""
Application configuration.
"""
from pydantic_settings import BaseSettings
from typing import List, Literal
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""

    # App
    app_name: str = "Building Digital Twin API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Data source: "mock" for development, "pleiadata" for real dataset
    data_source: Literal["mock", "pleiadata"] = "pleiadata"

    # PLEIAData dataset path
    pleiadata_path: Path = Path(__file__).parent.parent / "data" / "pleiadata"

    # CORS - allow all origins in development
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    # Future: Database settings
    # influxdb_url: str = "http://localhost:8086"
    # influxdb_token: str = ""
    # influxdb_org: str = "building-twin"
    # influxdb_bucket: str = "sensor-data"

    # Future: MQTT settings
    # mqtt_broker: str = "localhost"
    # mqtt_port: int = 1883
    # mqtt_username: str = ""
    # mqtt_password: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
