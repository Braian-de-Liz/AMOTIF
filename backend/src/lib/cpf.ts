import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;
let cachedIndexKey: Buffer | null = null;
let cachedLegacyKey: Buffer | null = null;

function encryptionSalt(): string {
    return Bun.env.CPF_ENCRYPTION_SALT || 'amotif-cpf-salt';
}

/** Falha cedo (no boot) se as chaves do CPF não estiverem definidas. Elas são independentes de JWT_PASSWORD. */
export function assertCpfConfig(): void {
    if (!Bun.env.CPF_ENCRYPTION_KEY) throw new Error("CPF_ENCRYPTION_KEY não definido");
    if (!Bun.env.CPF_INDEX_SECRET) throw new Error("CPF_INDEX_SECRET não definido");
}

function deriveKey(): Buffer {
    if (cachedKey) return cachedKey;

    const secret = Bun.env.CPF_ENCRYPTION_KEY;
    if (!secret) throw new Error("CPF_ENCRYPTION_KEY não definido para criptografia de CPF");

    cachedKey = scryptSync(secret, encryptionSalt(), 32);
    return cachedKey;
}

function deriveIndexKey(): Buffer {
    if (cachedIndexKey) return cachedIndexKey;

    const secret = Bun.env.CPF_INDEX_SECRET;
    if (!secret) throw new Error("CPF_INDEX_SECRET não definido para o índice de CPF");

    cachedIndexKey = scryptSync(secret, 'amotif-cpf-index-salt', 32);
    return cachedIndexKey;
}

/** Chave antiga (derivada de JWT_PASSWORD). Só existe para o script de migração ler dados legados. */
function deriveLegacyKey(): Buffer {
    if (cachedLegacyKey) return cachedLegacyKey;

    const secret = Bun.env.JWT_PASSWORD;
    if (!secret) throw new Error("JWT_PASSWORD não definido (necessário para ler CPFs legados)");

    cachedLegacyKey = scryptSync(secret, encryptionSalt(), 32);
    return cachedLegacyKey;
}


export function hashCPF(cpf: string): string {
    const key = deriveIndexKey();
    return createHmac('sha256', key).update(cpf).digest('hex');
}


export function encryptCPF(cpf: string): string {
    const key = deriveKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
}

export function decryptCPF(encryptedCPF: string): string {
    return decryptWithKey(encryptedCPF, deriveKey());
}

/** Somente para o script de migração: decifra um CPF gravado com a chave antiga (JWT_PASSWORD). */
export function decryptCPFLegacy(encryptedCPF: string): string {
    return decryptWithKey(encryptedCPF, deriveLegacyKey());
}

function decryptWithKey(encryptedCPF: string, key: Buffer): string {
    const combined = Buffer.from(encryptedCPF, 'base64');

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const data = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return decrypted.toString('utf8');
}
