import { Schema, model } from 'mongoose';

export interface VideoSchema {
    title: string;
    description: string;
    thumbnailURL?: string;
    watched?: boolean;
    youtuberName: string;
}

const myVideoSchema = new Schema<VideoSchema>({
    title: { 
        type: String,
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    thumbnailURL: { 
        type: String, 
        default: "https://via.placeholder.com/1600x900.webp",
        validate: {
            validator: function(url: string) {
                return /^(https?:\/\/.*\.(?:png|jpg|jpeg|webp|gif))$/i.test(url);
            },
            message: "❌ Invalid thumbnail URL format."
        }
    },
    watched: {
        type: Boolean, 
        default: false
    },
    youtuberName: { 
        type: String,
        required: true 
    }
});

const VideoModel = model<VideoSchema>('Video', myVideoSchema);

export default VideoModel;
