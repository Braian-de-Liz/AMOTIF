import { z } from 'zod';

const DefaultError = z.object({
    status: z.string(),
    mensagem: z.string()
});

const Error_schema = {
    400: DefaultError, 
    401: DefaultError, 
    403: DefaultError, 
    404: DefaultError, 
    405: DefaultError, 
    408: DefaultError, 
    409: DefaultError, 
    413: DefaultError, 
    415: DefaultError,
    500: DefaultError, 
};

export { Error_schema };