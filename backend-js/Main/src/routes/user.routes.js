import { Router } from "express";
import { loginuser, logoutUser, register,refereshAccesstoken, changeCurrentpassword, getCurrentUser, updateAccountDet, updateUseravatar, updatusercoverimg, getUserChannelProfile, getwatchHistory } from "../controllers/user.controllers.js";
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
router.route("/change-pass").post(verifyJWT,changeCurrentpassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-acc").patch(verifyJWT,updateAccountDet)
router.route("/avater").patch(verifyJWT,upload.single("avatar"),updateUseravatar)
router.route("/cover").patch(verifyJWT,upload.single("cover"),updatusercoverimg)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getwatchHistory)




export default router;