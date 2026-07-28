import { Type } from '@sinclair/typebox';

const DefaultError = Type.Object({
    status: Type.String(),
    mensagem: Type.String()
});

const Error_schema = {
    400: DefaultError,
    401: DefaultError,
    403: DefaultError,
    404: DefaultError,
    405: DefaultError,
    408: DefaultError,
    409: DefaultError,
    410: DefaultError,
    413: DefaultError,
    415: DefaultError,
    500: DefaultError,
};

export { Error_schema };
