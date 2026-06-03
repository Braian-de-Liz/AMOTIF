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
import { list_user_invites } from "./colaboration/list_user_invites.js";

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

import { Toggle_favorite } from "./projetos/togle_favorites.js";
import { Favorites_plugin } from "./projetos/list_favorites.js";

const Plugin_Routes: FastifyPluginAsync = async (Fastify) => {

    Fastify.register(User_register);
    Fastify.register(login_user);
    Fastify.register(Deletar_user);
    Fastify.register(Get_user);
    Fastify.register(Get_user_with_counts);
    Fastify.register(Patch_bio);
    Fastify.register(Patch_Instrumentos);
    Fastify.register(Recuperar_senha);

    Fastify.register(post_project);
    Fastify.register(del_project);
    Fastify.register(Get_projects_user);
    Fastify.register(searth_feed);
    Fastify.register(Get_a_project);
    Fastify.register(Update_project);
    Fastify.register(mural_project);
    Fastify.register(get_mural);

    Fastify.register(convite_project);
    Fastify.register(Accept_invite);
    Fastify.register(colaborators);
    Fastify.register(list_invite);
    Fastify.register(Delete_Colab);
    Fastify.register(Reject_Invite);
    Fastify.register(list_user_invites);

    Fastify.register(delete_layer);
    Fastify.register(create_Layer);
    Fastify.register(patch_layer_status);
    Fastify.register(update_layer);

    Fastify.register(search_project);
    Fastify.register(search_user_by_instruments);

    Fastify.register(follow_user);
    Fastify.register(Unfollow_route);
    Fastify.register(list_followers);
    Fastify.register(Create_like);

    Fastify.register(get_notifications);
    Fastify.register(read_all_notifications);
    Fastify.register(Toggle_favorite);
    Fastify.register(Favorites_plugin);
}


export { Plugin_Routes };
