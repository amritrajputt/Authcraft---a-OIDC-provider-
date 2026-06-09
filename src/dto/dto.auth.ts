import Joi from "joi";

interface IRegister {
    email: string;
    name: string;
    password: string;
}

interface ILogin {
    email: string;
    password: string;
    client_id?: string;
}

const registerSchema: Joi.ObjectSchema<IRegister> = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    password: Joi.string().min(6).required()
})

const loginSchema: Joi.ObjectSchema<ILogin> = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    client_id: Joi.string().optional()
})

export {
    registerSchema,
    loginSchema
}