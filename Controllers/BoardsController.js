const Controller = require("./Controller.js");
const User = require("../Models/User");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
require('../Helpers/extend-node-input-validator');
const Board = require("../Models/Board.js");
const List = require("../Models/List.js");
const Models = require("../Models");
const slugify = require('slugify');
const { default: mongoose } = require("mongoose");
const AccountLog = require("../Helpers/AccountLog.js");
class BoardsController extends Controller {
    constructor() {
        super("Board");
    }

    /**
     * To add a board 
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        // Generate a slug from the title provided in the request body
        const slug = slugify(req.body.title, { lower: true });
        req.body.slug = slug;

        // Validate the input data
        const v = new Validator(req.body, {
            title: 'required', // Title is required
            slug: 'required|unique:board,slug' // Slug is required and must be unique in the Board collection
        }, {
            'slug.unique': 'The slug must be unique. The provided title has already been used.' // Custom error message for slug uniqueness
        });

        // Check if validation passes
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
             res.status(422).json({
                status: false,
                errors: v.errors
            });
            return;
        }

        // Start a session and begin a transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Create a new Board document
            let board = new Board;
            board.title = req.body.title; // Set the title from the request body
            board.members = req.user._id; // Add the current user's ID to the members array
            board.createdBy = req.user._id; // Set the createdBy field to the current user's ID
            board.slug = slug; // Set the slug

            // Update the User document to add the board's ID to the user's boards array
            await User.updateOne(
                { _id: req.user._id }, // Find the current user by ID
                { $push: { boards: board._id } }, // Push the new board's ID into the boards array
                { session } // Use the session for the transaction
            );

            // Save the new board
            await board.save({ session });

            // If changeLog is enabled in the schema, log the creation event
            if (board.schema.changeLog) {
                var accountLog = new AccountLog();
                const message = `New ${this.model_name} created.`
                await accountLog.saveLog("saved", board, req.user, message, session); // Pass the session to saveLog
            }

            // Commit the transaction
            await session.commitTransaction();
            session.endSession(); // End the session

            // Respond with a success message
             res.status(200).json({
                status: true,
                message: "Board added successfully.",
                data: board
            });
        } catch (error) {
            // If an error occurs, abort the transaction and end the session
            await session.abortTransaction();
            session.endSession();

            // Respond with a server error message
             res.status(500).json({
                status: false,
                message: "Server error."
            });
        }
    }

    /**
     * Updates a board's information.
     * Validates the input data, including the uniqueness of the slug.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */ 
    async update(req, res) {
        // Generate a slug from the title provided in the request body
        const slug = slugify(req.body.title, { lower: true });
        req.body.slug = slug;

        // Validate the input data
        const v = new Validator(req.body, {
            title: 'required', // Title is required
            slug: 'required|unique:board,slug,' + req.params.id, // Slug is required and must be unique in the Board collection, excluding the current board's ID
        }, {
            'slug.unique': 'The slug must be unique. The provided title has already been used.' // Custom error message for slug uniqueness
        });

        // Check if validation passes
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
             res.status(422).json({
                status: false,
                errors: v.errors
            });
            return;
        } else {
            let obj = await eval("Models." + this.model_name).findById(
                req.params.id
            );
            for (var param in req.body) {
                if (obj.schema.fillable.indexOf(param) > -1)
                    obj[param] = req.body[param];
            }
            var error = obj.validateSync();
            try {
                this.resolveValidationErrors(error);
                if (obj.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `${this.model_name} model title data updated.`
                    await accountLog.saveLog("updated", obj, req.user, message);
                }
                await obj.save();
                return {
                    status: true,
                    message: `${this.model_name} Updated Successfully`,
                    object: obj,
                };
            } catch (error) {
                return {
                    status: false,
                    message: error.message,
                };
            }
        }
    }

    /**
     * Retrieves a list of boards associated with the user.
     * Populates the boards with members, createdBy, lists, and cards.
     * Handles errors with a server error message.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response with boards data or an error message
     */
    async list(req, res) {
        try {
            // Query users and populate the boards field
            const boards = await Board.find({
                members: req.user._id,
            }).populate({
                path: 'members',
                select: 'username first_name last_name email phone',
            }).populate({
                path: 'createdBy',
                select: 'username first_name last_name email phone',
            }).populate({
                path:'lists',
                select: 'title position',
                options: { sort: { position: 1 } },
                populate: {
                    path: 'cards',
                    options: { sort: { position: 1 } },
                }
            }).exec();

            // Send a JSON response with the retrieved boards
            res.status(200).json({
                status: true,
                data: boards
            });
        } catch (error) {
            // Handle any errors with a server error message
            res.status(500).json({
                message: "Server error.",
            });
        }
    }


    /**
     * Assigns members to a board.
     * Validates member existence, updates the board's members array, and logs the change if changeLog is enabled.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async assignMembers(req, res) {
        const { id, members } = req.body; // Destructure the board ID and members array from the request body
        const session = await mongoose.startSession(); // Start a new session
        session.startTransaction(); // Begin a transaction
    
        try {
            // Find the board document by ID using the session
            const board = await Board.findById(id).session(session);
            if (!board) {
                await session.abortTransaction(); // Abort the transaction if the board is not found
                session.endSession(); // End the session
                res.status(404).json({ // Return a 404 response
                    status: false,
                    message: 'Board not found.'
                });
                return; // Exit function
            }
    
            // Check if all specified users exist using the session
            const existingUsers = await User.find({ _id: { $in: members } }).session(session);
            if (existingUsers.length !== members.length) {
                await session.abortTransaction(); // Abort the transaction if some users do not exist
                session.endSession(); // End the session
                res.status(400).json({ // Return a 400 response
                    status: false,
                    message: 'One or more specified users do not exist.'
                });
                return; // Exit function
            }
    
            // Add the specified member IDs to the board's members array
            board.members.push(...members);
    
            // Push the board ID into the respective users' boards field using the session
            await User.updateMany(
                { _id: { $in: members } }, // Find users by their IDs
                { $push: { boards: id } }, // Push the board ID into their boards array
                { session } // Use the session
            );
    
            // Log the change if changeLog is enabled in the schema
            if (board.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `${this.model_name} model ${members.length > 1 ? 'members' : 'member'} added.`;
                await accountLog.saveLog("updated", board, req.user, message, session); // Pass the session to saveLog
            }
            
    
            // Save the board with the session
            await board.save({ session });
            await session.commitTransaction(); // Commit the transaction
            session.endSession(); // End the session
    
             res.status(200).json({ // Return a 200 response
                status: true,
                message: 'Members added successfully.',
                data:existingUsers
            });
        } catch (error) {
            await session.abortTransaction(); // Abort the transaction in case of error
            session.endSession(); // End the session
            res.status(500).json({ // Return a 500 response
                status: false,
                message: 'Server error.'
            });
        }
    }
    
    /**
     * Unassigns members from a board.
     * Validates member existence, updates the board's members array, and logs the change if changeLog is enabled.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async unAssignMembers(req, res) {
        const { id, members } = req.body; // Destructure the board ID and members array from the request body
        const session = await mongoose.startSession(); // Start a new session
        session.startTransaction(); // Begin a transaction
    
        try {
            // Find the board document by ID using the session
            const board = await Board.findById(id).session(session);
            if (!board) {
                await session.abortTransaction(); // Abort the transaction if board is not found
                session.endSession(); // End the session
                 res.status(404).json({ // Return a 404 response
                    status: false,
                    message: 'Board not found.'
                });
                return; // Exit function
            }
    
            // Check if the members to be removed exist in the board's members array
            const membersToRemove = members.filter(memberId => board.members.includes(memberId));
    
            if (membersToRemove.length === 0) {
                await session.abortTransaction(); // Abort the transaction if no members to remove
                session.endSession(); // End the session
                  res.status(400).json({ // Return a 400 response
                    status: false,
                    message: 'None of the specified members are in the board.'
                });
                return; // Exit function
            }
    
            // Remove the specified member IDs from the board's members array
            board.members.pull(...membersToRemove);
    
            // Pull the board ID from the respective users' boards field using the session
            await User.updateMany(
                { _id: { $in: membersToRemove } }, // Find users by their IDs
                { $pull: { boards: id } }, // Pull the board ID from their boards array
                { session } // Use the session
            );
    
            // Log the change if changeLog is enabled in the schema
            if (board.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `${this.model_name} model ${members.length > 1 ? 'members' : 'member'} removed.`;
                await accountLog.saveLog("updated", board, req.user, message, session); // Pass the session to saveLog
            }
    
            await board.save({ session }); // Save the board with the session
            await session.commitTransaction(); // Commit the transaction
            session.endSession(); // End the session
    
             res.status(200).json({ // Return a 200 response
                status: true,
                message: 'Members removed successfully.'
            });
        } catch (error) {
            await session.abortTransaction(); // Abort the transaction in case of error
            session.endSession(); // End the session
            res.status(500).json({ // Return a 500 response
                status: false,
                message: 'Server error.'
            });
        }
    }
    

    /**
     * Retrieves a specific board's information.
     * Populates the board with members, createdBy, lists, cards, labels , checklists and items.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @return {object} - Object containing fields information and the retrieved board's data
     */
    async view(req) {
        var obj = this.getModelObj(); // Get the model object
        let fields = obj.schema.customFields; // Get custom fields from the schema
        // Find the board document by slug and populate fields
        obj = await Models[this.model_name].findOne({ slug: req.params.id }).populate({
            path: 'members',
            select: 'username first_name last_name email phone',
        }).populate({
            path: 'createdBy',
            select: 'username first_name last_name email phone',
        }).populate({
            path:'lists',
            select: 'title position',
            options: { sort: { position: 1 } },
            populate: {
                path: "cards",
                select: "title position description deleted startDate dueDate cover_image attachments",
                options: { sort: { position: 1 } },
                populate: [
                    {
                    path: "labels",
                    select: "name color",
                    },
                    {
                        path: "checklists",
                        select: "title hidden",
                        populate: {
                            path: "items",
                            select: "title completed",
                        }
                    }
            ]
            }
        });

        // Return fields information and the retrieved board's data
        return {
            fields: fields,
            results: {
                result: obj,
            },
        };
    }



    /**
     * Retrieves a list of members excluding the current user.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response with a list of members or an error message
     */
    async members(req, res) {
        try {
            // Find members excluding the current user
            const members = await User.find(
                { _id: { $ne: req.user._id } }, // Exclude the current user
                { username: 1, first_name: 1, last_name: 1, email: 1, phone: 1 } // Select specific fields
            );

            // Respond with a 200 status and the retrieved members
            res.status(200).json({
                status: true,
                members: members
            });
        } catch (error) {
            // If an error occurs, respond with a 500 status and an error message
            res.status(500).json({
                status: false,
                message: 'Server error'
            });
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

module.exports = BoardsController;
