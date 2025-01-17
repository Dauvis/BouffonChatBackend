import Template from "../models/template.js"
import errorUtil from "../util/errorUtil.js";

/**
 * Create a new template
 * @param {string} profileId - owner of template
 * @param {object} templateParameters - parameters for template
 * @returns {object} - newly created template
 */
async function createTemplate(profileId, templateParameters) {
    if (!profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError, 
            "Attempted to call createTemplate without a profile identifier",
            "Internal error attempting to create template"
        );
    }

    try {
        // doing it this way to mitigate shenanigans
        const newTemplateData = {
            owner: profileId,
            name: templateParameters.name,
            description: templateParameters.description,
            category: templateParameters.category,
            tone: templateParameters.tone,
            model: templateParameters.model,
            instructions: templateParameters.instructions,
            notes: templateParameters.notes,
        };

        const templateDoc = new Template(newTemplateData);
        return await templateDoc.save();
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError, 
            `Error creating template for ${profileId}: ${error}`,
            "Internal error attempting to create template"
        );
    }
}

/**
 * Fetch full list of templates for profile
 * @param {string} profileId 
 * @returns array of templates
 */
async function fetchTemplates(profileId) {
    if (!profileId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call fetchTemplates without a profile identifier",
            "Internal error attempting to fetch templates"
        );
    }

    try {
        const templates = Template.find({ owner: profileId }).sort({ category: 1, name: 1});
        return templates;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error while fetching templates for profile ${profileId}: ${error}`,
            "Internal error attempting to fetch templates"
        );
    }
}

/**
 * Find template with profile and template identifier
 * @param {string} profileId 
 * @param {string} templateId 
 * @returns template or null if not found
 */
async function findTemplate(profileId, templateId) {
    if (!profileId || !templateId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call findTemplate with profile or template identifier",
            "Internal error attempting to fetch template"
        );
    }

    try {
        const template = Template.find({ owner: profileId, _id: templateId });
        return template;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Error attempting to fetch template ${templateId} for ${profileId}: ${error}`,
            "Internal error attempting to fetch template"
        );
    }
}

/**
 * Update template for profile and template
 * @param {string} profileId 
 * @param {string} templateId 
 * @param {object} templateData 
 * @returns updated template data or null
 */
async function updateTemplate(profileId, templateId, templateData) {
    if (!profileId || !templateId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError,
            "Attempt to call updateTemplate without template or profile identifiers",
            "Internal error attempting to update template"
        );
    }

    try {
        const updated = await Template.findOneAndUpdate(
            { owner: profileId, _id: templateId },
            templateData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            throw errorUtil.error(404, errorUtil.errorCodes.templateNotFound,
                `Unable to update template ${templateId} for ${profileId}`,
                "Unable to find template to update"
            );
        }

        return updated._doc;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError, 
            `Error updating template ${templateId} for ${profileId}: ${error}`,
            "Internal error attempting to update template"
        );
    }
}

async function deleteTemplate(profileId, templateId) {
    if (!profileId || !templateId) {
        throw errorUtil.error(500, errorUtil.errorCodes.internalError, 
            "Attempt to call deleteTemplate without profile or template identifiers",
            "Internal error attempting to delete template"
        );
    }

    try {
        const deleted = await Template.findOneAndDelete(
            { owner: profileId, _id: templateId },
            { runValidators: true }
        );

        return deleted._doc;
    } catch (error) {
        throw errorUtil.error(500, errorUtil.errorCodes.dataStoreError,
            `Failed to delete template ${templateId} for ${profileId}: ${error}`,
            "Internal error attempting to delete template"
        );
    }
}

const templateService = { createTemplate, fetchTemplates, findTemplate, updateTemplate, deleteTemplate };

export default templateService;