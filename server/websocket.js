import { WebSocketServer } from 'ws';
import url from 'url';

const topics = {};  // Store clients subscribed to each room (device-UUID)

function startWebSocketServer() {
    const wss = new WebSocketServer({ port: 3000 });

    wss.on('connection', (ws, req) => {
        const token = req.headers['authorization'];

        if (!token) {
            console.log('No token provided, closing connection.');
            ws.close();
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        let device_uuids = parsedUrl.query.device_uuid;

        if (device_uuids) {
            if (!Array.isArray(device_uuids)) {
                device_uuids = [device_uuids];
            }

            device_uuids.forEach(device_uuid => {
                if (!topics[device_uuid]) {
                    topics[device_uuid] = [];
                }
                topics[device_uuid].push(ws);

                console.log(`Client ${ws._socket.remoteAddress}:${ws._socket.remotePort} subscribed to device: ${device_uuid}`);
            });
        }

        ws.on('message', (message) => {
            console.log('Received message:', message);
        });

        ws.on('close', () => {
            for (const device_uuid in topics) {
                topics[device_uuid] = topics[device_uuid].filter(client => client !== ws);
                if (topics[device_uuid].length === 0) {
                    delete topics[device_uuid];
                    console.log(`Device ${device_uuid} has no more clients, removed.`);
                }
            }
            console.log('Client disconnected.');
        });
    });

    console.log('WebSocket Server running on ws://localhost:8080');
}

function broadcastToDevice(device_uuid, data) {
    if (topics[device_uuid]) {
        topics[device_uuid].forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
}

export { startWebSocketServer, broadcastToDevice };
