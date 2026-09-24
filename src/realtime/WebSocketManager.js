// WebSocket Manager avec heartbeat et reconnexion automatique
export class WebSocketManager {
  constructor(url, token, onMessage, onError = null) {
    this.url = url;
    this.token = token;
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isManuallyClosed = false;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url, [`Bearer ${this.token}`]);

      this.ws.onopen = () => {
        if (import.meta.env.DEV) console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return;
          this.onMessage?.(data);
        } catch (error) {
          if (import.meta.env.DEV) console.error('[WS] Parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        if (import.meta.env.DEV) console.error('[WS] Error:', error);
        this.onError?.(error);
      };

      this.ws.onclose = () => {
        if (import.meta.env.DEV) console.log('[WS] Closed');
        this.stopHeartbeat();
        if (!this.isManuallyClosed) this.attemptReconnect();
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[WS] Connection error:', error);
      this.attemptReconnect();
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      if (import.meta.env.DEV) console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else if (import.meta.env.DEV) {
      console.error('[WS] Max reconnect attempts reached');
    }
  }

  send(type, payload = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else if (import.meta.env.DEV) {
      console.warn('[WS] Not connected, cannot send:', type);
    }
  }

  close() {
    this.isManuallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
