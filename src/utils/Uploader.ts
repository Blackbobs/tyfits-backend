import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = async (filepath: string) => {
try {
    const result = await cloudinary.uploader.upload(filepath)

    return {
        url: result.secure_url,
        publicId: result.public_id,
    }
} catch (error) {
    console.log('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
}
}