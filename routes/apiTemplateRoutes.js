import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import templateService from "../services/templateService.js";
import logger from "../services/loggingService.js";
import apiUtil from "../util/apiUtil.js";

const router = express.Router();

router.post("/api/v1/template", authMiddleware, async (req, res) => {
    try {
        const newTemplateParameters = req.body;
        const { name, category } = req.body;

        if (!name?.trim()) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, 'Template name was not supplied'));
            return;
        }

        if (!category?.trim()) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, "Template category was not supplied"));
        }

        const newTemplate = await templateService.createTemplate(req.user.profileId, newTemplateParameters);

        res.status(201).json({ template: newTemplate });
    } catch (error) {
        logger.error(`Failure to create template for profile ${req.user.profileId}: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, 'Failed to create a new conversation'))
    }
});

router.put("/api/v1/template/:templateId", authMiddleware, async (req, res) => {
    try {
        const { templateId } = req.params;
        const profileId = req.user.profileId;
        const updates = req.body;

        const data = {
            name: updates.name,
            description: updates.description,
            category: updates.category,
            tone: updates.tone,
            instructions: updates.instructions,
            notes: updates.notes
        };

        if (!data.name || !data.category) {
            res.status(400).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.validation, "Name and categorys fields must have a value"));
            return;
        }

        await templateService.updateTemplate(profileId, templateId, data);

        logger.debug(`Template ${templateId} updated`);

        res.status(204).send();    
    } catch (error) {
        logger.error(`Error when updating templates: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Error when updating templates")); 
    }
})

router.delete("/api/v1/template/:templateId", authMiddleware, async (req, res) => {
    try {
        const {templateId} = req.params;
        const profileId = req.user.profileId;

        await templateService.deleteTemplate(profileId, templateId);

        res.status(204).send();
    } catch (error) {
        logger.error(`Error when deleting templates: ${error}`);
        res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Error when deleting templates")); 
    }
})

router.get("/api/v1/template/:templateId?", authMiddleware, async (req, res) => {
    try {
        const { templateId } = req.params;

        if (templateId) {
            const template = await templateService.findTemplate(req.user.profileId, templateId);

            if (template?.length === 0) {
                logger.debug(`Unable to find template ${templateId} for profile ${req.user.profileId}`);
                res.status(404).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.templateNotFound, "Unable to find template"));
                return;
            }

            res.json({ templates: template});
        } else {
            const templates = await templateService.fetchTemplates(req.user.profileId);

            res.json( { templates });
        }
    } catch (error) {
       logger.error(`Error when fetching templates: ${error}`);
       res.status(500).json(apiUtil.apiErrorResponse(apiUtil.errorCodes.unknownError, "Error when fetching templates"));
    }
  });
  


export default router;