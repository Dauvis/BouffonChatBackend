import systemMessageData from "../config/systemMessageData.js";

function getToneOptionList()
{
    return Object.keys(systemMessageData.toneInstructions).sort();
}

function defaultModel() {
    return 'gpt-4o-mini';
}

function buildSystemMessage(tone, instructions, notes) {
    let messageParts = [];

    const toneInstructions = systemMessageData.toneInstructions[tone] || systemMessageData.toneInstructions[systemMessageData.defaultTone] || '';

    if (!toneInstructions) {
        throw Error(`Unable to find instructions for tone: ${tone}`);
    }

    messageParts.push(systemMessageData.header);
    messageParts.push(systemMessageData.toneOpening);
    messageParts.push(toneInstructions);
    messageParts.push(systemMessageData.toneClosing);

    if (instructions?.trim()) {
        messageParts.push(systemMessageData.instructionOpening);
        messageParts.push(instructions);
        messageParts.push(systemMessageData.instructionClosing);
    }

    if (notes?.trim()) {
        messageParts.push(systemMessageData.notesOpening);
        messageParts.push(notes);
        messageParts.push(systemMessageData.notesClosing);
    }

    const toolsList = Object.keys(systemMessageData.toolInstructions);

    if (toolsList.length > 0) {
        messageParts.push(systemMessageData.toolOpening);

        toolsList.forEach((tool) => {
            const toolInstruction = systemMessageData[tool];
            messageParts.push(`* ${tool}: ${toolInstruction}\n\n`);
        });

        messageParts.push(systemMessageData.toolClosing);
    }

    messageParts.push(systemMessageData.footer);

    return messageParts.join('');
}

export default { getToneOptionList, defaultModel, buildSystemMessage }
