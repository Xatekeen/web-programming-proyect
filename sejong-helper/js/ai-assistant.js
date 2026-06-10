/* ai-assistant.js — Phase 2: client for the Claude AI backend proxy (server.js).
   The Anthropic API key stays on the server; this class only talks to
   our own /api/ai and /api/recommendations endpoints. */

class AIAssistant {
  constructor(apiBase) {
    // Default: proxy runs on localhost:3001 (see .env.example AI_PROXY_PORT).
    this.apiBase = apiBase || `${location.protocol}//${location.hostname}:3001`;
  }

  /**
   * Send a free-text question to the AI assistant.
   * @param {string} userQuestion
   * @returns {Promise<string>} assistant reply
   */
  async sendMessage(userQuestion) {
    try {
      const res = await fetch(`${this.apiBase}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuestion })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      return data.reply;
    } catch (err) {
      return `Sorry, the AI assistant is unavailable right now (${err.message}). ` +
        `Make sure the backend proxy is running: see sejong-helper/README.md.`;
    }
  }

  /**
   * Generate personalized restaurant recommendations based on preferences.
   * @param {object} preferences e.g. { budget: 2, cuisine: 'korean', dietary: ['vegan'] }
   * @returns {Promise<Array<string>>} ranked restaurant ids
   */
  async generateRecommendations(preferences) {
    try {
      const res = await fetch(`${this.apiBase}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.ids || [];
    } catch {
      return [];
    }
  }

  /** Quick check whether the backend proxy is reachable. */
  async isAvailable() {
    try {
      const res = await fetch(`${this.apiBase}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

window.AIAssistant = AIAssistant;
