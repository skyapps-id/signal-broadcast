import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Load proto
const packageDef = protoLoader.loadSync('proto/sensor.proto');
const proto = grpc.loadPackageDefinition(packageDef).sensor;

// Create client
const client = new proto.SensorService('127.0.0.1:50051', grpc.credentials.createInsecure());

// Stream data to server
function streamSensorData() {
    console.log('Starting gRPC stream...');
    const call = client.StreamSensorData((error, response) => {
        if (error) {
            console.error('Stream error:', error.message);
            console.log('Retrying in 5 seconds...');
            setTimeout(streamSensorData, 5000);
        } else {
            console.log('Server response:', response);
        }
    });

    let count = 0;
    const interval = setInterval(() => {
        const sensorData = {
            device_id: 'device123',
            temperature: 25.0 + count,
            humidity: 50.0 - count,
            timestamp: Date.now(),
        };

        console.log('Sending sensor data:', sensorData);

        try {
            call.write(sensorData);
        } catch (err) {
            console.error('Write error:', err.message);
            clearInterval(interval);
            call.end();
            console.log('Retrying in 5 seconds...');
            setTimeout(streamSensorData, 5000);
        }

        count++;
    }, 1000);

    // Handle call errors (like sudden disconnection)
    call.on('error', (err) => {
        console.error('gRPC call error:', err.message);
        clearInterval(interval);
        console.log('Retrying in 5 seconds...');
        setTimeout(streamSensorData, 5000);
    });

    call.on('end', () => {
        console.warn('gRPC call ended');
        clearInterval(interval);
        console.log('Retrying in 5 seconds...');
        setTimeout(streamSensorData, 5000);
    });
}

// Start streaming
streamSensorData();
