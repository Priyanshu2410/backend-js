import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true,
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet",
        required: true,
    },

    
},{timestamps: true});

export const Like = mongoose.model("Like", likeSchema);