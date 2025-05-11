import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Event } from "../models/event.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { checkUserRole } from "../middleware/auth.middleware.js";

const createEvent = asyncHandler(async (req, res) => {
  checkUserRole(req);

  const { title, description, date, time, content, location, mediaUrl } = req.body;
  
  // Normalize category to match enum values (Event or Blog)
  let { category } = req.body;
  if (category) {
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    
    if (category !== "Event" && category !== "Blog") {
      throw new ApiError(400, "Category must be either 'Event' or 'Blog'!");
    }
  }
  
  if (
    !title ||
    !description ||
    !category ||
    !date ||
    !time ||
    !content ||
    !location
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  // Handle media from direct URL or file upload
  let mediaPath;
  
  if (mediaUrl) {
    mediaPath = mediaUrl;
  } else if (req.file?.path) {
    const media = await uploadOnCloudinary(req.file.path);
    if (!media.url) throw new ApiError(400, "Error while uploading media file!");
    mediaPath = media.url;
  } else {
    throw new ApiError(400, "Media file or URL is required!");
  }

  const newEvent = await Event.create({
    title,
    description,
    category,
    date,
    time,
    content,
    media: mediaPath,
    location,
  });
  res
    .status(201)
    .json(new ApiResponse(201, newEvent, "Event created successfully!"));
});

const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  if (!events.length) {
    throw new ApiError(404, "No events found!");
  }
  res
    .status(200)
    .json(new ApiResponse(200, events, "All events fetched successfully"));
});

const getEventById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const event = await Event.findOne({
    $or: [
      { _id: mongoose.isValidObjectId(identifier) ? new mongoose.Types.ObjectId(identifier) : null },
      { title: { $regex: new RegExp(identifier, "i") } },
      { slug: identifier },
    ],
  });

  if (!event) {
    throw new ApiError(404, "Event not found!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, event, "Event details fetched successfully"));
});

const updateEvent = asyncHandler(async (req, res) => {
  checkUserRole(req);

  const { id } = req.params;
  const cleanedId = id.trim();

  if (!mongoose.Types.ObjectId.isValid(cleanedId)) {
    throw new ApiError(400, "Invalid event ID format!");
  }

  const event = await Event.findById(cleanedId);
  if (!event) throw new ApiError(404, "Event not found!");

  const { title, description, date, time, content, category, location } = req.body;
  let media = event.media;

  if (req.file?.path) {
    if (event.media) {
      await deleteFromCloudinary(event.media);
    }
    const uploadedMedia = await uploadOnCloudinary(req.file.path);
    media = uploadedMedia.url;
  }

  event.title = title || event.title;
  event.description = description || event.description;
  event.date = date || event.date;
  event.time = time || event.time;
  event.content = content || event.content;
  event.category = category || event.category;
  event.location = location || event.location;
  event.media = media;

  await event.save();
  res
    .status(200)
    .json(new ApiResponse(200, event, "Event updated successfully"));
});

const deleteEvent = asyncHandler(async (req, res) => {
  checkUserRole(req);

  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, "Event not found!");

  if (event.media) {
    try {
      await deleteFromCloudinary(event.media);
    } catch (error) {
      console.error("Failed to delete media from Cloudinary:", error);
    }
  }

  await Event.findByIdAndDelete(id);
  res.status(200).json(new ApiResponse(200, {}, "Event deleted successfully"));
});

export {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
