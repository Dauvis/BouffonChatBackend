import Profile from '../models/profile.js';
import mongoose from 'mongoose';
import logger from "../services/loggingService.js";

function excludePrivateProperties(fullProfile) {
  const { googleId: _, refreshToken: __, ...publicProfile } = fullProfile;
  return publicProfile;
}

/**
 * Find a profile by Google ID.
 * @param {string} googleId - The Google ID to search for.
 * @returns {Promise<Object|null>} - The found profile or null if not found.
 */
async function findProfileByGoogleId(googleId) {
  try {
    const profile = await Profile.findOne({ googleId });
    return profile;
  } catch (error) {
    logger.error(`Error fetching profile using Google Id ${googleId}: ${error}`);
    throw new Error('Error fetching profile using Google Id');
  }
}

/**
 * Create a new profile.
 * @param {Object} profileData - The data for the new profile.
 * @returns {Promise<Object>} - The newly created profile.
 */
async function createProfile(profileData) {
  try {
    const profile = new Profile(profileData);
    return (await profile.save())._doc;
  } catch (error) {
    logger.error(`Error creating profile for Google Id ${profileData.googleId}: ${error}`);
    throw new Error('Error creating profile for Google Id');
  }
}

/**
 * Find a profile by identifier
 * @param {*} profileId Identifier of the profile
 * @returns {Promise<Object>} - profile found for identifier
 */
async function findProfile(profileId) {
  if (!profileId) {
    throw new Error("Call to findProfile() without profileId");
  }

  try {
    const profile = await Profile.findById(profileId);
    return profile;
  } catch (error) {
    logger.error(`Error fetching profile using Id ${profileId}: ${error}`);
    throw new Error(`Error fetching profile using id: ${error.message}`);
  }
}

/**
 * Update a profile.
 * @param {string} profileId - string identifier for profile
 * @param {Object} profileData - The data for the new profile.
 * @returns {Promise<Object>} - The newly created profile.
 */
async function updateProfile(profileId, profileData) {
  try {
    const identifier = new mongoose.Types.ObjectId(profileId);
    const updatedProfile = await Profile.findOneAndUpdate(
      { _id: identifier },
      profileData,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      throw new Error(`Profile for ${identifier} not found`);
    }

    return updatedProfile._doc;
  } catch (error) {
    logger.error(`Error updating profile ${profileId}: ${error}`);
    throw new Error('Error updating profile');
  }
}

/**
 * Get or create a profile based on Google ID.
 * @param {Object} userData - The user data from Google.
 * @returns {Promise<Object>} - The existing or new profile.
 */
async function getOrCreateProfile(userData) {
  let profile = await findProfileByGoogleId(userData.googleId);
  if (!profile) {
    profile = await createProfile({
      googleId: userData.googleId,
      name: userData.name,
      email: userData.email,
      defaultInstructions: userData.defaultInstructions || '',
      defaultTone: userData.defaultTone || '',
    });
  }
  return profile;
}

const profileService =  {
  findProfileByGoogleId,
  createProfile,
  getOrCreateProfile,
  updateProfile,
  findProfile,
  excludePrivateProperties
};

export default profileService;