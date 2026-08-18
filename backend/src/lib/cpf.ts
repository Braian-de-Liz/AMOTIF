import { createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT = 'amotif-cpf-salt';

function deriveKey(): Buffer {
    const secret = Bun.env.JWT_PASSWORD;
    if (!secret) throw new Error("JWT_PASSWORD não definido para criptografia de CPF");
    return scryptSync(secret, SALT, 32);
}

function generateIV(cpf: string): Buffer {
    const iv = Buffer.alloc(IV_LENGTH);
    const hash = Buffer.from(cpf);
    for (let i = 0; i < IV_LENGTH; i++) {
        iv[i] = hash[i % hash.length] ^ (i * 0x37);
    }
    return iv;
}

export function encryptCPF(cpf: string): string {
    const key = deriveKey();
    const iv = generateIV(cpf);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
}

export function decryptCPF(encryptedCPF: string): string {
    const key = deriveKey();
    const combined = Buffer.from(encryptedCPF, 'base64');

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + 16);
    const data = combined.subarray(IV_LENGTH + 16);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return decrypted.toString('utf8');
}
