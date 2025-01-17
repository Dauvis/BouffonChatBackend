import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import templateService from "../services/templateService.js";
import errorUtil from "../util/errorUtil.js";

const router = express.Router();

router.post("/api/v1/template", authMiddleware, async (req, res) => {
    try {
        const newTemplateParameters = req.body;
        const { name, category } = req.body;

        if (!name?.trim()) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Template requires a name");
            return;
        }

        if (!category?.trim()) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Template requires a category");
            return;
        }

        const newTemplate = await templateService.createTemplate(req.user.profileId, newTemplateParameters);

        res.status(201).json({ template: newTemplate });
    } catch (error) {
        errorUtil.handleRouterError(res, error, "POST /api/v1/template");
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
            model: updates.model,
            instructions: updates.instructions,
            notes: updates.notes
        };

        if (!data.name || !data.category) {
            errorUtil.response(res, 400, errorUtil.errorCodes.validation, "Template requires name and category");
            return;
        }

        await templateService.updateTemplate(profileId, templateId, data);

        res.status(204).send();
    } catch (error) {
        errorUtil.handleRouterError(res, error, "PUT /api/v1/template/{id}");
    }
})

router.delete("/api/v1/template/:templateId", authMiddleware, async (req, res) => {
    try {
        const { templateId } = req.params;
        const profileId = req.user.profileId;

        await templateService.deleteTemplate(profileId, templateId);

        res.status(204).send();
    } catch (error) {
        errorUtil.handleRouterError(res, error, "DELETE /api/v1/template/{id}");
    }
})

router.get("/api/v1/template/:templateId?", authMiddleware, async (req, res) => {
    try {
        const { templateId } = req.params;

        if (templateId) {
            const template = await templateService.findTemplate(req.user.profileId, templateId);

            if (template?.length === 0) {
                errorUtil.response(res, 404, errorUtil.errorCodes.templateNotFound, "Specified template was not found");
                return;
            }

            res.json({ templates: template });
        } else {
            const templates = await templateService.fetchTemplates(req.user.profileId);

            res.json({ templates });
        }
    } catch (error) {
        errorUtil.handleRouterError(res, error, "GET /api/v1/template/{id?}");
    }
});



export default router;