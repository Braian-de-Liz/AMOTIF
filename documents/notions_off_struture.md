Directory structure:
└── braian-de-liz-amotif/
    ├── README.mD
    ├── back_end/
    │   ├── package.json
    │   ├── prisma.config.ts
    │   ├── tsconfig.json
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   │       ├── migration_lock.toml
    │   │       ├── 20260214002410/
    │   │       │   └── migration.sql
    │   │       ├── 20260223020417_initial_schema_v2/
    │   │       │   └── migration.sql
    │   │       ├── 20260321164610_colaboradores_e_convites/
    │   │       │   └── migration.sql
    │   │       ├── 20260321184429_follows/
    │   │       │   └── migration.sql
    │   │       ├── 20260325172302_add_notifications/
    │   │       │   └── migration.sql
    │   │       ├── 20260327133157_notifications_with_relationations/
    │   │       │   └── migration.sql
    │   │       ├── 20260327161215_add_genero_to_schema/
    │   │       │   └── migration.sql
    │   │       ├── 20260329181826_likes_add/
    │   │       │   └── migration.sql
    │   │       ├── 20260402213234_mural/
    │   │       │   └── migration.sql
    │   │       ├── 20260406200456_index_ajustados/
    │   │       │   └── migration.sql
    │   │       ├── 20260513221407_favorites/
    │   │       │   └── migration.sql
    │   │       └── 20260518191302_add_audio_metadata/
    │   │           └── migration.sql
    │   ├── src/
    │   │   ├── server.ts
    │   │   ├── hooks/
    │   │   │   ├── JWT_verific.ts
    │   │   │   ├── verificar_dono_layer.ts
    │   │   │   ├── verificar_dono_projeto.ts
    │   │   │   └── verificar_permissao.ts
    │   │   ├── lib/
    │   │   │   ├── global_Error.ts
    │   │   │   └── prisma.ts
    │   │   ├── routers/
    │   │   │   ├── plugin_routes.ts
    │   │   │   ├── colaboration/
    │   │   │   │   ├── accept_invite.ts
    │   │   │   │   ├── colaboretors.ts
    │   │   │   │   ├── convite_project.ts
    │   │   │   │   ├── delete_colab.ts
    │   │   │   │   ├── list_invite.ts
    │   │   │   │   ├── list_user_invites.ts
    │   │   │   │   └── reject_invite.ts
    │   │   │   ├── follows/
    │   │   │   │   ├── follow_user.ts
    │   │   │   │   ├── list_followers.ts
    │   │   │   │   └── unfollow_user.ts
    │   │   │   ├── health/
    │   │   │   │   └── health.ts
    │   │   │   ├── layers/
    │   │   │   │   ├── autorizar_layer.ts
    │   │   │   │   ├── create_layer.ts
    │   │   │   │   ├── delete_layer.ts
    │   │   │   │   └── update_layers.ts
    │   │   │   ├── likes/
    │   │   │   │   └── like_create.ts
    │   │   │   ├── notification/
    │   │   │   │   ├── get_notifications.ts
    │   │   │   │   └── read_all.ts
    │   │   │   ├── projetos/
    │   │   │   │   ├── create_project.ts
    │   │   │   │   ├── delete_project.ts
    │   │   │   │   ├── get_feed.ts
    │   │   │   │   ├── get_mural.ts
    │   │   │   │   ├── get_project_details.ts
    │   │   │   │   ├── get_projects.ts
    │   │   │   │   ├── list_favorites.ts
    │   │   │   │   ├── mural_project.ts
    │   │   │   │   ├── togle_favorites.ts
    │   │   │   │   └── update_project.ts
    │   │   │   ├── search/
    │   │   │   │   ├── search_all.ts
    │   │   │   │   ├── search_by_instrument.ts
    │   │   │   │   └── search_project.ts
    │   │   │   └── user/
    │   │   │       ├── cadastro.ts
    │   │   │       ├── delete_user.ts
    │   │   │       ├── forgot_password.ts
    │   │   │       ├── get_user.ts
    │   │   │       ├── get_user_with_counts.ts
    │   │   │       ├── instrumentos.ts
    │   │   │       ├── login.ts
    │   │   │       └── post_bio.ts
    │   │   └── schemas/
    │   │       ├── colaboration/
    │   │       │   ├── accept_invite.schema.ts
    │   │       │   ├── colaboretors_schema.ts
    │   │       │   ├── delete_colab_schema.ts
    │   │       │   ├── list_invite.ts
    │   │       │   ├── list_user_invites_schema.ts
    │   │       │   ├── reject_invite_schema.ts
    │   │       │   └── schema_convite.ts
    │   │       ├── error/
    │   │       │   └── erro_schema.ts
    │   │       ├── follows/
    │   │       │   ├── follow_user_schema.ts
    │   │       │   ├── list_followers.schema.ts
    │   │       │   └── unfollow_user_schema.ts
    │   │       ├── layers/
    │   │       │   ├── auth_layer.ts
    │   │       │   ├── create_schema_lyr.ts
    │   │       │   ├── delete_a_layer.ts
    │   │       │   └── update_layer.schema.ts
    │   │       ├── likes/
    │   │       │   └── like.schema.ts
    │   │       ├── notification/
    │   │       │   ├── get_a_notificarion.schema.ts
    │   │       │   └── read_all_notifications_schema.ts
    │   │       ├── projetos/
    │   │       │   ├── creat_project_schema.ts
    │   │       │   ├── del_project.schema.ts
    │   │       │   ├── favorites.schema.ts
    │   │       │   ├── get_explorer.ts
    │   │       │   ├── get_mural.schema.ts
    │   │       │   ├── get_one_project.ts
    │   │       │   ├── get_schemaPROJETC.ts
    │   │       │   ├── mural.schema.ts
    │   │       │   ├── schema_del_projec.ts
    │   │       │   └── update_project_schema.ts
    │   │       ├── search/
    │   │       │   ├── search_by_instrument_schema.ts
    │   │       │   └── search_project.schema.ts
    │   │       └── user_schema/
    │   │           ├── bio_schema.ts
    │   │           ├── cadastroUSer_sche.ts
    │   │           ├── delete_user_schema.ts
    │   │           ├── forgot_password.schema.ts
    │   │           ├── get_user_schema.ts
    │   │           ├── get_user_with_counts_schema.ts
    │   │           ├── instrumentos_schema.ts
    │   │           └── schema_login.ts
    │   └── tests/
    │       ├── colaboration.test.ts
    │       ├── follows.test.ts
    │       ├── health.test.ts
    │       ├── layers.test.ts
    │       ├── likes.test.ts
    │       ├── notifications.test.ts
    │       ├── projetos.test.ts
    │       ├── search.test.ts
    │       └── user.test.ts
    ├── documents/
    │   ├── Architecture.md
    │   ├── organization.md
    │   └── typebox-fastify-bun.md
    └── front_end/
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── pnpm-workspace.yaml
        ├── vite.config.js
        ├── public/
        │   └── assets/
        │       ├── images.jfif
        │       └── top secret.jfif
        └── src/
            ├── App.jsx
            ├── main.jsx
            ├── components/
            │   ├── AppLayout.jsx
            │   ├── FavoritesList.jsx
            │   ├── feed.jsx
            │   ├── FloatingNotifications.jsx
            │   ├── FollowersComponents.jsx
            │   ├── init_project.jsx
            │   ├── MyLoadProjects.jsx
            │   ├── nav.jsx
            │   ├── project_Card.jsx
            │   ├── ProtectedRoute.jsx
            │   ├── pull_notifications.jsx
            │   ├── SearchBar.jsx
            │   ├── StudioColaboradores.jsx
            │   ├── StudioMural.jsx
            │   ├── UserCard.jsx
            │   └── WaveformTrack.jsx
            ├── pages/
            │   ├── cadastro.jsx
            │   ├── favoritesPage.jsx
            │   ├── home.jsx
            │   ├── invitesPage.jsx
            │   ├── login.jsx
            │   ├── studio.jsx
            │   ├── user.jsx
            │   └── userProfile.jsx
            ├── styles/
            │   ├── Cadastro.css
            │   ├── Form.css
            │   ├── Global.css
            │   ├── Home.css
            │   ├── Login.css
            │   ├── Navbar.css
            │   ├── Shared.css
            │   ├── Studio.css
            │   └── User.css
            └── utility/
                ├── url_apis.js
                ├── validar_cpf.js
                └── validar_email.js
