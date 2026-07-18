import asyncio
import logging
from typing import Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QueueService")

class QueueService:
    def __init__(self):
        self.active_connections: Dict[str, list] = {}  # Map of client ID to connection list

    async def register_connection(self, client_id: str, websocket):
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"Registered connection for client: {client_id}")

    async def unregister_connection(self, client_id: str, websocket):
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
                logger.info(f"Unregistered connection for client: {client_id}")
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]

    async def broadcast_event(self, event_name: str, payload: dict):
        """
        Sends an event to all connected active client channels.
        """
        message = {"event": event_name, "data": payload}
        logger.info(f"Broadcasting event: {event_name}")
        
        # Gather all active sockets
        sockets_to_send = []
        for client_id, sockets in list(self.active_connections.items()):
            for ws in sockets:
                sockets_to_send.append((client_id, ws))

        for client_id, ws in sockets_to_send:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Failed to push message to {client_id}: {str(e)}")
                await self.unregister_connection(client_id, ws)

    async def process_async_dispatch(self, incident_id: str, volunteer_id: str):
        """
        Simulate an asynchronous background processing queue tasks.
        e.g., sends push notification to volunteer, updates dynamic navigation systems.
        """
        logger.info(f"Scheduling dispatch tasks for incident {incident_id} to volunteer {volunteer_id}")
        await asyncio.sleep(1) # mock database or push service delay
        
        # Broadcast notification event to listener apps
        await self.broadcast_event("incident_dispatched", {
            "incident_id": incident_id,
            "volunteer_id": volunteer_id,
            "timestamp": str(asyncio.get_event_loop().time())
        })
        logger.info(f"Asynchronous dispatch tasks completed for {incident_id}")

queue_service = QueueService()

# Build Sync: July 15, 2026
