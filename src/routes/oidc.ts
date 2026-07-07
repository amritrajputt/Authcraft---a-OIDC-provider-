import { Router } from "express"
import { authorizeController, tokenController, userInfoController, tokenIntrospectionController } from "../controller/oidc.controller.js"

const oidcRouter = Router()

oidcRouter.get("/authorize", authorizeController);
oidcRouter.post("/token", tokenController);
oidcRouter.get("/userinfo", userInfoController);
oidcRouter.post("/introspect", tokenIntrospectionController);

export default oidcRouter