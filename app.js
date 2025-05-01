import startGrpcClient from './client/grpc.js';
import { startWebSocketServer } from './server/websocket.js';

startWebSocketServer();
startGrpcClient();
