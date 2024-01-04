import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import {uploadonCloudinary} from '../utils/cloudnary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccesstokonAndRefreshtoken = async(userId) => {
  try{
    const user =await User.findById(userId);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({validateBeforeSave:false});

    return {accesstoken,refreshtoken};
  }
  catch(err){
    throw new ApiError(500,"Something went wrong while generating tokens");
  }
}

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

const loginuser = asyncHandler(async (req, res, next) => {
  // req body -> data
  // username or email
  // find user
  // check password
  // generate access and referesh token
  //send cookie

  const { username, password,email } = req.body;

  if(!username && !email){
    throw new ApiError(400,"Username or email is required");
  }

  const user = await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"User not found");
  }

  const ispasswordvalid = await user.isPasswordCorrect(password);

  if(!ispasswordvalid){
    throw new ApiError(400,"Invalid password");
  }

  const {accesstoken,refreshtoken} = await generateAccesstokonAndRefreshtoken(user._id);

  const loginuser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly:true,
    secure : true,  
  }

  return res.status(200)
  .cookie("refreshtoken",refreshtoken,options)
  .cookie("accesstoken",accesstoken,options)
  .json(new ApiResponse(200,{
    user:loginuser,
    accesstoken,
    refreshtoken
  },"User logged in successfully"));
});

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined
          }
      },
      {
          new: true
      }
  )

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refereshAccesstoken = asyncHandler(async(req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token missing");
    }
  
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
        throw new ApiError(404, "User not found");
    }
  
    if (user?.refreshToken !== incomingRefreshToken) {
        throw new ApiError(400, "Invalid refresh token");
    }
    const options = {
      httpOnly:true,
      secure : true,  
    
    }
  
    const {accesstoken, newrefreshtoken} = await generateAccesstokonAndRefreshtoken(user._id);
  
    return res
    .status(200)
    .cookie("refreshtoken",newrefreshtoken,options)
    .cookie("accesstoken",accesstoken,options)
    .json(
        new ApiResponse(200, {
            accesstoken,
            newrefreshtoken
        }, "Access token refreshed")
    
    )
  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong");
  }
});

const changeCurrentpassword = asyncHandler(async(req, res) => {
  const {currentpassword,newpassword} = req.body;

  if(!currentpassword || !newpassword){
    throw new ApiError(400,"Current password and new password are required");
  }

  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(404,"User not found");
  }

  const ispasswordvalid = await user.isPasswordCorrect(currentpassword);

  if(!ispasswordvalid){
    throw new ApiError(400,"Invalid password");
  }

  user.password = newpassword;
  await user.save({validateBeforeSave:false});

  return res.status(200).json(new ApiResponse(200,{}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200,req.user, "User found"));
});

const updateAccountDet = asyncHandler(async(req, res) => {
  const {email,fullname} = req.body;
  if(!email || !fullname){
    throw new ApiError(400,"Email and fullname are required");
  }
 const user = User.findByIdAndUpdate(req.user._id,{
    $set:{
      email,
      fullname
    }
  },{new:true}).select("-password -refreshToken");

  return res
  .status(200)
  .json(new ApiResponse(200,user, "User updated successfully")); 
});

const updateUseravatar = asyncHandler(async(req, res) => {
  const avatarlocalpath = req.file?.path; 

  if(!avatarlocalpath){
    throw new ApiError(400,"Avatar is required");
  }

  const avatar =  await uploadonCloudinary(avatarlocalpath);

  if(!avatar.url){
    throw new ApiError(400,"Something went wrong while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(req.user._id,{
    $set:{
      avatar:avatar.url
    }
  },{new:true}).select("-password -refreshToken");

  return res
  .status(200)
  .json(new ApiResponse(200,user, "Avatar updated successfully")); 

});

const updatusercoverimg = asyncHandler(async(req, res) => {
  const coverlocalpath = req.file?.path; 

  if(!coverlocalpath){
    throw new ApiError(400,"cover is required");
  }

  const cover =  await uploadonCloudinary(coverlocalpath);

  if(!cover.url){
    throw new ApiError(400,"Something went wrong while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(req.user._id,{
    $set:{
      cover:cover.url
    }
  },{new:true}).select("-password -refreshToken");

  return res
  .status(200)
  .json(new ApiResponse(200,user, "cover updated successfully")); 

});

export {register,loginuser,logoutUser,refereshAccesstoken,changeCurrentpassword,getCurrentUser,updateAccountDet,updateUseravatar,updatusercoverimg}