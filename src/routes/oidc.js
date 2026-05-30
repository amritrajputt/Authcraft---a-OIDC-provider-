import { Router } from "express"
import { showLoginPage, handleLoginSubmit } from "../controller/oidc.js";

const oidcRouter = Router()

oidcRouter.get("/authorize", showLoginPage);
oidcRouter.post("/authorize", handleLoginSubmit);

export default oidcRouter