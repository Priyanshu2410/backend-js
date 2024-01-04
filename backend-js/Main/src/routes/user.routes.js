import { Router } from "express";
import { loginuser, logoutUser, register,refereshAccesstoken } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = new Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "cover", maxCount: 1 }       
    ]),
    register
);

router.route("/login").post(
    loginuser
);

//secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refreshtoken").post(refereshAccesstoken)



export default router;