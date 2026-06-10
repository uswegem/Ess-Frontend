import imageCompression from 'browser-image-compression';

export const ImageCompression = async (file) => {
  if (file) {
    try {
      const targetSizeKB = 800; // Set your desired target file size in kilobytes
      const options = {
        maxSizeMB: 2, // Set a maximum initial size for the image
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      let compressedFile = await imageCompression(file, options);
      // Loop until the compressed file meets the target size
      while (compressedFile.size / 1024 > targetSizeKB) {
        options.maxSizeMB -= 0.1;
        compressedFile = await imageCompression(file, options);
      }
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  }
};

