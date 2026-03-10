import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "./encryption";

// A valid 32-byte key (64 hex characters)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
// A different valid 32-byte key
const WRONG_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("JIRA_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = "my-secret-access-token-12345";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces output in the format iv:ciphertext:tag (3 base64 parts)", () => {
    const encrypted = encrypt("test-value");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);

    // Each part should be valid base64
    for (const part of parts) {
      expect(() => Buffer.from(part, "base64")).not.toThrow();
      // Ensure it's not empty
      expect(Buffer.from(part, "base64").length).toBeGreaterThan(0);
    }
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "same-input-different-output";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);

    // Both should still decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("encrypts and decrypts an empty string", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("encrypts and decrypts a string with unicode characters", () => {
    const plaintext = "token-with-special-chars: !@#$%^&*()";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("fails to decrypt with a wrong key", () => {
    const encrypted = encrypt("secret");

    // Switch to the wrong key
    vi.stubEnv("JIRA_TOKEN_ENCRYPTION_KEY", WRONG_KEY);

    expect(() => decrypt(encrypted)).toThrow();
  });

  it("fails to decrypt a tampered ciphertext", () => {
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    // Tamper with the ciphertext portion
    const tamperedCiphertext = Buffer.from("tampered-data").toString("base64");
    const tampered = `${parts[0]}:${tamperedCiphertext}:${parts[2]}`;

    expect(() => decrypt(tampered)).toThrow();
  });

  it("fails to decrypt an invalid format (missing parts)", () => {
    expect(() => decrypt("onlyonepart")).toThrow(/expected 3 base64 parts/);
    expect(() => decrypt("two:parts")).toThrow(/expected 3 base64 parts/);
  });

  it("throws when JIRA_TOKEN_ENCRYPTION_KEY is not set", () => {
    vi.stubEnv("JIRA_TOKEN_ENCRYPTION_KEY", "");
    // Empty string is falsy, so getEncryptionKey should throw
    expect(() => encrypt("test")).toThrow(
      "JIRA_TOKEN_ENCRYPTION_KEY environment variable is not set"
    );
  });

  it("throws when JIRA_TOKEN_ENCRYPTION_KEY is not 32 bytes", () => {
    vi.stubEnv("JIRA_TOKEN_ENCRYPTION_KEY", "0123456789abcdef"); // only 8 bytes
    expect(() => encrypt("test")).toThrow(/must be 32 bytes/);
  });
});
