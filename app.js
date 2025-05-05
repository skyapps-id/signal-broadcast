import { startWebSocketServer } from './server/websocket.js';
import { startDeviceTelemetryClient } from './client/device_telemetry_grpc.js';

startWebSocketServer();
startDeviceTelemetryClient();
