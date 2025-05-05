import startGrpcClient from './client/device_telemetry_grpc.js';
import { startWebSocketServer } from './server/websocket.js';

startWebSocketServer();
startDeviceTelemetryClient();
