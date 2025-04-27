const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('hello.proto');
const packageDefinition1 = protoLoader.loadSync('sensor.proto');
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
const sensorProto = grpc.loadPackageDefinition(packageDefinition1).sensor;
const WebSocket = require('ws');

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
        broadcastToWsClients(sensorData);
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

// WebSocket clients array to store all connected clients
const wsClients = [];

// Function to broadcast data to all WebSocket clients
function broadcastToWsClients(sensorData) {
    wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(sensorData)); // Send the sensor data as JSON string
      }
    });
  }

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    wsClients.push(ws);

    ws.on('message', (message) => {
        console.log('Received message from WebSocket client:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

console.log('WebSocket Server running on ws://localhost:8080');