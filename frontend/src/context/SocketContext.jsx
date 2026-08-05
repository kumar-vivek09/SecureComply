import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [startupState, setStartupState] = useState('INITIALIZING');
  const [timeline, setTimeline] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate connections
    if (socketRef.current) return;

    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('backend-status', (data) => {
      setBackendConnected(data.connected);
    });

    newSocket.on('startup-state', (data) => {
      if (data.to) {
        setStartupState(data.to);
      }
      if (data.timeline) {
        setTimeline(data.timeline);
      }
    });

    newSocket.on('system-ready', () => {
      setStartupState('READY');
    });

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const subscribe = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const value = {
    socket,
    connected,
    startupState,
    timeline,
    backendConnected,
    subscribe,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
