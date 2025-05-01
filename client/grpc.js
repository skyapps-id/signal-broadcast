import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { broadcastToDevice } from '../server/websocket.js';

export default function startGrpcClient() {
    // Load .proto file
    const packageDefinition = protoLoader.loadSync('proto/sensor.proto', {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    const sensorProto = grpc.loadPackageDefinition(packageDefinition).sensor;

    // Create gRPC client
    const client = new sensorProto.SensorService('127.0.0.1:50051', grpc.credentials.createInsecure());

    // Call the streaming RPC
    const call = client.StreamSensorData({ device_id: 'device123' });

    call.on('data', (data) => {
        console.log(`Received data:`);
        console.log(`  Device ID: ${data.device_id}`);
        console.log(`  Temperature: ${data.temperature}`);
        console.log(`  Humidity: ${data.humidity}`);
        console.log(`  Timestamp: ${data.timestamp}`);
        broadcastToDevice(data.device_id, data);
    });

    call.on('end', () => {
        console.log('Stream ended by server');
    });

    call.on('error', (err) => {
        console.error('Stream error:', err);
    });

    call.on('status', (status) => {
        console.log('Status:', status);
    });
}