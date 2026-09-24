/**
 * Service WebSocket pour les mises à jour temps réel des prédictions
 * Utilise les WebSockets Django pour les notifications en temps réel
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.listeners = {
      'zone_updated': [],
      'alert_created': [],
      'weather_updated': [],
      'connection_open': [],
      'connection_close': [],
      'connection_error': []
    };
  }

  connect(url = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url || `${protocol}//localhost:8000/ws/predictions/`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (import.meta.env.DEV) console.log('[WebSocket] Connecté');
        this.reconnectAttempts = 0;
        this.emit('connection_open');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          if (import.meta.env.DEV) console.error('[WebSocket] Erreur parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        if (import.meta.env.DEV) console.error('[WebSocket] Erreur:', error);
        this.emit('connection_error', error);
      };

      this.ws.onclose = () => {
        if (import.meta.env.DEV) console.log('[WebSocket] Disconnecté');
        this.emit('connection_close');
        this.attemptReconnect();
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[WebSocket] Erreur création WebSocket:', error);
      this.attemptReconnect();
    }
  }

  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'zone_updated':
        this.emit('zone_updated', payload);
        break;
      case 'alert_created':
        this.emit('alert_created', payload);
        break;
      case 'weather_updated':
        this.emit('weather_updated', payload);
        break;
      case 'prediction_made':
        this.emit('prediction_made', payload);
        break;
      default:
        if (import.meta.env.DEV) console.log('[WebSocket] Message inconnu:', type, payload);
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else if (import.meta.env.DEV) {
      console.warn('[WebSocket] Non connecté, impossible d\'envoyer:', type);
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data = null) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          if (import.meta.env.DEV) console.error(`[WebSocket] Erreur dans callback ${event}:`, error);
        }
      });
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      if (import.meta.env.DEV) console.log(`[WebSocket] Tentative de reconnexion ${this.reconnectAttempts} dans ${delay}ms`);
      setTimeout(() => this.connect(), delay);
    } else if (import.meta.env.DEV) {
      console.error('[WebSocket] Reconnexion échouée après trop de tentatives');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Instance singleton
const wsService = new WebSocketService();

export default wsService;
