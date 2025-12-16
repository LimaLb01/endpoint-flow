/**
 * Armazenamento Temporário de Agendamentos
 * 
 * Em produção, substitua por banco de dados ou cache (Redis)
 * Este armazenamento é usado para manter dados completos do agendamento
 * até que o webhook nfm_reply seja recebido
 */

const { BOOKING_CONFIG } = require('../config/constants');

class BookingStorage {
  constructor() {
    this.storage = new Map();
    this.startCleanupInterval();
  }

  /**
   * Armazena dados de um agendamento
   * @param {string} bookingId - ID único do agendamento
   * @param {object} data - Dados do agendamento
   */
  set(bookingId, data) {
    this.storage.set(bookingId, {
      ...data,
      timestamp: Date.now()
    });
    console.log(`💾 Dados do agendamento armazenados com booking_id: ${bookingId}`);
  }

  /**
   * Recupera dados de um agendamento
   * @param {string} bookingId - ID único do agendamento
   * @returns {object|null} Dados do agendamento ou null
   */
  get(bookingId) {
    const data = this.storage.get(bookingId);
    if (data) {
      console.log(`📦 Dados completos recuperados do armazenamento para: ${bookingId}`);
    }
    return data;
  }

  /**
   * Remove dados de um agendamento
   * @param {string} bookingId - ID único do agendamento
   */
  delete(bookingId) {
    const deleted = this.storage.delete(bookingId);
    if (deleted) {
      console.log(`🗑️ Dados removidos do armazenamento: ${bookingId}`);
    }
    return deleted;
  }

  /**
   * Limpa dados expirados
   */
  cleanup() {
    const now = Date.now();
    const expirationTime = BOOKING_CONFIG.STORAGE_EXPIRATION_MS;
    let cleaned = 0;

    for (const [bookingId, data] of this.storage.entries()) {
      if (now - data.timestamp > expirationTime) {
        this.storage.delete(bookingId);
        cleaned++;
        console.log(`🗑️ Dados expirados removidos: ${bookingId}`);
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpeza concluída: ${cleaned} agendamento(s) removido(s)`);
    }
  }

  /**
   * Inicia intervalo de limpeza automática
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, BOOKING_CONFIG.CLEANUP_INTERVAL_MS);
  }

  /**
   * Retorna estatísticas do armazenamento
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      total: this.storage.size,
      entries: Array.from(this.storage.keys())
    };
  }
}

// Singleton instance
const bookingStorage = new BookingStorage();

module.exports = bookingStorage;

