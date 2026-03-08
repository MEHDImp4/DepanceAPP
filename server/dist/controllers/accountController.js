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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateAccount = exports.getAccounts = exports.createAccount = exports.getSummary = void 0;
const accountService = __importStar(require("../services/accountService"));
const getSummary = async (req, res, next) => {
    try {
        const userId = parseInt(String(req.user.userId));
        const summary = await accountService.getAccountSummary(userId);
        res.json(summary);
    }
    catch (error) {
        next(error);
    }
};
exports.getSummary = getSummary;
const createAccount = async (req, res, next) => {
    try {
        const body = req.body;
        const userId = parseInt(String(req.user.userId));
        const account = await accountService.createAccount({ ...body, userId });
        res.status(201).json(account);
    }
    catch (error) {
        next(error);
    }
};
exports.createAccount = createAccount;
const getAccounts = async (req, res, next) => {
    try {
        const userId = parseInt(String(req.user.userId));
        const accounts = await accountService.getUserAccounts(userId);
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
};
exports.getAccounts = getAccounts;
const updateAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const userId = parseInt(String(req.user.userId));
        try {
            const updated = await accountService.updateAccount({
                id: parseInt(id),
                userId,
                ...body
            });
            res.json(updated);
        }
        catch (error) {
            if (error.message === 'Account not found') {
                res.status(404).json({ error: 'Account not found' });
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.updateAccount = updateAccount;
const deleteAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const userId = parseInt(String(req.user.userId)); // Ensure number
        try {
            await accountService.deleteAccount(parseInt(id), userId, password);
            res.json({ message: 'Account deleted' });
        }
        catch (error) {
            if (error.message === 'Password is required') {
                res.status(400).json({ error: error.message });
            }
            else if (error.message === 'User not found' || error.message === 'Account not found') {
                res.status(404).json({ error: error.message });
            }
            else if (error.message === 'Invalid password') {
                res.status(401).json({ error: error.message });
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=accountController.js.map