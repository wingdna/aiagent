// 🛑 IRON SHIELD PROTOCOL: WEB CRYPTO ISOLATION 🛑
// This service ensures API keys are never stored in plain text in React state.

class CryptoService {
  private key: CryptoKey | null = null;
  private iv: Uint8Array | null = null;

  async init() {
    if (this.key) return;
    this.key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    this.iv = crypto.getRandomValues(new Uint8Array(12));
  }

  async encrypt(text: string): Promise<string> {
    await this.init();
    if (!this.key || !this.iv) throw new Error('CryptoService not initialized');

    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.iv as any },
      this.key,
      encoded
    );

    // Convert to base64 for easy storage in state
    return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  }

  async decrypt(ciphertextBase64: string): Promise<string> {
    await this.init();
    if (!this.key || !this.iv) throw new Error('CryptoService not initialized');

    const ciphertextStr = atob(ciphertextBase64);
    const ciphertext = new Uint8Array(ciphertextStr.length);
    for (let i = 0; i < ciphertextStr.length; i++) {
      ciphertext[i] = ciphertextStr.charCodeAt(i);
    }

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.iv as any },
      this.key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }
}

export const cryptoService = new CryptoService();
