-- Índices alinhados às consultas de leitura mais frequentes.
CREATE INDEX "Projeto_deletedAt_createdAt_id_idx"
    ON "Projeto"("deletedAt", "createdAt" DESC, "id" DESC);

CREATE INDEX "Projeto_deletedAt_genero_createdAt_id_idx"
    ON "Projeto"("deletedAt", "genero", "createdAt" DESC, "id" DESC);

CREATE INDEX "Favorite_userId_createdAt_idx"
    ON "Favorite"("userId", "createdAt" DESC);

CREATE INDEX "MuralPost_projetoId_createdAt_id_idx"
    ON "MuralPost"("projetoId", "createdAt" DESC, "id" DESC);

CREATE INDEX "Sugestao_projetoId_createdAt_idx"
    ON "Sugestao"("projetoId", "createdAt" DESC);

CREATE INDEX "Sugestao_projetoId_status_createdAt_idx"
    ON "Sugestao"("projetoId", "status", "createdAt" DESC);

CREATE INDEX "Notification_userId_lida_createdAt_idx"
    ON "Notification"("userId", "lida", "createdAt" DESC);
