const Controller = require("./Controller.js");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
const Checklist = require("../Models/Checklist.js");
const Card = require("../Models/Card.js");
const { default: mongoose } = require("mongoose");
const Models = require("../Models");
const AccountLog = require("../Helpers/AccountLog.js");
class ChecklistsController extends Controller {
    constructor() {
        super("Checklist");
    }

    /**
     * Adds a new checklist to a card.
     * Validates input data, including title and cardId.
     * Handles errors with appropriate status codes and messages.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            title: 'required', // Title is required
            cardId: 'required' // Card ID is required
        });

        // Check if validation passes
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
            res.status(422).json({
                status: false,
                errors: v.errors
            });
        } else {
            // Destructure title and cardId from the request body
            const { title, cardId } = req.body;

            // Start a new session for transaction
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Create a new Checklist instance
                let checklist = new Checklist();
                checklist.title = title;
                checklist.cards = cardId;

                // Update the specified card to push the new checklist's ID
                await Card.updateOne(
                    { _id: cardId },
                    { $push: { checklists: checklist._id } },
                    { session }
                );

                // If changeLog is enabled in the schema, log the creation event
                if (checklist.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `New ${this.model_name} created.`;
                    await accountLog.saveLog("saved", checklist, req.user, message);
                }

                // Save the new checklist with the session
                await checklist.save({ session });

                // Commit the transaction and end the session
                await session.commitTransaction();
                session.endSession();

                // Respond with a 200 status and success message
                res.status(200).json({
                    status: true,
                    message: "Checklist added successfully.",
                    data: checklist
                });
            } catch (error) {
                // If an error occurs, abort the transaction and end the session
                await session.abortTransaction();
                session.endSession();
                // Respond with a 500 status and an error message
                res.status(500).json({
                    status: false,
                    message: "Server Error.",
                });
            }
        }
    }


  
    /**
     * Retrieves a specific document by ID, including custom fields and related cards.
     * Populates the cards field with the title of each card and items with title and completed fields.
     *
     * @param {object} req - The request object containing data from the client
     * @return {object} - An object containing custom fields and the retrieved document
     */
    async view(req) {
        // Get the model object
        var obj = this.getModelObj();

        // Retrieve custom fields from the schema
        let fields = obj.schema.customFields;

        try {
            // Find the document by ID and populate the 'cards' and 'items' fields
            obj = await eval(
                "Models." + this.model_name + ".findById('" + req.params.id + "')"
            ).populate({
                path: 'cards',
                select: 'title', // Select only the 'title' field of the related cards
            }).populate({
                path: 'items',
                select: 'title completed', // Select the 'title' and 'completed' fields of the related items
            }).exec();

            // Return an object containing the custom fields and the retrieved document
            return {
                fields: fields,
                results: {
                    result: obj, // The retrieved document with populated cards and items
                },
            };
        } catch (error) {
            // Handle any errors that occur during the execution
            console.error('Error retrieving document:', error);
            throw new Error('Unable to retrieve document');
        }
    }



    /**
     * Updates a checklist's title and hidden status.
     * Validates input data, including the checklist title, ID, and hidden status.
     * Handles errors with appropriate status codes and messages.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async update(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            title: 'required', // Title is required
            hidden: 'required|boolean' // Hidden status must be a boolean
        });

        // Check if validation passes
        const matched = await v.check();

        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
            res.status(422).json({
                status: false,
                errors: v.errors
            });
        } else {
            try {
                // Attempt to update the checklist using the inherited update method
                const result = await super.update(req);

                // Respond with a 200 status and the result
                res.status(200).json(result);
            } catch (error) {
                // If an error occurs, respond with a 500 status and an error message
                res.status(500).json({
                    status: false,
                    message: 'Server Error.',
                });
            }
        }
    }



    /**
     * Deletes one or multiple items.
     * Validates the input data, specifically the array of IDs.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
       async delete(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            ids: 'required|array', // ids is required and should be an array
        });

        // Check if validation passes
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
            res.status(422).json({
                status: false,
                errors: v.errors
            });
        } else {
            try {
                // Attempt to delete the item(s) using the inherited delete method
                const result = await super.delete(req);
                // Respond with a 200 status and the result
                res.status(200).json(result);
            } catch (error) {
                // If an error occurs, respond with a 500 status and a server error message
                res.status(500).json({
                    status: false,
                    message: "Server error."
                });
            }
        }
    }
}

module.exports = ChecklistsController;
