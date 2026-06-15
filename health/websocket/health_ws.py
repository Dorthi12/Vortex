# health/websocket/health_ws.py
from typing import List, Dict, Any
from fastapi import WebSocket

class HealthWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Total active connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast JSON message to all active WebSocket clients"""
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WS] Broadcast failed for client connection: {e}")
                disconnected_clients.append(connection)

        # Cleanup dead connections
        for client in disconnected_clients:
            self.disconnect(client)

# Global manager instance
health_ws_manager = HealthWebSocketManager()
