import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const recupere_senha_schema = {
	preHandler: [],
	schema:{
		tags: ['usuario'],
		body: z.object({
			senha: z.string().min(8),
			nova_senha: z.string().min(8)
		}),
		response: {
			200: z.object({
				status: z.string(),
				mensagem: z.string()
			}),
			...Error_schema
		}
	}
}

export { recupere_senha_schema };