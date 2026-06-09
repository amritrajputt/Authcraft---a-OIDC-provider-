import { Router } from "express"
import { clientController } from "../controller/clients.controller.js";

const clientRouter = Router()

clientRouter.post('/register', clientController);

export default clientRouter