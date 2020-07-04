const _ = require('lodash');
const argv = require('argv');
const io = require('socket.io')();
const appConfig = require('./app.config.js');
const argvOptions = require('./argv.config.js');

const args = argv.option(argvOptions).run();
const port = 3080;

io.set('origins', '*:*');

const roomClientsMap = {};

io.on('connection', (socket) => {
  console.log('someone has joined the room')
  socket.on('create or join', (applyMessage) => {
    let roomClients = 0;
    const appliedRoom = applyMessage.room;

    roomClientsMap[appliedRoom] = roomClientsMap[appliedRoom] || [];
    roomClients = roomClientsMap[appliedRoom].length;

    // Handle room full state
    if (roomClients >= appConfig.maxClientsPerRoom) {
      socket.emit('full');
      return;
    }

    // Handle room clients number
    if (roomClients === 0) {
      socket.emit('created', socket.id);
    } else {
      socket.emit('joined', {
        clientId: socket.id,
        roomClients: roomClientsMap[appliedRoom],
      });
    }

    // Join the room and record.
    socket.join(appliedRoom);
    roomClientsMap[appliedRoom].push(socket.id);

    /**
     * Handle all communication message
     */
    socket.on('communication', (message) => {
      console.log('message on communitcation', message);
      switch (message.type) {
        case 'offer':
        case 'answer':
        case 'candidate':
          socket
            .broadcast
            .to(message.sendTo)
            .emit('communication', message);
          break;
        default:
          break;
      }
    });

    /**
     * Handle client disconnect event.
     */
    socket.on('disconnect', () => {
      socket.leave(appliedRoom);
      _.pull(roomClientsMap[appliedRoom], socket.id);
    });
  });
});

io.listen(port);
console.log('starting');