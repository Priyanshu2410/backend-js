import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import {uploadonCloudinary} from '../utils/cloudnary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const register = asyncHandler(async (req, res, next) => {
    // get details
    //validation
    //check if user already exists : username, email
    //check for image ,check for avatar
    //upload them to cloudinary
    // create user object - creat entry in db
    //remove password and refresh tokens from user object
    //check for user creation
    // return response

    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field)=>field?.trim() === "")) {
        return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
    }

  const existedUser = await User.findOne({
         $or:[
              {
                username
              },
              {
                email
              }
         ]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

     const avatarlocalpath = req.files?.avatar[0]?.path; 
    //  const coverlocalpath = req.files?.cover[0]?.path;
    let coverlocalpath;
    if(req.files && Array.isArray(req.files.cover) && req.files.cover.length > 0){
        coverlocalpath = req.files?.cover[0]?.path;
    }

     if(!avatarlocalpath){
        throw new ApiError(400,"Avatar is required");
     }

   const avatar =  await uploadonCloudinary(avatarlocalpath);
     const cover =  await uploadonCloudinary(coverlocalpath);

     if(!avatar){
        throw new ApiError(400,"Something went wrong while uploading avatar");
     }

    const user = await User.create({
         fullname,
         email,
         username:username.toLowerCase(),
         password,
         avatar:avatar.url,
         cover:cover?.url || null ,
     })
    const creatUser = await User.findById(user._id).select("-password -refreshToken");

     if(!creatUser){
          throw new ApiError(500,"Something went wrong while creating user");
     }

     return res.status(201).json(new ApiResponse(201,creatUser,"User created successfully"));
});

export {register}