"""
WebSocket handler for real-time data streaming.
"""
import asyncio
import json
import random
from datetime import datetime
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services import mock_data

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages WebSocket connections."""

    def __init__(self):
        self.active_connections: dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, building_id: str):
        await websocket.accept()
        if building_id not in self.active_connections:
            self.active_connections[building_id] = set()
        self.active_connections[building_id].add(websocket)

    def disconnect(self, websocket: WebSocket, building_id: str):
        if building_id in self.active_connections:
            self.active_connections[building_id].discard(websocket)
            if not self.active_connections[building_id]:
                del self.active_connections[building_id]

    async def broadcast(self, building_id: str, message: dict):
        if building_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[building_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.add(connection)
            # Clean up dead connections
            for conn in dead_connections:
                self.active_connections[building_id].discard(conn)


manager = ConnectionManager()


def generate_realtime_data(building_id: str) -> dict:
    """Generate simulated real-time sensor data."""
    building = mock_data.get_building(building_id)
    if not building:
        return {"error": "Building not found"}

    # Simulate real-time sensor readings with small variations
    return {
        "type": "sensor_update",
        "building_id": building_id,
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "energy": {
                "current_power_kw": round(building.area_sqm * 0.02 * random.uniform(0.8, 1.2), 1),
                "today_kwh": round(building.area_sqm * 0.15 * random.uniform(0.9, 1.1), 1),
            },
            "hvac": {
                "avg_temperature": round(22 + random.uniform(-0.5, 0.5), 1),
                "avg_humidity": round(45 + random.uniform(-2, 2), 1),
                "cooling_load_kw": round(building.area_sqm * 0.03 * random.uniform(0.5, 1.0), 1),
            },
            "iaq": {
                "avg_co2_ppm": round(500 + random.uniform(-50, 100)),
                "avg_pm25": round(15 + random.uniform(-5, 10), 1),
                "avg_aqi": random.randint(30, 80),
            },
            "occupancy": {
                "current": random.randint(
                    int(building.area_sqm / 50 * 0.3),
                    int(building.area_sqm / 50 * 0.9)
                ),
                "capacity": int(building.area_sqm / 50),
            },
        },
    }


def generate_alert_event(building_id: str) -> dict:
    """Generate simulated alert event (occasional)."""
    alerts = [
        ("warning", "Temperature Deviation", "Zone 2B temperature 2°C above setpoint"),
        ("info", "Occupancy Change", "Floor 3 occupancy increased by 25%"),
        ("warning", "Energy Spike", "Current power consumption 15% above forecast"),
    ]
    severity, title, message = random.choice(alerts)

    return {
        "type": "alert",
        "building_id": building_id,
        "timestamp": datetime.utcnow().isoformat(),
        "severity": severity,
        "title": title,
        "message": message,
    }


@router.websocket("/ws/buildings/{building_id}/realtime")
async def websocket_endpoint(websocket: WebSocket, building_id: str):
    """
    WebSocket endpoint for real-time building data.

    Streams:
    - Sensor updates every 5 seconds (energy, HVAC, IAQ, occupancy)
    - Alert events (occasional)

    Message format:
    ```json
    {
        "type": "sensor_update" | "alert",
        "building_id": "bld-001",
        "timestamp": "2024-01-15T10:30:00Z",
        "data": {...}
    }
    ```
    """
    # Verify building exists
    building = mock_data.get_building(building_id)
    if not building:
        await websocket.close(code=4004, reason="Building not found")
        return

    await manager.connect(websocket, building_id)

    try:
        # Send initial state
        await websocket.send_json({
            "type": "connected",
            "building_id": building_id,
            "message": f"Connected to {building.name} real-time feed",
        })

        # Background task to send periodic updates
        async def send_updates():
            update_count = 0
            while True:
                await asyncio.sleep(5)  # Update every 5 seconds

                # Send sensor data
                data = generate_realtime_data(building_id)
                await websocket.send_json(data)

                # Occasionally send an alert (every ~30 seconds on average)
                update_count += 1
                if update_count % 6 == 0 and random.random() < 0.3:
                    alert = generate_alert_event(building_id)
                    await websocket.send_json(alert)

        # Start update task
        update_task = asyncio.create_task(send_updates())

        # Wait for client messages (e.g., subscription changes)
        while True:
            try:
                message = await websocket.receive_text()
                data = json.loads(message)

                # Handle client commands
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                elif data.get("type") == "subscribe":
                    # Could handle topic subscriptions here
                    topics = data.get("topics", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "topics": topics,
                    })

            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})

    except WebSocketDisconnect:
        update_task.cancel()
        manager.disconnect(websocket, building_id)
    except Exception as e:
        update_task.cancel()
        manager.disconnect(websocket, building_id)
        raise
