import availableModels from "../config/modelData.js";

function find(modelId) {
    return availableModels.find(m => m.id === modelId);
}

function modelTokenLimit(model) {
    return (
        (model === "gpt-4o" || model === "gpt-4o-mini") ? 25000 :
        (model === "o1-preview" || model === "o1-mini") ? 5000 : 
        0);
}

const modelUtil = { find, modelTokenLimit };

export default modelUtil;