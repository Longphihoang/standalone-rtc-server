import io from 'socket.io-client';

let io = io('wss:localhost:3080;');

io.on('connection', (socket) => {
    console.log('we in boiz');    // ...
  });