import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";

const prismaErrorMap: Record<string, { status: number; message: string }> = {
  P2000: { status: 400, message: "Valor muito longo para o campo." },
  P2001: { status: 404, message: "Registro não encontrado." },
  P2002: { status: 409, message: "Conflito: valor único já existe." },
  P2003: { status: 400, message: "Violação de chave estrangeira." },
  P2004: { status: 400, message: "Restrição do banco de dados falhou." },
  P2005: { status: 400, message: "Valor inválido para o campo." },
  P2006: { status: 400, message: "Valor inválido para o campo." },
  P2007: { status: 400, message: "Erro de validação de dados." },
  P2008: { status: 400, message: "Falha na consulta ao banco de dados." },
  P2009: { status: 400, message: "Erro na sintaxe da consulta." },
  P2010: { status: 500, message: "Erro interno na execução da consulta." },
  P2011: { status: 400, message: "Violação de restrição NOT NULL." },
  P2012: { status: 400, message: "Valor ausente para campo obrigatório." },
  P2013: { status: 400, message: "Valor ausente para campo obrigatório." },
  P2014: { status: 409, message: "Violação de relação (ID inválido)." },
  P2015: { status: 404, message: "Registro relacionado não encontrado." },
  P2016: { status: 500, message: "Erro de interpretação da consulta." },
  P2017: { status: 400, message: "Violação de relação entre registros." },
  P2018: { status: 404, message: "Registro relacionado não encontrado." },
  P2019: { status: 400, message: "Erro de entrada de dados." },
  P2020: { status: 400, message: "Valor fora da faixa permitida." },
  P2021: { status: 500, message: "Tabela não existe no banco de dados." },
  P2022: { status: 500, message: "Coluna não existe no banco de dados." },
  P2023: { status: 400, message: "Dados inconsistentes no banco." },
  P2024: { status: 408, message: "Timeout na conexão com o banco." },
  P2025: { status: 404, message: "Registro não encontrado para operação." },
  P2026: { status: 400, message: "Provedor de banco de dados não suporta essa operação." },
  P2027: { status: 500, message: "Erro múltiplo no banco de dados." },
  P2028: { status: 500, message: "Erro de transação no banco de dados." },
  P2029: { status: 400, message: "Violação de restrição de tamanho de parâmetro de consulta." },
  P2030: { status: 400, message: "Violação de restrição de tamanho de campo." },
  P2031: { status: 500, message: "Erro de extensão de índice do banco de dados." },
  P2033: { status: 400, message: "Número inválido na consulta (NaN)." },
  P2034: { status: 409, message: "Transação falhou devido a write conflict ou deadlock." },
};

const connectionErrorCodes = new Set(["P1000", "P1001", "P1002", "P1003", "P1008", "P1010", "P1011", "P1012", "P1013", "P1014", "P1015", "P1016", "P1017"]);

interface ErrorResponse {
  status: string;
  mensagem: string;
  erros?: any;
  codigo?: string;
}

export const globalErrorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (error.statusCode && error.statusCode >= 500) {
    request.log.error(error, "Erro interno do servidor");
  } else if (error.statusCode && error.statusCode >= 400) {
    request.log.warn(error, "Erro do cliente");
  } else {
    request.log.error(error, "Erro não tratado");
  }

  if (error.validation) {
    return reply.status(400).send({
      status: "erro",
      mensagem: "Erro de validação dos dados enviados",
      erros: error.validation,
    });
  }

  if (error.code === "FST_REQ_ID_MAX_REQ" || error.code === "FST_REQ_ID_DUPLICATE") {
    return reply.status(429).send({
      status: "erro",
      mensagem: "Muitas requisições. Tente novamente mais tarde.",
      codigo: error.code,
    });
  }

  if (
    error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
  ) {
    return reply.status(401).send({
      status: "erro",
      mensagem: "Token de autenticação inválido, ausente ou expirado",
      codigo: error.code,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    const mapped = prismaErrorMap[prismaError.code];

    if (mapped) {
      const response: ErrorResponse = {
        status: "erro",
        mensagem: mapped.message,
        codigo: prismaError.code,
      };

      if (prismaError.code === "P2002" && prismaError.meta?.target) {
        response.erros = {
          campos: prismaError.meta.target,
          mensagem: `O valor informado para ${(prismaError.meta.target as string[]).join(", ")} já está em uso.`,
        };
      }

      if (prismaError.code === "P2003" && prismaError.meta?.field_name) {
        response.erros = {
          campo: prismaError.meta.field_name,
          mensagem: "Referência a um registro que não existe.",
        };
      }

      if (prismaError.code === "P2025") {
        response.mensagem = "Recurso não encontrado.";
      }

      return reply.status(mapped.status).send(response);
    }

    return reply.status(400).send({
      status: "erro",
      mensagem: `Erro no banco de dados: ${prismaError.message}`,
      codigo: prismaError.code,
    });
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    let status = 503;
    let message = "Erro de comunicação com o banco de dados. Tente novamente mais tarde.";
    let code = "DB_CONNECTION_ERROR";

    if (error instanceof Prisma.PrismaClientInitializationError) {
      const initError = error as Prisma.PrismaClientInitializationError;
      if (initError.errorCode && connectionErrorCodes.has(initError.errorCode)) {
        status = 503;
        message = "Serviço de banco de dados indisponível no momento.";
        code = initError.errorCode;
      }
    }

    return reply.status(status).send({
      status: "erro",
      mensagem: message,
      codigo: code,
    });
  }

  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      status: "erro",
      mensagem: error.message || "Erro na requisição",
      codigo: error.code,
    });
  }

  return reply.status(500).send({
    status: "erro",
    mensagem: "Erro interno no servidor. Tente novamente mais tarde.",
  });
};
