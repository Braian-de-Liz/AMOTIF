# Graph Report - AMOTIF  (2026-11-07)

## Corpus Check
- 369 files · ~114,685 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 13, .lock 4, (none) 3)

## Summary
- 1748 nodes · 4712 edges · 98 communities (66 shown, 32 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 317 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Permission Model & Roles
- Architecture Concept Map
- Branch & Layer Management UI
- Playback Transport & Waveform UI
- Audio Codec Encoding
- Project Collaboration Modals
- App Routes & Pages
- Backend Dependencies (Fastify)
- Global Error Handling
- Frontend Tooling & Lint
- Music Domain Glossary
- User Profile & Layout
- Security Config & Rate Limiting
- Layer Action Menus
- Auth & Collaboration Hooks
- Audio Editor
- Feed & Avatars
- CPF Encryption Scripts
- CI Pipeline
- JWT Auth & Social Routes
- Layer Comments Backend
- Collaboration Schemas
- Project Ownership & Invites
- Invites & Feedback UI
- File Upload Limits
- Project & Layer Creation
- Backend Scripts
- Permission Checks & User Deletion
- Branch API
- Corporate Strategy Docs
- Frontend TS Config
- Layer Ownership Checks
- Environment Config & Infra
- Likes, Favorites & Search Routes
- Favorites List & API Client
- Composite Index Migrations
- Frontend Dependencies
- Project & Explorer Schemas
- Invite Link Joining
- Colaboration List Schemas
- Route Protection & User Context
- Email / SMTP
- Backend TS Config
- Layer Comments UI
- Audio Stretch Types
- Audio Preview Player
- User Schema Migrations
- Mural & Hotspot Index Migrations
- Core Schema Migration
- Notification Schema Migrations
- PWA Manifest
- Collaborator & Invite Migration
- Frontend Build Scripts
- Error Boundary
- Desktop Shell (WebView)
- Favorites Migration
- Layer Tempo & Pitch Schemas
- Invite Link Tests
- Signup Validation Schema
- Desktop Build Scripts
- Invite Link Migration
- Layer Branch Migration
- Web Shell & SEO
- Follows Migration
- Comment Markers Migration
- Version API Schemas
- Modal Hook
- Collaboration Validation Schema
- Instrument Validation Schema
- Login Validation Schema
- Password Validation Schema
- Suggestion Validation Schema
- Layer Modal Tests
- Favorites Schemas
- Update Suggestion Schema
- Create Suggestion Schema
- List Suggestions Schema
- List Followers Schema
- List Following Schema
- Notifications Query Schema
- Read All Notifications Schema
- Delete Project Schema
- Mural Query Schema
- Instrument Search Schema
- Delete User Schema
- Get Me Schema
- Restore Version Schema
- Rollback Version Schema

## God Nodes (most connected - your core abstractions)
1. `autenticarJWT()` - 115 edges
2. `@fastify/type-provider-typebox` - 66 edges
3. `Plugin_Routes()` - 63 edges
4. `@sinclair/typebox` - 61 edges
5. `react` - 59 edges
6. `Error_schema` - 55 edges
7. `globalErrorHandler()` - 44 edges
8. `fastify` - 42 edges
9. `lucide-react` - 39 edges
10. `PlaybackEngine` - 37 edges

## Surprising Connections (you probably didn't know these)
- `measureDelaySamples` --conceptually_related_to--> `Technical Precision with Artistic Sensitivity`  [INFERRED]
  frontend/stretch-harness.html → documents/AMOTIF_BEC.pdf
- `AMOTIF Design System v2` --conceptually_related_to--> `Base Estratégica Corporativa`  [INFERRED]
  frontend/amotif-design-system-v2.md → documents/AMOTIF_BEC.pdf
- `Waveform Signature Element` --conceptually_related_to--> `Git for Musicians Analogy`  [INFERRED]
  frontend/amotif-design-system-v2.md → documents/AMOTIF_BEC.pdf
- `AMOTIF Brand Mark (Treble Clef with Radial Instrument Arms)` --conceptually_related_to--> `AMOTIF Platform`  [INFERRED]
  frontend/public/assets/logo.svg → documents/Amotif ideias e planejamento.pdf
- `AMOTIF Brand Mark (Treble Clef with Radial Instrument Arms)` --conceptually_related_to--> `Camadas Instrumentais Independentes`  [INFERRED]
  frontend/public/assets/logo.svg → documents/Amotif ideias e planejamento.pdf

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fluxo de Versionamento e Aprovacao de Layers** — documents_architecture_model_camada, documents_architecture_model_layerversion, backend_src_services_versionservice, documents_architecture_layer_versioning, documents_architecture_approval [EXTRACTED 1.00]
- **Pipeline de Validacao TypeBox -> JSON Schema -> AJV -> Fastify** — readme_typebox, documents_typebox_fastify_bun_json_schema, documents_typebox_fastify_bun_ajv, readme_fastify, documents_typebox_fastify_bun_validation_chain [EXTRACTED 1.00]
- **Arquitetura Flat Fastify-Native do Backend** — readme_fastify_plugins, documents_architecture_hooks, documents_architecture_router_domains, backend_src_routers_plugin_routes, documents_organization_flat_route_prisma [INFERRED 0.85]
- **Design System Token System** — frontend_amotif_design_system_v2_verde_palette, frontend_amotif_design_system_v2_typography_triad, frontend_amotif_design_system_v2_radius_by_function, frontend_amotif_design_system_v2_glass_scope, frontend_amotif_design_system_v2_meaningful_motion, frontend_amotif_design_system_v2_anti_patterns [EXTRACTED 1.00]
- **Audio Precision Verification Flow** — frontend_stretch_harness, frontend_stretch_harness_renderstretched, frontend_stretch_harness_encodemp3inworker, frontend_stretch_harness_measuredelaysamples, frontend_stretch_harness_runchecks [EXTRACTED 1.00]
- **AMOTIF Strategic Identity** — documents_amotif_bec, documents_amotif_bec_git_for_musicians, documents_amotif_bec_vision, documents_amotif_bec_mission, documents_amotif_bec_values, documents_amotif_bec_smart_objectives [EXTRACTED 1.00]
- **AMOTIF Technology Stack** — documents_amotif_ideias_e_planejamento_fastify, documents_amotif_ideias_e_planejamento_prisma_orm, documents_amotif_ideias_e_planejamento_zod, documents_amotif_ideias_e_planejamento_supabase_storage, documents_amotif_ideias_e_planejamento_go_fiber, documents_amotif_ideias_e_planejamento_neon [EXTRACTED 1.00]
- **Audio Upload Pipeline (Node validation → Go upload_service → Supabase Storage → Neon)** — documents_amotif_ideias_e_planejamento_fluxo_de_arquivos, documents_amotif_ideias_e_planejamento_backend_nodejs, documents_amotif_ideias_e_planejamento_microsservico_audio, documents_amotif_ideias_e_planejamento_pipe_http, documents_amotif_ideias_e_planejamento_supabase_storage, documents_amotif_ideias_e_planejamento_neon [EXTRACTED 1.00]
- **Radial Brand Mark Composition (clef core + five instrument arms)** — frontend_public_assets_logo_brand_mark, frontend_public_assets_logo_clave_de_sol, frontend_public_assets_logo_braco_microfone, frontend_public_assets_logo_braco_trompete, frontend_public_assets_logo_braco_violao, frontend_public_assets_logo_braco_bumbo, frontend_public_assets_logo_braco_teclado, frontend_public_assets_logo_paleta_verde [EXTRACTED 1.00]

## Communities (98 total, 32 thin omitted)

### Community 0 - "Permission Model & Roles"
Cohesion: 0.05
Nodes (71): Acao, PapelEfetivo, papelNoProjeto(), PERMISSOES, pode(), collectDeletablePaths(), createUrlSigner(), fetchChunk() (+63 more)

### Community 1 - "Architecture Concept Map"
Cohesion: 0.06
Nodes (73): Aprovacao de Layer pelo Dono, Sincronia Ritmica BPM + Offset, Fluxo de Dados de Colaboracao, cpf.ts (Validacao de CPF), Paginacao Cursor-Based de Versoes, Modelo de Dados (14 modelos Prisma), App Desktop Windows (WebView2 + Inno Setup), Architecture Document - AMOTIF (+65 more)

### Community 2 - "Branch & Layer Management UI"
Cohesion: 0.07
Nodes (46): AddLayerChoiceModalProps, BranchManager(), loadBranches(), BranchManagerProps, BranchSelector(), BranchSelectorProps, ChangePasswordProps, CreateLayerModalProps (+38 more)

### Community 3 - "Playback Transport & Waveform UI"
Cohesion: 0.08
Nodes (29): isShortcutBlocked(), TransportBar(), TransportBarProps, WaveformTrackProps, usePlayback(), usePlaybackFrame(), usePlaybackState(), fakeBuffer() (+21 more)

### Community 4 - "Audio Codec Encoding"
Cohesion: 0.05
Nodes (40): wasm-media-encoders@0.7.0, FakeBuf, FakeCtx, makeBuf(), mockFetch, state, bestLag(), correlationAt() (+32 more)

### Community 5 - "Project Collaboration Modals"
Cohesion: 0.06
Nodes (49): DeleteColabModal(), handleClose(), handleRemove(), EditProjectModalProps, buildInviteUrl(), InviteLink, InviteLinksPanel(), InviteLinksPanelProps (+41 more)

### Community 6 - "App Routes & Pages"
Cohesion: 0.07
Nodes (38): App(), Cadastro, FavoritesPage, GravarCamada, Home, InvitesPage, JoinInvite, LoadingFallback() (+30 more)

### Community 7 - "Backend Dependencies (Fastify)"
Cohesion: 0.05
Nodes (46): author, dependencies, fastify@5.11.3, @fastify/cors@^11.1.0, @fastify/jwt@^10.0.0, fastify-plugin@^5.1.0, @fastify/rate-limit@^11.2.0, @fastify/swagger@^9.7.0 (+38 more)

### Community 8 - "Global Error Handling"
Cohesion: 0.11
Nodes (36): connectionErrorCodes, ErrorResponse, globalErrorHandler(), prismaErrorMap, buildApp(), mockPrisma, prismaPlugin, mockPrisma (+28 more)

### Community 9 - "Frontend Tooling & Lint"
Cohesion: 0.06
Nodes (43): devDependencies, babel-plugin-react-compiler@^1.0.0, eslint@^9.39.1, @eslint/js@^9.39.1, eslint-plugin-react-hooks@^7.0.1, eslint-plugin-react-refresh@^0.4.24, globals@^16.5.0, jsdom@^29.1.1 (+35 more)

### Community 10 - "Music Domain Glossary"
Cohesion: 0.07
Nodes (36): AMOTIF Platform, Áudio Guia (Faixa Guia), Backend Principal (Node.js), BPM (Batidas por Minuto), Camada / Layer (Entidade de Contribuição), Camadas Instrumentais Independentes, CPF (Validação de Usuário Real), Crédito Explícito de Autoria (+28 more)

### Community 11 - "User Profile & Layout"
Cohesion: 0.12
Nodes (20): AppLayout(), BioEditor(), DeleteAccountModal(), DeleteAccountModalProps, FollowersList(), FollowersListProps, UserStats(), UserStatsProps (+12 more)

### Community 12 - "Security Config & Rate Limiting"
Cohesion: 0.08
Nodes (22): @fastify/cookie@^11.0.2, limite_autenticacao, limite_refresh, isObjetoInexistente(), login_user(), logout_user(), COOKIE_OPTIONS, refresh_token() (+14 more)

### Community 13 - "Layer Action Menus"
Cohesion: 0.09
Nodes (25): ActionMenu(), ActionMenuItem, ActionMenuProps, AddLayerChoiceModal(), DeleteLayerModal(), handleClose(), handleDelete(), DeleteProjectModal() (+17 more)

### Community 14 - "Auth & Collaboration Hooks"
Cohesion: 0.14
Nodes (21): autenticarJWT(), verificar_colaborador(), audioSigner(), list_following(), Validacao_pesada(), get_notifications(), post_project(), del_project() (+13 more)

### Community 15 - "Audio Editor"
Cohesion: 0.12
Nodes (29): wavesurfer.js@^7.12.7, applyNoiseGate(), AudioEditor(), initWaveSurfer(), AudioEditorProps, EditMode, encodeWav(), normalizeIfClipping() (+21 more)

### Community 16 - "Feed & Avatars"
Cohesion: 0.11
Nodes (23): Avatar(), AvatarProps, Feed(), FeedSkeleton(), GENEROS_FEED, INSTRUMENTOS_FEED, UserWithFollowing, FollowButton() (+15 more)

### Community 17 - "CPF Encryption Scripts"
Cohesion: 0.11
Nodes (23): getArg(), main(), prisma, decifrar(), DRY_RUN, main(), prisma, segredoConfere() (+15 more)

### Community 18 - "CI Pipeline"
Cohesion: 0.07
Nodes (32): defaults, env, runs-on, steps, concurrency, cancel-in-progress, group, run (+24 more)

### Community 19 - "JWT Auth & Social Routes"
Cohesion: 0.13
Nodes (18): @fastify/jwt, FastifyJWT, deletar_comentario(), follow_user(), list_followers(), Unfollow_route(), read_all_notifications(), read_notification() (+10 more)

### Community 20 - "Layer Comments Backend"
Cohesion: 0.12
Nodes (24): contextoDaCamada(), atualizar_comentario(), ComentarioRow, SELECT_COMENTARIO, serializarComentario(), criar_comentario(), formatarTempo(), listar_comentarios() (+16 more)

### Community 21 - "Collaboration Schemas"
Cohesion: 0.11
Nodes (11): schema_colaboretors, list_user_invites_schema, DefaultError, Error_schema, follow_schema, delete_lay_schema, like_project_schema, read_notification_schema (+3 more)

### Community 22 - "Project Ownership & Invites"
Cohesion: 0.15
Nodes (20): verificar_dono_projeto(), emailIgual(), normalizarEmail(), Accept_invite(), colaborators(), convite_project(), Delete_Colab(), invite_links() (+12 more)

### Community 23 - "Invites & Feedback UI"
Cohesion: 0.16
Nodes (13): FeedbackProvider(), JoinInvite(), renderFeed(), Harness(), renderCard(), handlers, server, preview (+5 more)

### Community 24 - "File Upload Limits"
Cohesion: 0.10
Nodes (15): @fastify/multipart@^10.1.0, rejeitarCorpoGrande(), upload_audio(), schema_upload_audio, buildApp(), corpoBuffer(), corpoStream(), partes() (+7 more)

### Community 25 - "Project & Layer Creation"
Cohesion: 0.15
Nodes (16): CreateLayerModal(), handleClose(), handleSubmit(), CreateProjectModalProps, NovoStudio(), Step, generos, projectSchema (+8 more)

### Community 26 - "Backend Scripts"
Cohesion: 0.08
Nodes (25): scripts, bench, bench:upload, build_deploy, build_exe, check, clean, clmodules (+17 more)

### Community 27 - "Permission Checks & User Deletion"
Cohesion: 0.18
Nodes (15): fastify, FastifyRequest, verificar_permissao(), Deletar_user(), Recuperar_senha(), Get_user(), Get_user_with_counts(), Patch_Instrumentos() (+7 more)

### Community 28 - "Branch API"
Cohesion: 0.15
Nodes (19): branch_route(), BranchAuthorResponse, BranchResponse, BranchVersionResponse, create_branch_schema, delete_branch_schema, list_branches_schema, merge_branch_schema (+11 more)

### Community 29 - "Corporate Strategy Docs"
Cohesion: 0.13
Nodes (18): Base Estratégica Corporativa, Git for Musicians Analogy, AMOTIF Mission, SMART Objectives, Technical Precision with Artistic Sensitivity, Corporate Values, AMOTIF Vision, AMOTIF Design System v2 (+10 more)

### Community 30 - "Frontend TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+13 more)

### Community 31 - "Layer Ownership Checks"
Cohesion: 0.18
Nodes (14): carregarCamada(), naoEncontrada(), verificar_autor_layer(), verificar_autor_ou_dono_layer(), AudioRef, deleteOwnedAudios(), delete_layer(), rollback_route() (+6 more)

### Community 32 - "Environment Config & Infra"
Cohesion: 0.14
Nodes (11): InfraPlugin(), adapter, fastify, FastifyInstance, notiType, pool, prisma, prisma_plugin (+3 more)

### Community 33 - "Likes, Favorites & Search Routes"
Cohesion: 0.11
Nodes (12): cleanup_route(), Create_like(), Toggle_favorite(), search_project(), AUDIO_AUTOR, AUDIO_AUTOR_2, AUDIO_DONO, Camada (+4 more)

### Community 34 - "Favorites List & API Client"
Cohesion: 0.17
Nodes (14): FavoritesList(), FavoritesListProps, ProjectCard, fetchWithRefresh(), useApi(), useApiMutation(), UseApiOptions, UseApiResult (+6 more)

### Community 35 - "Composite Index Migrations"
Cohesion: 0.16
Nodes (18): Camada_currentVersionId_key, "LayerBranch", LayerBranch_camadaId_idx, LayerBranch_camadaId_nome_key, "LayerVersion", LayerVersion_autorId_idx, LayerVersion_camadaId_createdAt_idx, LayerVersion_camadaId_versionNumber_idx (+10 more)

### Community 36 - "Frontend Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @breezystack/lamejs@1.2.7, @fontsource-variable/plus-jakarta-sans@^5.3.0, lucide-react@^1.7.0, music-metadata@^11.12.3, react@^19.2.0, react-dom@^19.2.0, react-router-dom@^7.13.0 (+11 more)

### Community 37 - "Project & Explorer Schemas"
Cohesion: 0.21
Nodes (8): schema_post_project, GeneroEnum, get_feed_schema, get_schemaPROJETC, projetoSchema, StatusProjetoEnum, update_project_schema, search_project_schema

### Community 38 - "Invite Link Joining"
Cohesion: 0.22
Nodes (9): JaColaboradorError, join_by_link(), LinkEsgotadoError, criar_invite_link_schema, entrar_invite_link_schema, LinkInfo, listar_invite_links_schema, preview_invite_link_schema (+1 more)

### Community 39 - "Colaboration List Schemas"
Cohesion: 0.16
Nodes (5): PapelColaboradorEnum, unfollow_schema, schema_deleteMural, mural_schema, @sinclair/typebox

### Community 40 - "Route Protection & User Context"
Cohesion: 0.21
Nodes (10): react-helmet-async@^3.0.0, ProtectedRoute(), UserDataProvider(), ctx, renderApp(), user, Where(), AllProviders() (+2 more)

### Community 41 - "Email / SMTP"
Cohesion: 0.21
Nodes (5): sendEmail(), transporter, ConviteEmailData, enviarConviteEmail(), montarHtmlConvite()

### Community 42 - "Backend TS Config"
Cohesion: 0.17
Nodes (11): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, skipLibCheck (+3 more)

### Community 43 - "Layer Comments UI"
Cohesion: 0.33
Nodes (7): ComentariosCamada(), ComentariosCamadaProps, formatarTempo(), Comentario, porPosicao(), useComentarios(), Painel()

### Community 44 - "Audio Stretch Types"
Cohesion: 0.17
Nodes (4): *.css, signalsmith-stretch, StretchNode, StretchSchedule

### Community 45 - "Audio Preview Player"
Cohesion: 0.24
Nodes (8): emit(), getAudio(), IDLE, listeners, previewPlayer, PreviewState, stop(), toggle()

### Community 46 - "User Schema Migrations"
Cohesion: 0.25
Nodes (8): "User", User_cpf_key, User_email_key, "Like", Like_projetoId_idx, Like_userId_projetoId_key, Like_userId_idx, User_cpf_hash_key

### Community 47 - "Mural & Hotspot Index Migrations"
Cohesion: 0.20
Nodes (9): "MuralPost", MuralPost_projetoId_idx, MuralPost_autorId_idx, Favorite_userId_createdAt_idx, MuralPost_projetoId_createdAt_id_idx, Notification_userId_lida_createdAt_idx, Projeto_deletedAt_createdAt_id_idx, Projeto_deletedAt_genero_createdAt_id_idx (+1 more)

### Community 48 - "Core Schema Migration"
Cohesion: 0.29
Nodes (8): "Camada", "Projeto", Camada_createdAt_idx, Camada_projetoId_idx, Camada_userId_idx, Projeto_createdAt_idx, Projeto_userId_idx, Projeto_genero_idx

### Community 49 - "Notification Schema Migrations"
Cohesion: 0.29
Nodes (8): "Notification", Notification_createdAt_idx, Notification_userId_idx, Camada_esta_aprovada_idx, Notification_createdAt_idx, Notification_tipo_idx, Notification_userId_lida_idx, Projeto_userId_deletedAt_idx

### Community 50 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 51 - "Collaborator & Invite Migration"
Cohesion: 0.36
Nodes (8): "Colaborador", Colaborador_projetoId_idx, Colaborador_userId_projetoId_key, "Convite", Convite_email_destinatario_idx, Convite_projetoId_idx, Convite_token_convite_key, Colaborador_userId_idx

### Community 52 - "Frontend Build Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:desktop, dev, lint, preview, test, test:coverage (+1 more)

### Community 53 - "Error Boundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 55 - "Desktop Shell (WebView)"
Cohesion: 0.29
Nodes (4): distDir, exeDir, server, webview

### Community 56 - "Favorites Migration"
Cohesion: 0.53
Nodes (5): Convite_remetenteId_idx, "Favorite", Favorite_projetoId_idx, Favorite_userId_idx, Favorite_userId_projetoId_key

### Community 57 - "Layer Tempo & Pitch Schemas"
Cohesion: 0.60
Nodes (3): BpmOriginal, TransposicaoSemitons, update_layer_schema

### Community 58 - "Invite Link Tests"
Cohesion: 0.40
Nodes (5): buildApp(), futuro(), mockPrisma, novoLink(), prismaPlugin

### Community 59 - "Signup Validation Schema"
Cohesion: 0.40
Nodes (4): br_standards_with_zod@^1.1.2, cadastroSchema, CadastroSchema, br_standards_with_zod

### Community 60 - "Desktop Build Scripts"
Cohesion: 0.33
Nodes (5): scripts, clean, clean_m, comp, itl

### Community 61 - "Invite Link Migration"
Cohesion: 0.70
Nodes (4): "ConviteLink", ConviteLink_criadoPorId_idx, ConviteLink_projetoId_idx, ConviteLink_token_key

### Community 62 - "Layer Branch Migration"
Cohesion: 0.70
Nodes (4): "LayerBranch", LayerBranch_camadaId_idx, LayerBranch_camadaId_nome_key, LayerBranch_createdById_idx

### Community 63 - "Web Shell & SEO"
Cohesion: 0.50
Nodes (5): JSON-LD WebApplication Schema, React Mount Point (src/main.tsx), AMOTIF SEO and Social Metadata, Single-Page App HTML Shell, Crawler Policy (robots.txt)

### Community 64 - "Follows Migration"
Cohesion: 0.83
Nodes (3): "Follows", Follows_followerId_idx, Follows_followingId_idx

### Community 65 - "Comment Markers Migration"
Cohesion: 0.83
Nodes (3): "Comentario", Comentario_autorId_idx, Comentario_camadaId_segundos_idx

### Community 66 - "Version API Schemas"
Cohesion: 0.50
Nodes (3): get_version_detail_schema, get_versions_schema, VersionResponse

## Knowledge Gaps
- **22 isolated node(s):** `Paginacao Cursor-Based de Versoes`, `typemarks Benchmark Repository`, `Accent Latão Token`, `CSS File Architecture`, `React Mount Point (src/main.tsx)` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 485 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Branch & Layer Management UI` to `Favorites List & API Client`, `Playback Transport & Waveform UI`, `Frontend Dependencies`, `Project Collaboration Modals`, `App Routes & Pages`, `Modal Hook`, `Route Protection & User Context`, `Frontend Tooling & Lint`, `User Profile & Layout`, `Layer Comments UI`, `Layer Action Menus`, `Audio Editor`, `Feed & Avatars`, `Error Boundary`, `Invites & Feedback UI`, `Project & Layer Creation`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 57 inferred relationships involving `autenticarJWT()` (e.g. with `InfraPlugin()` and `Accept_invite()`) actually correct?**
  _`autenticarJWT()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Paginacao Cursor-Based de Versoes`, `typemarks Benchmark Repository`, `Accent Latão Token` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Permission Model & Roles` be split into smaller, more focused modules?**
  _Cohesion score 0.050156739811912224 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Invites & Feedback UI` to `Branch & Layer Management UI`, `Playback Transport & Waveform UI`, `Audio Codec Encoding`, `App Routes & Pages`, `Frontend Tooling & Lint`, `Audio Editor`, `Project & Layer Creation`, `Favorites List & API Client`, `Route Protection & User Context`, `Layer Comments UI`, `Audio Preview Player`, `Signup Validation Schema`, `Modal Hook`, `Collaboration Validation Schema`, `Instrument Validation Schema`, `Login Validation Schema`, `Password Validation Schema`, `Suggestion Validation Schema`, `Layer Modal Tests`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Plugin_Routes()` (e.g. with `InfraPlugin()` and `cleanup_route()`) actually correct?**
  _`Plugin_Routes()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `Architecture Concept Map` be split into smaller, more focused modules?**
  _Cohesion score 0.05524537173082574 - nodes in this community are weakly interconnected._