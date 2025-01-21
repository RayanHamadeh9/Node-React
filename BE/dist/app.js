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
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const squelize_1 = __importDefault(require("./squelize"));
const LearningFactDto_1 = __importDefault(require("./models/sequelize/LearningFactDto"));
const LearningPackageDto_1 = __importDefault(require("./models/sequelize/LearningPackageDto"));
const sequelize_1 = require("sequelize");
const UserDto_1 = __importDefault(require("./models/sequelize/UserDto"));
const UserLearningFactDto_1 = __importDefault(require("./models/sequelize/UserLearningFactDto"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static("public"));
const port = 3000;
const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Express API with Swagger",
            version: "0.1.0",
            description: "Swagger",
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ["./src/**/*.ts"],
    explorer: true
};
const specs = (0, swagger_jsdoc_1.default)(options);
console.log("swagger options", specs);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
LearningFactDto_1.default.belongsTo(LearningPackageDto_1.default, {
    foreignKey: {
        name: "packageId",
        allowNull: false
    }
});
LearningPackageDto_1.default.hasMany(LearningFactDto_1.default, {
    foreignKey: {
        name: "packageId",
        allowNull: false
    }
});
// User and UserLearningFact
UserDto_1.default.hasMany(UserLearningFactDto_1.default, {
    foreignKey: 'userId',
    as: 'learningFacts',
});
UserLearningFactDto_1.default.belongsTo(UserDto_1.default, {
    foreignKey: 'userId',
    as: 'user',
});
Promise.all([squelize_1.default.sync({ force: true })])
    .then(() => console.log("database synced"))
    .catch((error) => console.error(error));
/**
 * @openapi
 * /api/liveliness:
 *  get:
 *    summary: liveliness
 *    tags:
 *      - monitor
 *    responses:
 *      200:
 *        description: OK if the server alive
 */
app.get('/api/liveliness', (request, response) => {
    response.status(200).send({ "message": "OK" });
});
/**
 * @openapi
 * /api/package:
 *  get:
 *    summary: All learning packages
 *    tags:
 *      - package
 *    responses:
 *      200:
 *        description: All learning packages
 */
app.get('/api/package', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield LearningPackageDto_1.default.findAll();
        response.status(200).send(result);
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package/{id}:
 *  get:
 *    summary: Learning package by id
 *    tags:
 *      - package
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *          required: true
 *          description: Numeric id of the package
 *    responses:
 *      200:
 *        description: Learning package by id
 *      404:
 *        description: Learning package id not found
 */
app.get('/api/package/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const packageId = Number((_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({ message: 'Invalid package id : ' + packageId });
        return;
    }
    try {
        const learningPackage = yield LearningPackageDto_1.default.findOne({ where: { id: packageId } });
        if (learningPackage) {
            response.status(200).json(learningPackage);
        }
        else {
            response.status(404).send({ message: 'Package not found for id: ' + packageId });
        }
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package:
 *  post:
 *    summary: Create a learning package
 *    tags:
 *      - package
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *                example: "Introduction to Programming"
 *              description:
 *                type: string
 *                example: "A beginner's guide to programming."
 *              category:
 *                type: string
 *                example: "Technology"
 *              targetAudience:
 *                type: string
 *                example: "Students"
 *              difficulty:
 *                type: integer
 *                example: 3
 *            required:
 *              - title
 *              - description
 *              - category
 *              - targetAudience
 *              - difficulty
 *    responses:
 *      200:
 *        description: Learning package created
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *                  example: 1
 *                title:
 *                  type: string
 *                  example: "Introduction to Programming"
 *                description:
 *                  type: string
 *                  example: "A beginner's guide to programming."
 *                category:
 *                  type: string
 *                  example: "Technology"
 *                targetAudience:
 *                  type: string
 *                  example: "Students"
 *                difficulty:
 *                  type: integer
 *                  example: 3
 *      400:
 *        description: Mandatory fields missing
 */
app.post('/api/package', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const packageData = request.body;
    if (!packageData.title || !packageData.description || !packageData.category || !packageData.targetAudience || !packageData.difficulty) {
        response.status(400).send({ message: 'Mandatory fields missing' });
        return;
    }
    try {
        const learningPackage = yield LearningPackageDto_1.default.create({
            title: packageData.title,
            description: packageData.description,
            category: packageData.category,
            targetAudience: packageData.targetAudience,
            difficulty: parseInt(packageData.difficulty) || 0
        });
        response.status(200).json(learningPackage);
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Server error' });
    }
}));
/**
 * @openapi
 * /api/package/{id}:
 *  put:
 *    summary: Update a learning package by id
 *    tags:
 *      - package
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric id of the package to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *                example: "Updated Title"
 *              description:
 *                type: string
 *                example: "Updated description of the package."
 *              category:
 *                type: string
 *                example: "Updated Category"
 *              targetAudience:
 *                type: string
 *                example: "Updated Audience"
 *              difficulty:
 *                type: integer
 *                example: 2
 *    responses:
 *      200:
 *        description: OK if the learning package is updated
 *      404:
 *        description: Learning package id not found
 *      400:
 *        description: Invalid package id
 *      500:
 *        description: Internal server error
 */
