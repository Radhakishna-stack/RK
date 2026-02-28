import { dbService } from '../db';

export interface SendTemplateOptions {
    to: string; // E.164 formatted phone number (e.g., +919000000000)
    templateName: string; // The exact name of the approved template in Kapso
    languageCode?: string; // Default: 'en_US' or 'en'
    parameters?: string[]; // Array of strings to fill {{1}}, {{2}} in the template body (positional)
    namedParameters?: Record<string, string>; // Map of key-value pairs for named parameters (preferred)
}

/**
 * Validates and formats an Indian phone number to E.164.
 * Fallback to adding +91 if missing.
 */
function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;

    // Best effort fallback
    return `+91${cleaned.slice(-10)}`;
}

class WhatsAppService {
    private kapsoApiBaseUrl = 'https://api.kapso.ai/meta/whatsapp/v24.0';

    private async getCredentials() {
        const settings = await dbService.getSettings();
        const config = settings?.whatsapp;

        if (!config?.kapsoApiKey || !config?.phoneNumberId) {
            console.warn('[WhatsAppService] Kapso credentials are not configured in Settings.');
            return null;
        }

        return config;
    }

    /**
     * Sends an approved WhatsApp Template message directly via the Kapso Meta Proxy endpoint.
     */
    async sendTemplateMessage(options: SendTemplateOptions): Promise<boolean> {
        try {
            const creds = await this.getCredentials();
            if (!creds) return false;

            // Ensure valid E.164 phone number
            const formattedTo = formatPhoneNumber(options.to);
            if (formattedTo.length < 10) {
                console.error('[WhatsAppService] Invalid phone number provided:', options.to);
                return false;
            }

            const url = `${this.kapsoApiBaseUrl}/${creds.phoneNumberId}/messages`;

            let components: any[] = [];

            // Determine if we are using positional parameters or preferred named parameters 
            if (options.namedParameters && Object.keys(options.namedParameters).length > 0) {
                const bodyParams = Object.entries(options.namedParameters).map(([name, text]) => ({
                    type: 'text',
                    parameter_name: name,
                    text: text
                }));

                if (bodyParams.length > 0) {
                    components.push({
                        type: 'body',
                        parameters: bodyParams
                    });
                }
            } else if (options.parameters && options.parameters.length > 0) {
                // Fallback for positional parameters
                components.push({
                    type: 'body',
                    parameters: options.parameters.map(param => ({
                        type: 'text',
                        text: param
                    }))
                });
            }

            const payload = {
                messaging_product: 'whatsapp',
                to: formattedTo,
                type: 'template',
                template: {
                    name: options.templateName,
                    language: {
                        code: options.languageCode || 'en_US'
                    },
                    components: components.length > 0 ? components : undefined
                }
            };

            console.log(`[WhatsAppService] Dispatching template '${options.templateName}' to ${formattedTo}...`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': creds.kapsoApiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[WhatsAppService] Kapso API Error:', errorData);
                // We log it but do not throw, so it doesn't crash the UI saving logic
                return false;
            }

            console.log(`[WhatsAppService] ✅ Message dispatched successfully.`);
            return true;
        } catch (err: any) {
            console.error('[WhatsAppService] Network or unexpected error:', err.message);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
