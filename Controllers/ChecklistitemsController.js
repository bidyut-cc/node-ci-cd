const Controller = require("./Controller.js");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
const Checklist = require("../Models/Checklist.js");
const Card = require("../Models/Card.js");
const { default: mongoose } = require("mongoose");
const Models = require("../Models");
const Checklistitem = require("../Models/Checklistitem.js");
const AccountLog = require("../Helpers/AccountLog.js");
class ChecklistsController extends Controller {
    constructor() {
        super("Checklistitem");
    }

    /**
     * Adds a checklist item to a checklist.
     * Validates input data, including the checklist item title and ID.
     * Handles errors with appropriate status codes and messages.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            title: 'required', // Title of the checklist item is required
            checklistId: 'required', // Checklist ID is required
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
            const { title, checklistId } = req.body;
            const session = await mongoose.startSession();
            session.startTransaction(); 
            try {
                // Create a new checklist item
                let checklistItem = new Checklistitem;
                checklistItem.title = title;
                checklistItem.checklists = checklistId;

                // Push the checklist item ID to the items array in the corresponding checklist
                await Checklist.updateOne(
                    { _id: checklistId },
                    { $push: { items: checklistItem._id } },
                    { session }
                );

                // Save the checklist item with the session
                await checklistItem.save({ session });

                // If changeLog is enabled in the schema, log the creation event
                if (checklistItem.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `New ${this.model_name} created.`;
                    await accountLog.saveLog("saved", checklistItem, req.user, message, session); // Pass the session to saveLog
                }

                // Commit the transaction and end the session
                await session.commitTransaction();
                session.endSession();

                // Respond with a 200 status and success message
                res.status(200).json({
                    status: true,
                    message: "Checklist item added successfully.",
                    data: checklistItem
                });
            } catch(error) {
                // If an error occurs, abort the transaction, end the session, and respond with a 500 status and error message
                await session.abortTransaction();
                session.endSession();
                res.status(500).json({
                    message: "Server Error.",
                });
            }
        }
    }
  
    /**
     * Retrieves a specific document by ID, including custom fields and related checklists.
     * Populates the checklists field with the title and hidden status of each checklist.
     *
     * @param {object} req - The request object containing data from the client
     * @return {object} - An object containing custom fields and the retrieved document
     */
    async view(req) {
        // Get the model object
        var obj = this.getModelObj();

        // Retrieve custom fields from the schema
        let fields = obj.schema.customFields;

        // Find the document by ID and populate the 'checklists' field with their titles and hidden status
        obj = await eval(
            "Models." + this.model_name + ".findById('" + req.params.id + "')"
        ).populate({
            path: 'checklists',
            select: 'title hidden', // Select only the 'title' and 'hidden' fields of the related checklists
        }).exec();

        // Return an object containing the custom fields and the retrieved document
        return {
            fields: fields,
            results: {
                result: obj, // The retrieved document with populated checklists
            },
        };
    }


    /**
     * Updates a checklist's title and completion status.
     * Validates input data, including the checklist title and completion status.
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
            completed: 'required|boolean', // Completion status must be a boolean
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
                // If an error occurs, log the error for debugging purposes and respond with a 500 status
                console.error(error);
                res.status(500).json({
                    status: false,
                    message: 'Server Error.',
                });
            }
        }
    }

}

module.exports = ChecklistsController;
