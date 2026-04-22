'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const changeListeners = new Set<() => void>();

export function initSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000', {
    auth: { token },
    autoConnect: true,
  });
  changeListeners.forEach((fn) => fn());
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    changeListeners.forEach((fn) => fn());
  }
}

export function onSocketChange(fn: () => void): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}
