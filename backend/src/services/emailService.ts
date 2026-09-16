import { sendEmail } from '../lib/email.js';

interface ConviteEmailData {
    emailDestinatario: string;
    nomeRemetente: string;
    tituloProjeto: string;
    cargo: string;
    mensagem?: string | null;
    tokenConvite: string;
    projetoId: string;
}

function montarHtmlConvite(data: ConviteEmailData): string {
    const mensagemExtra = data.mensagem
        ? `<p style="color:#555;margin-top:12px;">"${data.mensagem}"</p>`
        : '';

    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:30px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">AMOTIF</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">Convite de Colaboração</p>
        </div>

        <div style="background:#f9f9f9;border-radius:8px;padding:24px;margin-top:20px;">
            <p style="color:#333;font-size:16px;">
                <strong>${data.nomeRemetente}</strong> convidou você para colaborar no projeto:
            </p>

            <div style="background:white;border-left:4px solid #667eea;padding:12px 16px;margin:16px 0;border-radius:4px;">
                <h2 style="margin:0;color:#333;font-size:18px;">${data.tituloProjeto}</h2>
                <p style="margin:4px 0 0;color:#666;font-size:14px;">Cargo: <strong>${data.cargo}</strong></p>
            </div>

            ${mensagemExtra}

            <p style="color:#555;font-size:14px;margin-top:20px;">
                Para aceitar ou recusar este convite, acesse a plataforma AMOTIF.
            </p>
        </div>

        <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
            Este convite expira em 7 dias.
        </p>
    </div>`;
}

async function enviarConviteEmail(data: ConviteEmailData) {
    const subject = `${data.nomeRemetente} convidou você para o projeto "${data.tituloProjeto}" no AMOTIF`;
    const html = montarHtmlConvite(data);

    try {
        await sendEmail(data.emailDestinatario, subject, html);
        return true;
    } catch (error) {
        console.error("Erro ao enviar email de convite:", error);
        return false;
    }
}

export { enviarConviteEmail };
