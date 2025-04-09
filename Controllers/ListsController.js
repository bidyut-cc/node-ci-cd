const Controller = require("./Controller.js");
const User = require("../Models/User");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
const List = require("../Models/List.js");
const Board = require("../Models/Board.js");
const Models = require("../Models");
const { ObjectId } = require('mongodb');
const { default: mongoose } = require("mongoose");
const AccountLog = require("../Helpers/AccountLog.js");

class ListsController extends Controller {
    constructor() {
        super("List");
    }

    /**
     * Adds a new list.
     * Validates the input data, specifically the title, boardId, and position.
     * Creates a new list, updates the corresponding board, and logs the creation event if changeLog is enabled.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        const v = new Validator(req.body, {
            title: 'required', // Title is required
            boardId: 'required', // Board ID is required
            position: 'required' // Position is required
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
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Create a new List document
                let list = new List;
                list.title = req.body.title; // Set the title from the request body
                list.boards = req.body.boardId; // Set the board ID from the request body
                list.position = req.body.position; // Set the position from the request body

                // Update the corresponding board to add the new list's ID
                await Board.updateOne(
                    { _id: req.body.boardId }, // Find the board by its ID
                    { $push: { lists: list._id } }, // Push the new list's ID into the lists array
                    { session } // Use the session for the transaction
                );

                // Save the new list
                await list.save({ session });

                // If changeLog is enabled in the schema, log the creation event
                if (list.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `New ${this.model_name} created.`
                    await accountLog.saveLog("saved", list, req.user, message, session); // Pass the session to saveLog
                }

                await session.commitTransaction(); // Commit the transaction
                session.endSession(); // End the session

                // Respond with a success message
                res.status(200).json({
                    status: true,
                    message: "List added successfully.",
                    data: list
                });
            } catch (error) {
                // If an error occurs, abort the transaction and end the session
                await session.abortTransaction();
                session.endSession();

                // Respond with a server error message
                res.status(500).json({
                    message: "Server Error.",
                });
            }
        }
    }

    /**
     * Updates a list's information.
     * Validates the input data, including the required fields.
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
     * Retrieves information about a specific list.
     * Retrieves the list document by its ID, populates related fields, and returns the result.
     * 
     * @param {object} req - The request object containing data from the client
     * @return {object} - An object containing the fields and the result of the view operation
     */
    async view(req) {
        var obj = this.getModelObj(); // Get the model object
        let fields = obj.schema.customFields; // Get the custom fields from the schema

        // Retrieve the list document by its ID, populate related fields, and execute the query
        obj = await eval(
            "Models." + this.model_name + ".findById('" + req.params.id + "')"
        ).populate({
            path:'boards', // Populate the 'boards' field
            select: 'title', // Select the 'title' field of boards
        }).populate({
            path:'cards', // Populate the 'cards' field
            select : 'title position cover_image ', // Select specific fields of cards
            options: { sort: { position: 1 } }, // Sort the cards by position in ascending order
            populate: {
                path: 'labels' // Populate the 'labels' field of cards
            }
        }).exec();

        // Return an object containing the fields and the result of the view operation
        return {
            fields: fields,
            results: {
                result: obj,
            },
        };
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

    /**
     * Moves a list from a source position to a target position.
     * Validates the input data and checks if the lists exist and belong to the same board.
     * Swaps the positions of the lists and saves the changes.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async move(req,res){
        const { sourceListId, targetListId } = req.body; // Destructure the source and target list IDs from the request body
        const session = await mongoose.startSession(); // Start a new session
        session.startTransaction(); // Begin a transaction
        try {
           // Find the source list by its ID
           const list1 = await List.findById(new mongoose.Types.ObjectId(sourceListId)).session(session);
           if (!list1) {
            // If source list not found, respond with a 404 status and a message
               res.status(404).json({
                status: true,
                message: "Source list not found."
            }); 
            return; // Exit function
           }
   
           // Find the target list by its ID
           const list2 = await List.findById(new mongoose.Types.ObjectId(targetListId)).session(session);
           if (!list2) {
            // If target list not found, respond with a 404 status and a message
                res.status(404).json({
                    status: true,
                    message: "Target list not found."
                }); 
                return; // Exit function
           }
   
           // Check if both lists belong to the same board
           if (!list1.boards.equals(list2.boards)) {
             // If lists are not in the same board, respond with a 404 status and a message
               res.status(404).json({
                status: true,
                message: "Lists are not in the same board."
            }); 
            return; // Exit function
           }
           
           const list1Position = list1.position;
           const list2Position = list2.position;
            // Swap the positions of the lists
            const tempPosition = list1.position;
            list1.position = list2.position;
            list2.position = tempPosition;
            // Log the changes for both lists
            if (list1.schema.changeLog) {
                const accountLog1 = new AccountLog();
                const message1= `Update position from ${list1Position} to ${list2Position}`;
                await accountLog1.saveLog("updated", list1, req.user, message1, session);
            }
            // if (list2.schema.changeLog) {
            //     const accountLog2 = new AccountLog();
            //     const message2= `Update position from ${list2Position} to ${list1Position}`;
            //     await accountLog2.saveLog("updated", list2, req.user, message2, session);
            // }      
           // Save the updated lists
           await list1.save({ session });
           await list2.save({ session });
       

        await session.commitTransaction(); // Commit the transaction
        session.endSession(); // End the session
      // Respond with a success message
        res.status(200).json({
            status: true,
            message: "List moved successfully."
        }); 
    } catch(error) {
       // If an error occurs, abort the transaction and end the session
       await session.abortTransaction();
       session.endSession();

       // Respond with a 500 status and an error message
       res.status(500).json({
           message: 'Server Error.',
       });
    }

    }
   


}

module.exports = ListsController;
