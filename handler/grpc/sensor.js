import { broadcastToDevice } from '../../server/websocket.js';

export default function streamSensorData(call, callback) {
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