app.put('/api/package/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const packageId = Number((_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({ message: 'Invalid package id: ' + packageId });
        return;
    }
    try {
        const result = yield LearningPackageDto_1.default.update({
            title: request.body.title || sequelize_1.Sequelize.col('title'),
            description: request.body.description || sequelize_1.Sequelize.col('description'),
            category: request.body.category || sequelize_1.Sequelize.col('category'),
            targetAudience: request.body.targetAudience || sequelize_1.Sequelize.col('targetAudience'),
            difficulty: parseInt(request.body.difficulty) || sequelize_1.Sequelize.col('difficulty'),
        }, {
            where: {
                id: packageId
            }
        });
        if (result[0] == 0) {
            response.status(404).send({ message: 'Package not found for id: ' + packageId });
            return;
        }
        response.status(200).send({ "message": "OK" });
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package/{id}:
 *  delete:
 *    summary: Delete a learning package by id
 *    tags:
 *      - package
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *          required: true
 *          description: Numeric id of the package
 *    responses:
 *      200:
 *        description: OK if the learning package deleted
 *      400:
 *        description: Learning package id not found
 */
app.delete('/api/package/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const packageId = Number((_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({ message: 'Invalid package id: ' + packageId });
        return;
    }
    try {
        const result = yield LearningPackageDto_1.default.destroy({
            where: {
                id: packageId
            }
        });
        if (result == 0) {
            response.status(404).send({ message: 'Package not found for id: ' + packageId });
            return;
        }
        response.status(200).send({ "message": "OK" });
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package-summaries:
 *  get:
 *    summary: Summaries of all learning packages
 *    tags:
 *      - package
 *    responses:
 *      200:
 *        description: Summaries of all learning packages
 */
app.get('/api/package-summaries', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield LearningPackageDto_1.default.findAll({ attributes: ['id', 'title'] });
        response.status(200).json(results);
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
// LEARNING FACT
/**
 * @openapi
 * /api/package/{id}/fact:
 *  get:
 *    summary: All learning facts for a given package
 *    tags:
 *      - fact
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *          required: true
 *          description: Numeric id of the package
 *    responses:
 *      200:
 *        description: All learning facts for the given package
 */
app.get('/api/package/:id/fact', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const packageId = Number((_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({ message: 'Invalid package id: ' + packageId });
        return;
    }
    try {
        const result = yield LearningFactDto_1.default.findAll({
            where: {
                packageId: packageId,
            }
        });
        response.status(200).send(result);
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package/fact/{id}:
 *  get:
 *    summary: Learning fact by id
 *    tags:
 *      - fact
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          required: true
 *          description: Textual id of the fact
 *    responses:
 *      200:
 *        description: Learning fact by id
 *      404:
 *        description: Learning fact id not found
 */
app.get('/api/package/fact/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const factId = (_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : request.params.id;
    if (!factId) {
        response.status(404).send({ message: 'Invalid fact id: ' + factId });
        return;
    }
    try {
        const learningFact = yield LearningFactDto_1.default.findOne({
            where: {
                id: factId
            }
        });
        if (learningFact) {
            response.status(200).json(learningFact);
        }
        else {
            response.status(404).send({ message: 'Fact not found for id: ' + factId });
        }
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
    }
}));
/**
 * @openapi
 * /api/package/{id}/fact:
 *  post:
 *    summary: Create a learning fact in the given package
 *    tags:
 *      - fact
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: The numeric ID of the package
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                description: The textual ID of the learning fact
 *              content:
 *                type: string
 *                description: The content of the learning fact
 *            required:
 *              - id
 *              - content
 *    responses:
 *      200:
 *        description: Learning fact successfully created
 *      400:
 *        description: Mandatory fields missing in the request body
 *      404:
 *        description: Package not found for the provided ID
 */
app.post('/api/package/:id/fact', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const packageId = Number((_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({ message: 'Invalid package id: ' + packageId });
        return;
    }
    const { id, content } = request.body;
    if (!id || !content) {
        response.status(400).send({ message: 'Mandatory fields missing' });
        return;
    }
    try {
        const packageExists = yield LearningPackageDto_1.default.findOne({
            where: {
                id: packageId
            }
        });
        if (!packageExists) {
            response.status(404).send({ message: 'Package not found for id: ' + packageId });
            return;
        }
        const learningFact = yield LearningFactDto_1.default.create({
            id,
            content,
            packageId
        });
        response.status(200).json(learningFact);
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
}));
/**
 * @openapi
 * /api/package/fact/{id}:
 *  put:
 *    summary: Update a learning fact by id
 *    tags:
 *      - fact
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Textual ID of the fact to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              content:
 *                type: string
 *                description: The new content of the learning fact
 *            required:
 *              - content
 *    responses:
 *      200:
 *        description: Learning fact successfully updated
 *      400:
 *        description: Invalid learning fact ID or missing content in the request
 *      404:
 *        description: Learning fact not found for the provided ID
 */
app.put('/api/package/fact/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const factId = (_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : request.params.id;
    if (!factId) {
        response.status(400).send({ message: 'Invalid fact id: ' + factId });
        return;
    }
    const { content } = request.body;
    if (!content) {
        response.status(400).send({ message: 'Content is required to update the fact.' });
        return;
    }
    try {
        const [affectedRows] = yield LearningFactDto_1.default.update({ content }, { where: { id: factId } });
        if (affectedRows === 0) {
            response.status(404).send({ message: 'Fact not found for id: ' + factId });
            return;
        }
        response.status(200).send({ message: 'Learning fact updated successfully.' });
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
}));
/**
 * @openapi
 * /api/package/fact/{id}:
 *  delete:
 *    summary: Delete a learning fact by id
 *    tags:
 *      - fact
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Textual ID of the learning fact to delete
 *    responses:
 *      200:
 *        description: Learning fact successfully deleted
 *      404:
 *        description: Learning fact not found for the provided ID
 */
app.delete('/api/package/fact/:id', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const factId = (_b = (_a = request.params) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : request.params.id;
    if (!factId) {
        response.status(400).send({ message: 'Invalid fact id: ' + factId });
        return;
    }
    try {
        const result = yield LearningFactDto_1.default.destroy({
            where: { id: factId }
        });
        if (result === 0) {
            response.status(404).send({ message: 'Fact not found for id: ' + factId });
            return;
        }
        response.status(200).send({ message: 'Learning fact deleted successfully.' });
    }
    catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
