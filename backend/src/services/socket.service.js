let io = null;

function init(server) {
  try {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // frontend dev origins
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      // join partner room
      socket.on('join', (room) => {
        socket.join(room);
      });

      socket.on('disconnect', () => {
        // noop for now
      });
    });

    console.log('Socket service initialized');
    return io;
  } catch (err) {
    console.error('Failed to initialize socket service', err);
    return null;
  }
}

function getIO() {
  return io;
}

module.exports = {
  init,
  getIO
};