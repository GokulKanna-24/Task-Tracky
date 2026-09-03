/**
 * Web Crypto API utilities for local-first password hashing & verification
 */

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(
  password: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const saltHex = existingSalt || generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Convert hex salt string to ArrayBuffer
  const saltBuffer = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign", "verify"]
  );

  const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);
  const hashArray = Array.from(new Uint8Array(exportedKey));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const { hash: computedHash } = await hashPassword(password, salt);
    return computedHash === hash;
  } catch (e) {
    console.error("Error verifying password", e);
    return false;
  }
}
