import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { broadcastToDevice } from '../server/websocket.js';

export function startDeviceTelemetryClient() {
    // Load .proto file
    const packageDefinition = protoLoader.loadSync('proto/device_telemetry.proto', {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    const deviceTelemetryProto = grpc.loadPackageDefinition(packageDefinition).device_telemetry;

    // Create gRPC client
    const client = new deviceTelemetryProto.DeviceTelemetryService('127.0.0.1:50051', grpc.credentials.createInsecure());

    // Call the streaming RPC
    const call = client.DeviceTelemetry({ device_uuid: 'signal-broadcast' });

    call.on('data', (resp) => {
        console.log(`Received data device: ${resp.device_uuid} forward to socket`);
        resp.data = JSON.parse(resp.data);
        broadcastToDevice(resp.device_uuid, resp);
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