import { config } from "../config.js";
import { storage } from "../lib/storage.js";

let cached = null;
let cacheExpiresAt = 0;
let pendingLoad = null;

async function loadFromGcs() {
    const settings = config.fundRecommendations;
    const bucket = storage.bucket(settings.bucketName);
    const [[fundCards], [schemeMaster], [personalityScores]] = await Promise.all([
        bucket.file(settings.fundCardsPath).download(),
        bucket.file(settings.schemeMasterPath).download(),
        bucket.file(settings.personalityScoresPath).download(),
    ]);
    let fundPayload;
    try {
        fundPayload = JSON.parse(fundCards.toString("utf8"));
    } catch (error) {
        throw new Error(
            `Invalid fund-card JSON in gs://${settings.bucketName}/${settings.fundCardsPath}: ${error.message}`,
        );
    }
    if (!Array.isArray(fundPayload.funds)) {
        throw new Error(`Fund-card object ${settings.fundCardsPath} does not contain funds[]`);
    }
    let scorePayload;
    try {
        scorePayload = JSON.parse(personalityScores.toString("utf8"));
    } catch (error) {
        throw new Error(
            `Invalid personality score JSON in gs://${settings.bucketName}/${settings.personalityScoresPath}: ${error.message}`,
        );
    }
    if (!Array.isArray(scorePayload.rows)) {
        throw new Error(`Personality score output ${settings.personalityScoresPath} does not contain rows[]`);
    }
    return {
        cards: fundPayload.funds,
        fundMetadata: {
            schemaVersion: fundPayload.schema_version,
            asOfDate: fundPayload.as_of_date,
            generatedAt: fundPayload.generated_at,
            sectionsAsOf: fundPayload.sections_as_of,
        },
        schemeMasterCsv: schemeMaster.toString("utf8"),
        scoreRows: scorePayload.rows,
        scoreMetadata: {
            asOfDate: scorePayload.as_of_date,
            configVersion: scorePayload.config_version,
            methodVersion: scorePayload.method_version,
            calibrationVersion: scorePayload.calibration_version,
            userAdjustment: scorePayload.user_adjustment,
        },
        loadedAt: new Date().toISOString(),
    };
}

export async function loadFundData({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (!forceRefresh && cached && now < cacheExpiresAt) return cached;
    if (pendingLoad) return pendingLoad;

    pendingLoad = loadFromGcs()
        .then((result) => {
            cached = result;
            cacheExpiresAt = Date.now() + config.fundRecommendations.cacheTtlMs;
            return result;
        })
        .finally(() => {
            pendingLoad = null;
        });

    return pendingLoad;
}

export function clearFundDataCache() {
    cached = null;
    cacheExpiresAt = 0;
}
