const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin

const deleteCloudinaryImage = async (cloudinaryImage) => {
  if (!cloudinaryImage) return undefined;

  await cloudinary.uploader.destroy(cloudinaryImage.public_id);
  try {
    await cloudinary.api.delete_folder(cloudinaryImage.asset_folder);
  } catch (error) {
    console.log(cloudinaryImage.asset_folder + " not empty");
  }
};

module.exports = deleteCloudinaryImage;
