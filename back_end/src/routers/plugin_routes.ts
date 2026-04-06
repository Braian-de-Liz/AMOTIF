// back_end\src\schemas
import { FastifyPluginAsync } from "fastify";

import { User_register } from "./user/cadastro.js";
import { login_user } from "./user/login.js";
import { Deletar_user } from "./user/delete_user.js";
import { Get_user } from "./user/get_user.js";
import { Get_user_with_counts } from "./user/get_user_with_counts.js";
import { Patch_bio } from "./user/post_bio.js";
import { Patch_Instrumentos } from "./user/instrumentos.js";
import { Recuperar_senha } from './user/forgot_password.js'

import { post_project } from "./projetos/create_project.js";
import { del_project } from "./projetos/delete_project.js";
import { Get_projects_user } from "./projetos/get_projects.js";
import { Get_a_project } from "./projetos/get_project_details.js";
import { Update_project } from "./projetos/update_project.js";
import { searth_feed } from "./projetos/get_feed.js";
import { mural_project } from "./projetos/mural_project.js";
import { get_mural } from "./projetos/get_mural.js";

import { convite_project } from "./colaboration/convite_project.js";
import { colaborators } from "./colaboration/colaboretors.js";
import { Accept_invite } from "./colaboration/accept_invite.js";
import { list_invite } from "./colaboration/list_invite.js";
import { Delete_Colab } from "./colaboration/delete_colab.js";
import { Reject_Invite } from "./colaboration/reject_invite.js";

import { create_Layer } from "./layers/create_layer.js";
import { delete_layer } from "./layers/delete_layer.js";
import { patch_layer_status } from "./layers/autorizar_layer.js";
import { update_layer } from "./layers/update_layers.js";

import { follow_user } from "./follows/follow_user.js";
import { Unfollow_route } from "./follows/unfollow_user.js";
import { list_followers } from "./follows/list_followers.js";
import { Create_like } from "./likes/like_create.js";

import { search_user_by_instruments } from "./search/search_by_instrument.js";
import { search_project } from "./search/search_project.js";

import { get_notifications } from "./notification/get_notifications.js";
import { read_all_notifications } from "./notification/read_all.js";

const Plugin_Routes: FastifyPluginAsync = async (Fastify) => {

    Fastify.register(User_register, { prefix: '/api' });
    Fastify.register(login_user, { prefix: '/api' });
    Fastify.register(Deletar_user, { prefix: '/api' });
    Fastify.register(Get_user, { prefix: '/api' });
    Fastify.register(Get_user_with_counts, { prefix: '/api' });
    Fastify.register(Patch_bio, { prefix: '/api' });
    Fastify.register(Patch_Instrumentos, { prefix: '/api' });
    Fastify.register(Recuperar_senha, {prefix: '/api'});

    Fastify.register(post_project, { prefix: '/api' });
    Fastify.register(del_project, { prefix: '/api' });
    Fastify.register(Get_projects_user, { prefix: '/api' });
    Fastify.register(searth_feed, { prefix: '/api' });
    Fastify.register(Get_a_project, { prefix: '/api' });
    Fastify.register(Update_project, { prefix: '/api' });
    Fastify.register(mural_project, { prefix: '/api' });
    Fastify.register(get_mural, { prefix: '/api' });

    Fastify.register(convite_project, { prefix: '/api' });
    Fastify.register(Accept_invite, { prefix: '/api' });
    Fastify.register(colaborators, { prefix: '/api' });
    Fastify.register(list_invite, { prefix: '/api' });
    Fastify.register(Delete_Colab, { prefix: '/api' });
    Fastify.register(Reject_Invite, { prefix: '/api' });

    Fastify.register(delete_layer, { prefix: '/api' });
    Fastify.register(create_Layer, { prefix: '/api' });
    Fastify.register(patch_layer_status, { prefix: '/api' });
    Fastify.register(update_layer, { prefix: '/api' });

    Fastify.register(search_project, { prefix: '/api' });
    Fastify.register(search_user_by_instruments, { prefix: '/api' });

    Fastify.register(follow_user, { prefix: '/api' });
    Fastify.register(Unfollow_route, { prefix: '/api' });
    Fastify.register(list_followers, { prefix: '/api' });
    Fastify.register(Create_like, { prefix: '/api' });

    Fastify.register(get_notifications, { prefix: '/api' });
    Fastify.register(read_all_notifications, { prefix: '/api' });
}


export { Plugin_Routes };