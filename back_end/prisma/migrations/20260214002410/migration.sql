-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "bio" TEXT,
    "instrumentos" TEXT[],
    "avatar_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL DEFAULT 120,
    "escala" TEXT,
    "descricao" TEXT,
    "audio_guia" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camada" (
    "id" TEXT NOT NULL,
    "nome_trilha" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "instrumento_tag" TEXT NOT NULL,
    "delay_offset" INTEGER NOT NULL DEFAULT 0,
    "volume_padrao" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "esta_aprovada" BOOLEAN NOT NULL DEFAULT false,
    "projetoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Camada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
