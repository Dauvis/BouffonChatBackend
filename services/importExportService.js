import archiver from "archiver";
import { PassThrough } from "stream";
import chatService from "./chatService.js";

function exportFilename() {
    const currentDate = new Date();
    const yearPart = currentDate.getFullYear();
    const monthPart = (currentDate.getMonth()+1).toString().padStart(2, "0");
    const dayPart = currentDate.getDate().toString().padStart(2, "0");
    const hourPart = currentDate.getHours().toString().padStart(2, "0");
    const minutePart = currentDate.getMinutes().toString().padStart(2, "0");
    const secondPart = currentDate.getSeconds().toString().padStart(2, "0");

    return `ChatExport_${yearPart}${monthPart}${dayPart}${hourPart}${minutePart}${secondPart}.zip`;
}

/**
 * Sends and array of chat export data to the frontend
 * @param {object} res 
 * @param {array} exportData 
 */
function transmitExport(res, exportData) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const memoryStream = new PassThrough();
    
    res.attachment(exportFilename());
    archive.pipe(memoryStream).pipe(res);
    
    for (const entry of exportData) {
        archive.append(entry.data, { name: entry.filename });
    };
    
    archive.finalize();
}

/**
 * Restores an imported chat from a file
 * @param {string} profileId 
 * @param {blob} fileData 
 */
function restoreImport(profileId, fileData) {
    const jsonText = fileData.toString('utf-8');
    const chat = JSON.parse(jsonText);
    chatService.importChat(profileId, chat);
}

const importExportService = { transmitExport, restoreImport };

export default importExportService;