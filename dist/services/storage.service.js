"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class StorageService {
    storageName;
    get storagePath() {
        return `storage/${this.storageName}.json`;
    }
    constructor(storageName) {
        this.storageName = storageName;
    }
    async checkStorageFolder() {
        return new Promise((resolve, reject) => {
            fs.access('storage', fs.constants.F_OK, (err) => {
                if (err) {
                    fs.mkdir('storage', (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
    }
    async checkStorageFile() {
        await this.checkStorageFolder();
        return new Promise((resolve, reject) => {
            fs.access(this.storagePath, fs.constants.F_OK, (err) => {
                if (err) {
                    fs.writeFile(this.storagePath, '{}', (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
    }
    async readStorageFile() {
        await this.checkStorageFile();
        return new Promise((resolve, reject) => {
            fs.readFile(this.storagePath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data.trim());
            });
        });
    }
    async get(key) {
        const data = await this.readStorageFile();
        const storage = JSON.parse(data);
        return storage[key];
    }
    async set(key, value) {
        const data = await this.readStorageFile();
        const storage = JSON.parse(data);
        return new Promise((resolve, reject) => {
            fs.writeFile(this.storagePath, JSON.stringify({ ...storage, [key]: value }), (err) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    }
    async list() {
        const data = await this.readStorageFile();
        const storage = JSON.parse(data);
        return storage;
    }
}
exports.default = StorageService;
//# sourceMappingURL=storage.service.js.map