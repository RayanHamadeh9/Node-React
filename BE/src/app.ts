import express, {Application, Request, RequestHandler, Response} from 'express';
import learningPackages from './data/learningPackages';
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import squelize from "./squelize";
import LearningFactDto from "./models/sequelize/LearningFactDto";
import LearningPackageDto from "./models/sequelize/LearningPackageDto";
import {Sequelize} from "sequelize";
import sequelize from "./squelize";
import UserDto from "./models/sequelize/UserDto";
import UserLearningFactDto from "./models/sequelize/UserLearningFactDto";

const app: Application = express()
app.use(express.json())
app.use(express.static("public"));

const port = 3000


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

const specs = swaggerJsdoc(options);
console.log("swagger options", specs)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));


LearningFactDto.belongsTo(LearningPackageDto, {
    foreignKey: {
        name: "packageId",
        allowNull: false
    }
});
LearningPackageDto.hasMany(LearningFactDto, {
    foreignKey: {
        name: "packageId",
        allowNull: false
    }
});

// User and UserLearningFact
UserDto.hasMany(UserLearningFactDto, {
    foreignKey: 'userId',
    as: 'learningFacts',
});

UserLearningFactDto.belongsTo(UserDto, {
    foreignKey: 'userId',
    as: 'user',
});



Promise.all([squelize.sync({force: true})])
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
app.get('/api/liveliness', (request: Request, response: Response) => {
    response.status(200).send({"message": "OK"});
})


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
app.get('/api/package', async (request: Request, response: Response) => {
    try {
        const result = await LearningPackageDto.findAll();
        response.status(200).send(result);
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
});

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
app.get('/api/package/:id', async (request: Request, response: Response) => {
    const packageId = Number(request.params?.id ?? (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({message: 'Invalid package id : ' + packageId});
        return;
    }
    try {
        const learningPackage = await LearningPackageDto.findOne({where: {id: packageId}});
        if (learningPackage) {
            response.status(200).json(learningPackage);
        } else {
            response.status(404).send({message: 'Package not found for id: ' + packageId});
        }
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
})

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
app.post('/api/package', async (request: Request, response: Response) => {
    const packageData = request.body;
    if (!packageData.title || !packageData.description || !packageData.category || !packageData.targetAudience || !packageData.difficulty) {
        response.status(400).send({message: 'Mandatory fields missing'});
        return;
    }
    try {
        const learningPackage = await LearningPackageDto.create({
            title: packageData.title,
            description: packageData.description,
            category: packageData.category,
            targetAudience: packageData.targetAudience,
            difficulty: parseInt(packageData.difficulty) || 0
        });
        response.status(200).json(learningPackage);
    } catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({message: 'Server error'});
    }
});

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
app.put('/api/package/:id', async (request: Request, response: Response) => {
    const packageId = Number(request.params?.id ?? (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({message: 'Invalid package id: ' + packageId});
        return;
    }
    try {
        const result = await LearningPackageDto.update(
            {
                title: request.body.title || Sequelize.col('title'),
                description: request.body.description || Sequelize.col('description'),
                category: request.body.category || Sequelize.col('category'),
                targetAudience: request.body.targetAudience || Sequelize.col('targetAudience'),
                difficulty: parseInt(request.body.difficulty) || Sequelize.col('difficulty'),
            },
            {
                where:
                    {
                        id: packageId
                    }
            }
        );

        if (result[0] == 0) {
            response.status(404).send({message: 'Package not found for id: ' + packageId});
            return;
        }
        response.status(200).send({"message": "OK"});
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
});

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
app.delete('/api/package/:id', async (request: Request, response: Response) => {
    const packageId = Number(request.params?.id ?? (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({message: 'Invalid package id: ' + packageId});
        return;
    }
    try {
        const result = await LearningPackageDto.destroy(
            {
                where:
                    {
                        id: packageId
                    }
            }
        );

        if (result == 0) {
            response.status(404).send({message: 'Package not found for id: ' + packageId});
            return;
        }
        response.status(200).send({"message": "OK"});
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
});

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
app.get('/api/package-summaries', async (request: Request, response: Response) => {
    try {
        const results = await LearningPackageDto.findAll({attributes: ['id', 'title']});
        response.status(200).json(results);
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
});


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
app.get('/api/package/:id/fact', async (request: Request, response: Response) => {
    const packageId = Number(request.params?.id ?? (request.params.id || ''));
    if (isNaN(packageId)) {
        response.status(404).send({message: 'Invalid package id: ' + packageId});
        return;
    }
    try {
        const result = await LearningFactDto.findAll({
            where: {
                packageId: packageId,
            }
        });
        response.status(200).send(result);
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
});

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
app.get('/api/package/fact/:id', async (request: Request, response: Response) => {
    const factId = request.params?.id ?? request.params.id;
    if (!factId) {
        response.status(404).send({message: 'Invalid fact id: ' + factId});
        return;
    }
    try {
        const learningFact = await LearningFactDto.findOne(
            {
                where: {
                    id: factId
                }
            });
        if (learningFact) {
            response.status(200).json(learningFact);
        } else {
            response.status(404).send({message: 'Fact not found for id: ' + factId});
        }
    } catch (error) {
        console.error('Error connecting to the server:', error);
    }
})
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
app.post('/api/package/:id/fact', async (request: Request, response: Response) => {
    const packageId = Number(request.params?.id ?? (request.params.id || ''));
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
        const packageExists = await LearningPackageDto.findOne({
            where: {
                id: packageId
            }
        });

        if (!packageExists) {
            response.status(404).send({ message: 'Package not found for id: ' + packageId });
            return;
        }

        const learningFact = await LearningFactDto.create({
            id,
            content,
            packageId
        });

        response.status(200).json(learningFact);
    } catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
});

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
app.put('/api/package/fact/:id', async (request: Request, response: Response) => {
    const factId = request.params?.id ?? request.params.id;
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
        const [affectedRows] = await LearningFactDto.update(
            { content },
            { where: { id: factId } }
        );

        if (affectedRows === 0) {
            response.status(404).send({ message: 'Fact not found for id: ' + factId });
            return;
        }

        response.status(200).send({ message: 'Learning fact updated successfully.' });
    } catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
});

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
app.delete('/api/package/fact/:id', async (request: Request, response: Response) => {
    const factId = request.params?.id ?? request.params.id;
    if (!factId) {
        response.status(400).send({ message: 'Invalid fact id: ' + factId });
        return;
    }

    try {
        const result = await LearningFactDto.destroy({
            where: { id: factId }
        });

        if (result === 0) {
            response.status(404).send({ message: 'Fact not found for id: ' + factId });
            return;
        }

        response.status(200).send({ message: 'Learning fact deleted successfully.' });
    } catch (error) {
        console.error('Error connecting to the server:', error);
        response.status(500).send({ message: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
