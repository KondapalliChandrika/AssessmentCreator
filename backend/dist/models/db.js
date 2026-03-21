"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = connectMongoDB;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error('MONGODB_URI is not defined in environment variables');
    try {
        await mongoose_1.default.connect(uri);
        console.log('✅ MongoDB connected');
    }
    catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
}
