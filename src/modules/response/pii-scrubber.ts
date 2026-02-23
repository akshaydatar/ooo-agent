/**
 * A utility class to scrub PII (Personally Identifiable Information)
 * from text before it is sent to external LLMs or stored in drafts.
 */
export class PIIScrubber {
    private static PHONE_REGEX = /(\+?\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
    private static SSN_REGEX = /\b(?!000)(?!666)(?![9]\d{2})([0-8]\d{2}|7(?:[0-6]\d|7[012]))([ -]?)(?!00)(\d{2})\2(?!0000)(\d{4})\b/g;

    /**
     * Redacts obvious patterns like Phone Numbers and SSNs from text.
     * In an enterprise app, this would be backed by Google DLP API or Presidio.
     */
    static redact(text: string): string {
        if (!text) return text;

        let scrubbed = text;

        // Redact Phone Numbers
        scrubbed = scrubbed.replace(this.PHONE_REGEX, '[REDACTED_PHONE]');

        // Redact SSNs
        scrubbed = scrubbed.replace(this.SSN_REGEX, '[REDACTED_SSN]');

        // TODO: Enterprise integration goes here:
        // const dlpResult = await googleDlpClient.deidentifyContent(text);

        return scrubbed;
    }
}
