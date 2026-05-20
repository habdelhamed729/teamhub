import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './config/socket';

const PORT = process.env.PORT || 3000;

// Wrap Express with native HTTP server so Socket.io can attach
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
