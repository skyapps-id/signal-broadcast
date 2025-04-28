import grpc from '@grpc/grpc-js';

export default function sayHello(call, callback) {
    const name = call.request.name;

    if (!name) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Name is required",
        });
    }

    callback(null, { message: `Hello, ${name}!` });
}