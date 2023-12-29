"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import packages
const express_1 = __importDefault(require("express"));
const node_cache_1 = __importDefault(require("node-cache"));
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const resend_1 = require("resend");
require("dotenv").config();
// Middlewares
const app = (0, express_1.default)();
app.use(express_1.default.json());
const cache = new node_cache_1.default();
const port = process.env.PORT || 8001;
cache.set("accessToken", (0, uuid_1.v4)());
setInterval(() => {
    cache.set("accessToken", (0, uuid_1.v4)());
}, 1000 * 60 * 60);
var corsOptions = {
    origin: "*",
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.get("/api/getAccessToken", (req, res) => {
    if (process.env.API_TOKEN !== req.header("Authorization"))
        return res.status(401).send("Unauthorized. API token is required.");
    if (!cache.get("accessToken"))
        return res.status(500).json({
            error: "Internal Server Error!",
        });
    return res.status(200).json({
        accessToken: cache.get("accessToken"),
    });
});
app.post("/api/send-email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const accessToken = req.header("Authorization");
    if (!accessToken)
        return res.status(401).json({
            error: "Unauthorized. Access token is required in the header.",
        });
    if (cache.get("accessToken") !== accessToken) {
        return res.status(401).json({
            error: "Unauthorized. Invalid access token.",
        });
    }
    const { from, subject, html } = req.body;
    if (!from || !subject || !html)
        return res.status(400).json({
            error: "Bad Request. Please make sure you have include the 'from', 'subject' and 'html'.",
        });
    try {
        const record = cache.get(from);
        console.log("current record: " + from + "_" + record);
        console.log(parseInt(record) >= 2);
        if (record && parseInt(record) >= 2)
            return res
                .status(406)
                .json({ error: "Sorry you have exceeded the sending limit." });
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        const { data, error } = yield resend.emails.send({
            from: (_a = process.env.RESEND_REGISTERED_EMAIL) !== null && _a !== void 0 ? _a : "",
            to: (_b = process.env.MY_EMAIL) !== null && _b !== void 0 ? _b : "",
            subject,
            html,
        });
        if (error)
            return res.status(500).json({ error: error.message });
        cache.set(from, record ? parseInt(record) + 1 : 1, 86400);
        return res.status(200).json({ message: "Success!", id: data === null || data === void 0 ? void 0 : data.id });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}));
app.listen(port, () => console.log(`Listening to port ${port}`));
//# sourceMappingURL=index.js.map