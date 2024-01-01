import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadonCloudinary = async (localFilepath) => {
    try{
        if(!localFilepath){
            throw new Error("Please provide a local file path");
            return null;
        }

        const result = await cloudinary.uploader.upload(localFilepath,{resource_type:"auto"} );
        fs.unlinkSync(localFilepath);
        return result;
    }catch(error){
        // fs.unlinkSync(localFilepath);
        console.log(error);
    }
};

export {uploadonCloudinary};