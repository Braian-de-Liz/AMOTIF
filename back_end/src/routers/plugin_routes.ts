// back_end\src\schemas
import { FastifyPluginAsync } from "fastify";

import { User_register } from "./user/cadastro.js";
import { login_user } from "./user/login.js";
import { Deletar_user } from "./user/delete_user.js";
import { Get_user } from "./user/get_user.js";
import { Patch_bio } from "./user/post_bio.js";
import { Patch_Instrumentos } from "./user/instrumentos.js";

import { post_project } from "./projetos/create_project.js";
import { del_project } from "./projetos/delete_project.js";
import { Get_projects_user } from "./projetos/get_projects.js";
import { Get_a_project } from "./projetos/get_project_details.js";
import { searth_feed } from "./projetos/get_feed.js";

import { convite_project } from "./colaboration/convite_project.js";
import { colaborators } from "./colaboration/colaboretors.js";
import { Accept_invite } from "./colaboration/accept_invite.js";
import { list_invite } from "./colaboration/list_invite.js";

import { create_Layer } from "./layers/create_layer.js";
import { delete_layer } from "./layers/delete_layer.js";
import { patch_layer_status } from "./layers/autorizar_layer.js";

import { follow_user } from "./follows/follow_user.js";
import { Unfollow_route } from "./follows/unfollow_user.js";

const Plugin_Routes: FastifyPluginAsync = async (Fastify) => {

    Fastify.register(User_register, { prefix: '/api' });
    Fastify.register(login_user, { prefix: '/api' });
    Fastify.register(Deletar_user, { prefix: '/api' });
    Fastify.register(Get_user, { prefix: '/api' });
    Fastify.register(Patch_bio, { prefix: '/api' });
    Fastify.register(Patch_Instrumentos, { prefix: '/api' });

    Fastify.register(post_project, { prefix: '/api' });
    Fastify.register(del_project, { prefix: '/api' });
    Fastify.register(Get_projects_user, { prefix: '/api' });
    Fastify.register(searth_feed, { prefix: '/api' });
    Fastify.register(Get_a_project, { prefix: '/api' });

    Fastify.register(convite_project, { prefix: '/api' });
    Fastify.register(Accept_invite, { prefix: '/api' });
    Fastify.register(colaborators, { prefix: '/api' });
    Fastify.register(list_invite, { prefix: '/api' });
    
    Fastify.register(delete_layer, { prefix: '/api' });
    Fastify.register(create_Layer, { prefix: '/api' });
    Fastify.register(patch_layer_status, { prefix: '/api' });
    
    Fastify.register(follow_user, { prefix: '/api' });
    Fastify.register(Unfollow_route, { prefix: '/api' });
}


export { Plugin_Routes };