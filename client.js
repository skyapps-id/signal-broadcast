const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto
const packageDef = protoLoader.loadSync('sensor.proto');
const proto = grpc.loadPackageDefinition(packageDef).sensor;

// Create client
const client = new proto.SensorService('127.0.0.1:50051', grpc.credentials.createInsecure());

// Stream data to server
function streamSensorData() {
    const call = client.StreamSensorData((error, response) => {
        if (error) {
            console.error('Stream error:', error);
        } else {
            console.log('Server response:', response);
        }
    });

    let count = 0;
    // Set an unlimited interval
    const interval = setInterval(() => {
        const sensorData = {
            device_id: 'device123',
            temperature: 25.0 + count,
            humidity: 50.0 - count,
            timestamp: Date.now(),
        };

        console.log('Sending sensor data:', sensorData);
        call.write(sensorData);

        count++; // Increment counter for every data sent
    }, 1000);
}

streamSensorData();
