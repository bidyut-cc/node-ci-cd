const Controller = require("./Controller.js");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
const Card = require("../Models/Card.js");
const { default: mongoose } = require("mongoose");
const Models = require("../Models");
const AccountLog = require("../Helpers/AccountLog.js");
const Comment = require("../Models/Comment.js");
class CommentsController extends Controller {
    constructor() {
        super("Comment");
    }

    /**
     * Adds a new comment to a card.
     * Validates the input data to ensure the comment and cardId are provided.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            comment: 'required', // Comment is required
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
            // Destructure comment and cardId from request body
            const { comment, cardId } = req.body;
            
            // Start a new session for the transaction
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Find the card by its ID
                const card = await Card.findById(new mongoose.Types.ObjectId(cardId)).session(session);
                if (!card) {
                    // If the card is not found, respond with a 404 status and error message
                    res.status(404).json({
                        status: true,
                        message: "Card not found."
                    });
                    return; // Exit function
                }

                // Create a new comment instance
                let commentData = new Comment();
                commentData.comment = comment;
                commentData.card = cardId;
                commentData.user = req.user._id;

                // If changeLog is enabled in the schema, log the creation event
                if (commentData.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `New ${this.model_name} added.`;
                    await accountLog.saveLog("saved", commentData, req.user, message, session); 
                }

                // Push the comment ID into the respective card's comments field using the session
                await Card.updateMany(
                    { _id: cardId }, // Find the card by its ID
                    { $push: { comments: commentData._id } }, // Push the comment ID into the comments array
                    { session } // Use the session
                );

                // Save the new comment to the database
                await commentData.save({ session });

                // Commit the transaction and end the session
                await session.commitTransaction();
                session.endSession();

                // Respond with a 200 status and success message
                res.status(200).json({
                    status: true,
                    message: "Comment added successfully.",
                    data: commentData
                });
            } catch (error) {
                // If an error occurs, abort the transaction and end the session
                await session.abortTransaction();
                session.endSession();
                console.log(error);

                // Respond with a 500 status and server error message
                res.status(500).json({
                    status: false,
                    message: "Server Error.",
                });
            }
        }
    }

    /**
     * Updates a comment.
     * Validates the input data to ensure the comment is provided.
     * Handles errors with appropriate status codes and messages.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async update(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            comment: 'required', // Comment is required
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
                // Attempt to update the comment using the inherited update method
                const result = await super.update(req);
                // Respond with a 200 status and the result
                res.status(200).json(result);
            } catch (error) {
                // If an error occurs, respond with a 500 status and an error message
                res.status(500).json({
                    status: false,
                    message: error.message,
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

module.exports = CommentsController;
