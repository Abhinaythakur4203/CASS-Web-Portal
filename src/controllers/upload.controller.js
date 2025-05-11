import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { checkUserRole } from "../middleware/auth.middleware.js";

const uploadImage = asyncHandler(async (req, res) => {
  // Check if user has appropriate role
  checkUserRole(req);
  
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const localFilePath = req.file.path;
  
  const uploadedImage = await uploadOnCloudinary(localFilePath);
  
  if (!uploadedImage || !uploadedImage.url) {
    throw new ApiError(500, "Error uploading image to Cloudinary");
  }

  return res.status(200).json(
    new ApiResponse(
      200, 
      { url: uploadedImage.url }, 
      "Image uploaded successfully"
    )
  );
});

export { uploadImage };
