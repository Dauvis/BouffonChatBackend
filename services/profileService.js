import Profile from '../models/profile.js';
import errorUtil from '../util/errorUtil.js';

function redact(profile) {
    // explicitly adding properties that I want visible to frontend
    const publicProfile = {
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        defaultInstructions: profile.defaultInstructions,
        defaultTone: profile.defaultTone,
        defaultModel: profile.defaultModel,
        status: profile.status,
        templateMRU: profile.templateMRU
    }

    return publicProfile;
}

/**
 * Find a profile by Google ID.
 * @param {string} googleId - The Google ID to search for.
 * @returns {Promise<Object|null>} - The found profile or null if not found.
 */
async function findWithGoogleId(googleId) {
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
 * Find profile using email address
 * @param {string} email 
 * @returns profile or null if not found
 */
async function findWithEmail(email) {
    try {
        const profile = await Profile.findOne({ email });
        return profile;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Failed to fetch profile for email ${email}: ${error}`,
            "Internal error attempting to load profile"
        );
    }
}

/**
 * Create a new profile.
 * @param {Object} profileData - The data for the new profile.
 * @returns {Promise<Object>} - The newly created profile.
 */
async function create(profileData) {
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
async function find(profileId) {
    if (!profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Call to find without profile identifier",
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
async function update(profileId, profileData) {
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
 * find or create a profile based on Google profile.
 * @param {Object} userData - The user data from Google.
 * @returns {Promise<Object>} - The existing or new profile.
 */
async function findOrCreate(userData) {
    let profile = await findWithGoogleId(userData.googleId);

    if (!profile) {
        profile = await create({
            googleId: userData.googleId,
            name: userData.name,
            email: userData.email,
            defaultInstructions: userData.defaultInstructions || '',
            defaultTone: userData.defaultTone || '',
        });
    }
    return profile;
}

/**
 * Find or link a profile based on Google profile
 * @param {object} userData 
 * @returns profile or null if not found
 */
async function findOrLink(userData) {
    let profile = await findWithGoogleId(userData.googleId);

    if (!profile) {
        profile = await findWithEmail(userData.email);

        // link the profile
        if (profile) {
            profile.name = userData.name;
            profile.googleId = userData.googleId;

            await Profile.findOneAndUpdate(
                { _id: profile._id },
                profile,
                { new: true, runValidators: true });
        }
    }

    return profile;
}

/**
 * Adds a template reference to the profile's MRU
 * @param {string} profileId 
 * @param {object} template 
 * @returns new MRU
 */
async function addTemplate(profileId, template) {
    if (!template || !template.id || !template.name) {
        return;
    }

    const current = (await Profile.findOne({ _id: profileId}, { templateMRU: 1 })) || { templateMRU: [] };
    const filtered = current.templateMRU.filter(t => t.id !== template.id);
    const updated = ([{ id: template.id, name: template.name }, ...filtered]).slice(0, 10);
    
    const updatedProfile = await Profile.findOneAndUpdate(
        { _id: profileId },
        { templateMRU: updated},
        { new: true, runValidators: true }
    );

    if (!updatedProfile) {
        throw errorUtil.error(404, errorUtil.errorCodes.profileNotFound,
            `Unable to update profile ${profileId}`,
            "Unable to fetch profile for update"
        );
    }

    return updated;
}

const profileService = {
    findWithGoogleId,
    create,
    findOrCreate,
    findOrLink,
    update,
    find,
    redact,
    addTemplate
};

export default profileService;