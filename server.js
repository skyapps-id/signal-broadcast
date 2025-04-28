const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('hello.proto');
const packageDefinition1 = protoLoader.loadSync('sensor.proto');
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
const sensorProto = grpc.loadPackageDefinition(packageDefinition1).sensor;

const WebSocket = require('ws');
const url = require('url');

function sayHello(call, callback) {
    const name = call.request.name;

    if (!name) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Name is required",
        });
    }

    callback(null, { message: `Hello, ${name}!` });
}

function streamSensorData(call, callback) {
    let count = 0;

    call.on('data', (sensorData) => {
        console.log('Received sensor data:', sensorData);
        broadcastToDevice("test", sensorData);
        broadcastToDevice("test123", "sensorData");
        count++;
    });

    call.on('end', () => {
        callback(null, { message: `Received ${count} sensor data points` });
    });
}

const server = new grpc.Server();
server.addService(helloProto.Greeter.service, { SayHello: sayHello });
server.addService(sensorProto.SensorService.service, { StreamSensorData: streamSensorData });
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('gRPC server running on port 50051');
});


// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

const topics = {};  // Store clients subscribed to each room (device-UUID)

wss.on('connection', (ws, req) => {
    const token = req.headers['authorization'];  // <- Get token from header

    if (!token) {
        console.log('No token provided, closing connection.');
        ws.close();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    let device_uuids = parsedUrl.query.device_uuid; // get device_uuid

    // Make sure device_uuids is always an array
    if (device_uuids) {
        if (!Array.isArray(device_uuids)) {
            device_uuids = [device_uuids];  // wrap single value into an array
        }

        device_uuids.forEach(device_uuid => {
            if (!topics[device_uuid]) {
                topics[device_uuid] = [];
            }
            topics[device_uuid].push(ws);

            console.log(`Client ${ws._socket.remoteAddress}:${ws._socket.remotePort} subscribed to room (device): ${device_uuid}`);
        });
    }
    // Handle incoming messages if needed (for example, if the client sends data to the server)
    ws.on('message', (message) => {
        console.log('Received message:', message);
    });

    // Handle client disconnect
    ws.on('close', () => {
        // Remove the client from all subscribed rooms
        for (const device_uuid in topics) {
            topics[device_uuid] = topics[device_uuid].filter(client => client !== ws);
            // If no clients are left in the room, delete the room
            if (topics[device_uuid].length === 0) {
                delete topics[device_uuid];
                console.log(`Room (device) ${device_uuid} has no more clients, removed.`);
            }
        }
        console.log('Client disconnected.');
    });
});

console.log('WebSocket Server running on ws://localhost:8080');

function broadcastToDevice(device_uuid, data) {
    if (topics[device_uuid]) {
        topics[device_uuid].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}