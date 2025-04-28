const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto
const packageDef = protoLoader.loadSync('sensor.proto');
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
            setTimeout(streamSensorData, 5000); // Retry after 5 seconds
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
            clearInterval(interval); // Stop sending
            call.end(); // End the broken stream
            console.log('Retrying in 5 seconds...');
            setTimeout(streamSensorData, 5000); // Retry after 5 seconds
        }

        count++;
    }, 1000);

    // Handle call errors (for sudden connection loss)
    call.on('error', (err) => {
        console.error('gRPC call error:', err.message);
        clearInterval(interval); // Stop interval
        console.log('Retrying in 5 seconds...');
        setTimeout(streamSensorData, 5000);
    });

    // Handle call end (stream closed unexpectedly)
    call.on('end', () => {
        console.warn('gRPC call ended');
        clearInterval(interval);
        console.log('Retrying in 5 seconds...');
        setTimeout(streamSensorData, 5000);
    });
}

// Start streaming
streamSensorData();
