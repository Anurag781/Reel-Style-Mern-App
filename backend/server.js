// start server
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const http = require('http');
const socketService = require('./src/services/socket.service');

connectDB();

const server = http.createServer(app);

// initialize socket.io (optional - fails gracefully)
const io = socketService.init(server);

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});