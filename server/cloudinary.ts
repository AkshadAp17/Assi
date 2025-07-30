import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

if (!CLOUDINARY_URL) {
  throw new Error('Please define the CLOUDINARY_URL environment variable');
}

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: CLOUDINARY_URL
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  resource_type: string;
}

export const cloudinaryService = {
  async uploadFile(fileBuffer: Buffer, options: {
    folder?: string;
    filename?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  }): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || 'pixelforge-nexus',
        resource_type: options.resource_type || 'auto',
        use_filename: true,
        unique_filename: true,
      };

      if (options.filename) {
        uploadOptions.public_id = options.filename;
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              bytes: result.bytes,
              format: result.format,
              resource_type: result.resource_type,
            });
          } else {
            reject(new Error('Upload failed - no result'));
          }
        }
      ).end(fileBuffer);
    });
  },

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  },

  getFileUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
    });
  }
};

export default cloudinary;