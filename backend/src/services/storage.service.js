const ImageKit = require("imagekit");

let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
} else {
    console.warn('ImageKit env vars missing; uploads are disabled. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT in .env');
}

async function uploadFile(file, fileName) {
    if (!imagekit) {
        throw new Error('ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment.');
    }

    const result = await imagekit.upload({
        file: file,
        fileName: fileName,
    });

    return result;
}

module.exports = {
    uploadFile
};