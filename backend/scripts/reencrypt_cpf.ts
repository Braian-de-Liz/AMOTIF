/**
 * Script de backfill/re-criptografia de CPF.
 *
 * O que faz, por usuário:
 *  1. Decifra o CPF armazenado (o decryptCPF lê o IV embutido no blob,
 *     então funciona tanto para o esquema antigo quanto para o novo).
 *  2. Re-criptografa com IV aleatório (encryptCPF novo).
 *  3. Calcula o blind index (hashCPF) e grava em cpf_hash.
 *
 * É idempotente: rodar mais de uma vez não corrompe dados.
 *
 * Uso:
 *   bun run scripts/reencrypt_cpf.ts            # aplica
 *   bun run scripts/reencrypt_cpf.ts --dry-run  # só relata
 *
 * Migração de chave: CPFs antigos foram cifrados com a chave derivada de JWT_PASSWORD.
 * Rode com CPF_ENCRYPTION_KEY e CPF_INDEX_SECRET (novos) definidos e com o JWT_PASSWORD e
 * CPF_ENCRYPTION_SALT ORIGINAIS ainda no ambiente. O script lê com a chave nova e, se falhar,
 * com a antiga, e regrava tudo com a nova. Só depois disso troque/rotacione JWT_PASSWORD.
 */
import { PrismaClient } from '@prisma/client';
import { encryptCPF, decryptCPF, decryptCPFLegacy, hashCPF, assertCpfConfig } from '../src/lib/cpf.js';

assertCpfConfig();

/** Tenta a chave nova; se falhar (GCM rejeita a tag), cai para a chave antiga derivada de JWT_PASSWORD. */
function decifrar(cpf: string): string {
    try {
        return decryptCPF(cpf);
    } catch {
        return decryptCPFLegacy(cpf);
    }
}

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, cpf: true, cpf_hash: true }
    });

    console.log(`Encontrados ${users.length} usuário(s).${DRY_RUN ? ' (dry-run)' : ''}`);

    let migrados = 0;
    let jaOk = 0;
    let falhas = 0;

    for (const user of users) {
        try {
            const cpfPlano = decifrar(user.cpf);
            const novoHash = hashCPF(cpfPlano);

            // Já migrado: hash presente e correto. Ainda assim re-criptografamos
            // apenas se o hash estiver ausente, para evitar reescrita desnecessária.
            if (user.cpf_hash === novoHash) {
                jaOk++;
                continue;
            }

            const novoCpfCriptografado = encryptCPF(cpfPlano);

            if (DRY_RUN) {
                console.log(`[dry-run] usuário ${user.id}: geraria cpf_hash e re-criptografaria CPF.`);
                migrados++;
                continue;
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    cpf: novoCpfCriptografado,
                    cpf_hash: novoHash
                }
            });

            migrados++;
        } catch (err) {
            falhas++;
            console.error(`Falha ao processar usuário ${user.id}:`, (err as Error).message);
        }
    }

    console.log('---');
    console.log(`Migrados:  ${migrados}`);
    console.log(`Já OK:     ${jaOk}`);
    console.log(`Falhas:    ${falhas}`);

    if (falhas > 0) {
        console.error('\nHouve falhas. Verifique se JWT_PASSWORD/CPF_ENCRYPTION_SALT ainda são os usados no cadastro original.');
        process.exitCode = 1;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
