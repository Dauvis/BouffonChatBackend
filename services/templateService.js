import Template from "../models/template.js"
import logger from "../services/loggingService.js";

/**
 * Create a new template
 * @param {string} profileId - owner of template
 * @param {object} templateParameters - parameters for template
 * @returns {object} - newly created template
 */
async function createTemplate(profileId, templateParameters) {
    try {
        // doing it this way to mitigate shenanigans
        const newTemplateData = {
            owner: profileId,
            name: templateParameters.name,
            description: templateParameters.description,
            category: templateParameters.category,
            tone: templateParameters.tone,
            instructions: templateParameters.instructions,
            notes: templateParameters.notes,
        };

        const templateDoc = new Template(newTemplateData);
        return await templateDoc.save();
    } catch (error) {
        logger.error(`Error creating template for ${profileId}: ${templateParameters.name}, ${templateParameters.category}`);
        throw new Error('Error creating new template');
    }
}

async function fetchTemplates(profileId) {
    if (!profileId) {
        throw Error("Attempt to fetch templates without profileId");
    }

    try {
        const templates = Template.find({ owner: profileId }).sort({ category: 1, name: 1});
        return templates;
    } catch (error) {
        logger.error(`Error fetching templates using profile ${profileId}: ${error}`);
        throw new Error(`Error fetching templates using profile: ${error.message}`);    
    }
}

async function findTemplate(profileId, templateId) {
    if (!profileId || !templateId) {
        throw Error("Attempt to find template without profileId or templateId");
    }

    try {
        const template = Template.find({ owner: profileId, _id: templateId });
        return template;
    } catch (error) {
        logger.error(`Error find a template for profile ${profileId} using id ${templateId}: ${error}`);
        throw new Error(`Error finding a template: ${error.message}`);    
    }
}

async function updateTemplate(profileId, templateId, templateData) {
    if (!profileId || !templateId) {
        throw Error("Attempt to update template without profileId or templateId");
    }

    try {
        const updated = await Template.findOneAndUpdate(
            { owner: profileId, _id: templateId },
            templateData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            throw new Error(`Template ${templateId} for profile ${profileId} not found`);
        }

        return updated._doc;
    } catch (error) {
        logger.error(`Error updating a template for profile ${profileId} using id ${templateId}: ${error}`);
        throw new Error(`Error updating a template: ${error.message}`);    
    }
}

async function deleteTemplate(profileId, templateId) {
    if (!profileId || !templateId) {
        throw Error("Attempt to delete template without profileId or templateId");
    }

    try {
        const deleted = await Template.findOneAndDelete(
            { owner: profileId, _id: templateId },
            { runValidators: true }
        );

        return deleted._doc;
    } catch (error) {
        logger.error(`Error deleting a template for profile ${profileId} using id ${templateId}: ${error}`);
        throw new Error(`Error deleting a template: ${error.message}`);    
    }
}

const templateService = { createTemplate, fetchTemplates, findTemplate, updateTemplate, deleteTemplate };

export default templateService;