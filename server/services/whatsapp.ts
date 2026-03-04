import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

// Initialize Kapso WhatsApp Client
const kapsoClient = new WhatsAppClient({
    baseUrl: process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai/meta/whatsapp",
    kapsoApiKey: process.env.KAPSO_API_KEY || "",
});

const DEFAULT_PHONE_ID = process.env.KAPSO_PHONE_NUMBER_ID || "";

export const sendJobAssignment = async (
    customerPhone: string,
    customerName: string,
    employeeName: string,
    role: string
) => {
    if (!DEFAULT_PHONE_ID || !process.env.KAPSO_API_KEY) {
        console.warn("[WhatsApp] Missing Kapso configuration. Skipping message send.");
        return false;
    }

    try {
        // Simple text message notifying the user
        const messageBody = `Hello ${customerName}, your request has been assigned to a ${role}. ${employeeName} will be assisting you shortly.`;

        await kapsoClient.messages.sendText({
            phoneNumberId: DEFAULT_PHONE_ID,
            to: (customerPhone.startsWith("+") ? customerPhone : `+91${customerPhone}`),
            body: messageBody,
        });

        console.log(`[WhatsApp] Sent assignment update to ${customerPhone}`);
        return true;
    } catch (error) {
        console.error('[WhatsApp] Send Job Assignment Error:', error);
        return false;
    }
}

export const sendStatusUpdate = async (
    customerPhone: string,
    customerName: string,
    status: string,
    jobDetails?: string
) => {
    if (!DEFAULT_PHONE_ID || !process.env.KAPSO_API_KEY) {
        console.warn("[WhatsApp] Missing Kapso configuration. Skipping message send.");
        return false;
    }

    try {
        let body = `Hello ${customerName}, your service request status is now: *${status}*.`;
        if (jobDetails) {
            body += `\n\nNotes: ${jobDetails}`;
        }

        await kapsoClient.messages.sendText({
            phoneNumberId: DEFAULT_PHONE_ID,
            to: (customerPhone.startsWith("+") ? customerPhone : `+91${customerPhone}`),
            body,
        });

        console.log(`[WhatsApp] Sent status update to ${customerPhone}`);
        return true;
    } catch (error) {
        console.error('[WhatsApp] Send Status Update Error:', error);
        return false;
    }
}
