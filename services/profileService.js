import Profile from '../models/profile.js';
import errorUtil from '../util/errorUtil.js';

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
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Failed to fetch profile for Google id ${googleId}: ${error}`,
            "Internal error attempting to load profile"
        );
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
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error creating profile for Google id ${profileData.googleId}: ${error}`,
            "Internal error attempting to create profile"
        );
    }
}

/**
 * Find a profile by identifier
 * @param {*} profileId Identifier of the profile
 * @returns {object} - profile found for identifier
 */
async function findProfile(profileId) {
    if (!profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Call to findProfile without profile identifier",
            "Internal error attempting to find profile"
        );
    }

    try {
        const profile = await Profile.findById(profileId);
        return profile;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Failed to find profile ${profileId}: ${error}`,
            "Internal error attempting to find profile"
        );
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
        const updatedProfile = await Profile.findOneAndUpdate(
            { _id: profileId },
            profileData,
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            throw errorUtil.error(404, errorUtil.errorCodes.profileNotFound,
                `Unable to update profile ${profileId}`,
                "Unable to fetch profile for update"
            );
        }

        return updatedProfile._doc;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Failed to update profile ${profileId}: ${error}`,
            "Internal error attempting to update profile"
        );
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

const profileService = {
    findProfileByGoogleId,
    createProfile,
    getOrCreateProfile,
    updateProfile,
    findProfile,
    excludePrivateProperties
};

export default profileService;