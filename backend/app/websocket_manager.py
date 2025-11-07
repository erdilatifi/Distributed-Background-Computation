"""
WebSocket manager for real-time job updates
"""
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Map of job_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Map of user_id -> set of WebSocket connections
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, job_id: str, user_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        # Add to job-specific connections
        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()
        self.active_connections[job_id].add(websocket)
        
        # Add to user-specific connections
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        
    def disconnect(self, websocket: WebSocket, job_id: str, user_id: str):
        """Remove a WebSocket connection"""
        # Remove from job connections
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
        
        # Remove from user connections
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
    
    async def send_job_update(self, job_id: str, data: dict):
        """Send update to all connections watching a specific job"""
        if job_id in self.active_connections:
            message = json.dumps(data)
            disconnected = set()
            
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.active_connections[job_id].discard(connection)
    
    async def send_user_update(self, user_id: str, data: dict):
        """Send update to all connections for a specific user"""
        if user_id in self.user_connections:
            message = json.dumps(data)
            disconnected = set()
            
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.user_connections[user_id].discard(connection)
    
    async def broadcast(self, data: dict):
        """Broadcast message to all connected clients"""
        message = json.dumps(data)
        all_connections = set()
        
        for connections in self.active_connections.values():
            all_connections.update(connections)
        
        disconnected = set()
        for connection in all_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            for job_id in list(self.active_connections.keys()):
                self.active_connections[job_id].discard(connection)
    
    def get_connection_count(self, job_id: str = None) -> int:
        """Get number of active connections for a job or total"""
        if job_id:
            return len(self.active_connections.get(job_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()


async def handle_websocket_connection(
    websocket: WebSocket,
    job_id: str,
    user_id: str
):
    """
    Handle a WebSocket connection for job updates.
    Keeps connection alive and sends periodic heartbeats.
    """
    await manager.connect(websocket, job_id, user_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "job_id": job_id,
            "message": "WebSocket connected successfully"
        })
        
        # Keep connection alive with heartbeat
        while True:
            try:
                # Wait for messages from client (like ping)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                
                # Handle ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
                    
            except asyncio.TimeoutError:
                # Send heartbeat if no message received
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": asyncio.get_event_loop().time()
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, job_id, user_id)
