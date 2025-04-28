import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import streamSensorData from '../handler/grpc/sensor.js';
import sayHello from '../handler/grpc/hello.js';

// Load protos (from proto/ folder)
const packageHello = protoLoader.loadSync('proto/hello.proto');
const packageSensor = protoLoader.loadSync('proto/sensor.proto');

const helloProto = grpc.loadPackageDefinition(packageHello).hello;
const sensorProto = grpc.loadPackageDefinition(packageSensor).sensor;

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
