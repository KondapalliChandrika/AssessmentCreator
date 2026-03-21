"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenerationQueue = getGenerationQueue;
const bullmq_1 = require("bullmq");
const cacheService_1 = require("../services/cacheService");
let generationQueue = null;
function getGenerationQueue() {
    if (!generationQueue) {
        generationQueue = new bullmq_1.Queue('generation', {
            connection: (0, cacheService_1.getRedis)(),
        });
    }
    return generationQueue;
}
