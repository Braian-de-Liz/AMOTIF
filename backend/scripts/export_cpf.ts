/**
 * Extração pontual de CPF por usuário (suporte / prova de autoria).
 *
 * Decifra o CPF de UM usuário e lista os projetos dele.
 * Uso local apenas, por quem tem acesso aos segredos do servidor.
 * ATENÇÃO LGPD: a saída contém dado pessoal sensível. Não compartilhe.
 *
 * Uso:
 *   bun run scripts/export_cpf.ts --email usuario@email.com
 *   bun run scripts/export_cpf.ts --id <uuid>
 */
import { PrismaClient } from '@prisma/client';
import { decryptCPF } from '../src/lib/cpf.js';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
    const email = getArg('--email');
    const id = getArg('--id');

    if (!email && !id) {
        console.error('Informe --email <email> ou --id <uuid>.');
        process.exit(1);
    }

    const user = await prisma.user.findFirst({
        where: id ? { id } : { email },
        select: {
            id: true,
            nome_completo: true,
            email: true,
            cpf: true,
            createdAt: true,
            projetos_criados: {
                select: { id: true, titulo: true, createdAt: true },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!user) {
        console.error('Usuário não encontrado.');
        process.exit(1);
    }

    const cpf = decryptCPF(user.cpf);

    console.log('--- Dossiê de autoria ---');
    console.log(`Usuário:  ${user.nome_completo} (${user.email})`);
    console.log(`ID:       ${user.id}`);
    console.log(`CPF:      ${cpf}`);
    console.log(`Cadastro: ${user.createdAt.toISOString()}`);
    console.log(`Projetos criados: ${user.projetos_criados.length}`);
    for (const p of user.projetos_criados) {
        console.log(`  - ${p.titulo} (${p.id}) em ${p.createdAt.toISOString()}`);
    }
}

main()
    .catch((e) => {
        console.error('Erro:', (e as Error).message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
