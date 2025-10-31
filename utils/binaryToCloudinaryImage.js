const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
const convertFileToBase64 = require("./convertFileToBase64");

const binaryToCloudinaryImage = async (file, path) => {
  if (!file) return undefined;
  return await cloudinary.uploader.upload(convertFileToBase64(file), {
    asset_folder: path,
  });
};

module.exports = binaryToCloudinaryImage;
