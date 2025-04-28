import { startGrpcServer } from './server/grpc.js';
import { startWebSocketServer } from './server/websocket.js';

startWebSocketServer();
startGrpcServer();