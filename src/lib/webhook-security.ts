import crypto from 'crypto';

/**
 * Generate a secure webhook secret for ComfyUI integration
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate webhook signature using HMAC
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Simple secret-based validation for development
 */
export function validateWebhookSecret(providedSecret: string): boolean {
  const expectedSecret = process.env.COMFYUI_WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    console.warn('COMFYUI_WEBHOOK_SECRET not set - webhook validation disabled');
    return true; // Allow in development if no secret is set
  }
  
  // Ensure both strings are the same length for timingSafeEqual
  const provided = Buffer.from(providedSecret || '');
  const expected = Buffer.from(expectedSecret);
  
  if (provided.length !== expected.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(provided, expected);
}

/**
 * Get the webhook URL for ComfyUI to call
 */
export function getWebhookUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  return `${baseUrl}/api/webhook/comfyui`;
}

/**
 * Get the webhook secret for ComfyUI configuration
 */
export function getWebhookSecret(): string {
  return process.env.COMFYUI_WEBHOOK_SECRET || '';
}
