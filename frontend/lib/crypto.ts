/**
 * Encrypts a payload object using AES-256-GCM with the browser's Web Crypto API.
 * The derived key is a SHA-256 hash of the secretKey.
 * Returns a base64 encoded string combining the 12-byte IV (nonce) and ciphertext.
 */
export async function encryptPayload<T>(
  payload: T,
  secretKey: string,
): Promise<string> {
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(secretKey),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data,
  );

  const combined = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.byteLength);

  // Convert to Base64
  return btoa(String.fromCharCode(...combined));
}
