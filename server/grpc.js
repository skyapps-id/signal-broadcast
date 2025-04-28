import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { broadcastToDevice } from './websocket.js'; // Notice: .js added

// Load protos (from proto/ folder)
const packageDefinition = protoLoader.loadSync('proto/hello.proto');
const packageDefinition1 = protoLoader.loadSync('proto/sensor.proto');

const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
const sensorProto = grpc.loadPackageDefinition(packageDefinition1).sensor;

// gRPC handlers
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

// Create and start gRPC server
function startGrpcServer() {
    const server = new grpc.Server();
    server.addService(helloProto.Greeter.service, { SayHello: sayHello });
    server.addService(sensorProto.SensorService.service, { StreamSensorData: streamSensorData });

    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        console.log('gRPC server running on port 50051');
    });
}

export { startGrpcServer };
