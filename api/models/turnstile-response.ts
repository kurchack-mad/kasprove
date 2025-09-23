export interface TurnstileResponse {
    "success": boolean,
    "challenge_ts": string,
    "hostname": string,
    "error-codes": string[],
    "action": string,
    "cdata": string,
    "metadata": {
        "ephemeral_id": string,
    }
}