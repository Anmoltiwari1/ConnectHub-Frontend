import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API } from '../config/api';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

/**
 * WEBSOCKET CONTEXT PROVIDER
 * --------------------------
 * Manages the STOMP/WebSocket connection for real-time messaging.
 * Provides subscribe/publish methods to the rest of the app.
 */
export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const subscriptionsRef = useRef({});

  // Connect when user is authenticated
  useEffect(() => {
    if (!user?.token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(API.WEBSOCKET),
      connectHeaders: {
        Authorization: `Bearer ${user.token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('❌ WebSocket disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [user?.token]);

  /**
   * Subscribe to a STOMP destination.
   * Returns an unsubscribe function.
   */
  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn('WebSocket not connected, cannot subscribe to', destination);
      return () => {};
    }

    // Prevent duplicate subscriptions
    if (subscriptionsRef.current[destination]) {
      subscriptionsRef.current[destination].unsubscribe();
    }

    const subscription = client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch {
        callback(message.body);
      }
    });

    subscriptionsRef.current[destination] = subscription;

    return () => {
      subscription.unsubscribe();
      delete subscriptionsRef.current[destination];
    };
  }, []);

  /**
   * Publish a message to a STOMP destination.
   */
  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn('WebSocket not connected, cannot publish to', destination);
      return;
    }

    client.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    });
  }, [user?.token]);

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, publish }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}
