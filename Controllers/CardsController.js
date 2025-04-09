const Controller = require("./Controller.js");
const User = require("../Models/User.js");
const _ = require("lodash");
const { Validator } = require('node-input-validator');
const List = require("../Models/List.js");
const Card = require("../Models/Card.js");
const Models = require("../Models");
const { default: mongoose } = require("mongoose");
const file_uploader = require("../Helpers/Uploader");
const Attachment = require("../Models/Attachment.js");
const AccountLog = require("../Helpers/AccountLog.js");

class CardsController extends Controller {
    constructor() {
        super("Card");
    }

    /**
     * Creates a new card and assigns it to a list.
     * Validates the input data, including the list ID, title, and position.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async save(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            listId: 'required', // listId is required
            title: 'required', // title is required
            position: 'required' // position is required
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
            // Start a session and begin a transaction
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Create a new Card document
                let card = new Card();
                card.title = req.body.title; // Set the title from the request body
                card.list = req.body.listId; // Set the list ID from the request body
                card.position = req.body.position; // Set the position from the request body
                
                // Update the List document to add the card's ID to the list's cards array
                await List.updateOne(
                    { _id: req.body.listId }, // Find the list by ID
                    { $push: { cards: card._id } }, // Push the new card's ID into the cards array
                    { session } // Use the session for the transaction
                );
                
                // Save the new card
                await card.save({ session });
                
                // If changeLog is enabled in the schema, log the creation event
                if (card.schema.changeLog) {
                    var accountLog = new AccountLog();
                    const message = `New ${this.model_name} created.`;
                    await accountLog.saveLog("saved", card, req.user, message, session); // Pass the session to saveLog
                }
                
                // Commit the transaction
                await session.commitTransaction();
                session.endSession(); // End the session

                // Respond with a success message
                res.status(200).json({
                    status: true,
                    message: "Card added successfully.",
                    data: card
                });
            } catch (error) {
                // If an error occurs, abort the transaction and end the session
                await session.abortTransaction();
                session.endSession();
                
                // Respond with a server error message
                res.status(500).json({
                    status: false,
                    message: "Server Error.",
                });
            }
        }
    }


    /**
     * Updates a specific field of a list.
     * Validates the input data, including file upload for 'cover_image' field.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async update(req, res) {
        const { id } = req.params; // Extract the list ID from the request parameters
        const { field, value } = req.body; // Extract the field to be updated and the new value from the request body

        // Construct validation rules dynamically
        let rules = {
            field: 'required', // The field name is required
        };

        // Conditionally add the value rule based on the field
        if (field === 'title' || field === 'description') {
            rules.value = 'required'; // Title or Description field requires a value
        } else if (field === 'cover_image') {
            // No validation needed for 'value' in case of file upload, handled separately
        } else {
            rules.value = 'required|array'; // Other fields require an array value
        }

        // Validate the input data
        const v = new Validator(req.body, rules); 

        // If field is 'cover_image', validate file upload separately
        if (field === 'cover_image' && _.isEmpty(req.files)) {
            // If cover image is required but not provided, respond with a 422 status and appropriate error message
            res.status(422).json({
                status: false,
                errors: { cover_image: ['Cover image is required.'] }
            });
            return ;
        }

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
                // Create the update object dynamically
                const update = {};

                // Handle file upload for 'cover_image' field
                if (field === 'cover_image' && req.files && req.files.value) {
                    // Handle file upload and set the 'cover_image' field to the uploaded file path
                    var uploaded_file = await file_uploader.upload(req.files, "card");
                    if (!uploaded_file.status) {
                        // If file upload fails, respond with an error message
                         res.status(200).json({
                            status: false,
                            message: uploaded_file.trace,
                        });
                        return; // Exit function
                    }
                    update[field] = uploaded_file.files.value; // Set the 'cover_image' field to the uploaded file path
                } else {
                    update[field] = value; // Set the 'field' to the provided 'value'
                }

                req.body = update; // Set the request body to the update object

                // Attempt to update the list using the inherited update method
               // const result = await super.update(req);
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
                    const message = `${this.model_name} model ${field} data updated.`
                    await accountLog.saveLog("updated", obj, req.user, message);
                }
                await obj.save();
                return {
                    status: true,
                    message: "Updated Successfully",
                    object: obj,
                };
            } catch (error) {
                return {
                    status: false,
                    message: error.message,
                };
            }
                // Respond with a 200 status and the result
                res.status(200).json(result);
            } catch (error) {
                // If an error occurs during the update process, log the error and respond with a 500 status and a server error message
                console.log(error);
                res.status(500).json({
                    status: false,
                    message: "Server Error.",
                });
            }
        }
    }

    /**
     * Retrieves a specific document by ID, including custom fields and related data.
     * Populates related fields: list, labels, checklists (with items), attachments and comments (with user).
     *
     * @param {object} req - The request object containing data from the client
     * @return {object} - An object containing custom fields and the retrieved document
     */
    async view(req) {
        // Get the model object
        var obj = this.getModelObj();

        // Retrieve custom fields from the schema
        let fields = obj.schema.customFields;

        // Find the document by ID and populate related fields
        obj = await eval(
            "Models." + this.model_name + ".findById('" + req.params.id + "')"
        ).populate({
            path: 'list', // Populate the 'list' field
            select: 'title position', // Select only the 'title' and 'position' fields of the list
        }).populate({
            path: 'labels', // Populate the 'labels' field
            select: 'name color', // Select only the 'name' and 'color' fields of the labels
        }).populate({
            path: 'checklists', // Populate the 'checklists' field
            select: 'title hidden', // Select only the 'title' and 'hidden' fields of the checklists
            populate: {
                path: 'items', // Populate the 'items' field within each checklist
                select: 'title completed', // Select only the 'title' and 'completed' fields of the items
            }
        }).populate({
            path: 'attachments', // Populate the 'attachments' field
            match: { model: 'card' }, // Filter attachments to only those related to the 'card' model
            select: 'attachment', // Select only the 'attachment' field
        }).populate({
            path: 'comments', // Populate the 'comments' field
            select: 'comment', // Select only the 'comment' field
            populate: {
                path: 'user', // Populate the 'user' field within each comment
                select: 'username first_name last_name', // Select only the 'username', first_name and last_name fields of the user
            }
        });

        // Return an object containing the custom fields and the retrieved document
        return {
            fields: fields,
            results: {
                result: obj, // The retrieved document with populated fields
            },
        };
    }

    /**
     * Removes specified labels from a card.
     * Validates input data and handles errors appropriately.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async removeLabels(req, res) {
        const { id, labels } = req.body; // Destructure card ID and labels from request body

        try {
            // Find the card document by ID
            const card = await Card.findById(id);
            if (!card) {
                // If card is not found, respond with a 404 status and appropriate error message
                res.status(404).json({
                    status: false,
                    message: 'Card not found.'
                });
                return; // Exit function
            }

            // Check if the labels to be removed exist in the card's labels array
            const labelsToRemove = labels.filter(labelId => card.labels.includes(labelId));

            if (labelsToRemove.length === 0) {
                // If none of the specified labels are in the card, respond with a 400 status and appropriate error message
                res.status(400).json({
                    status: false,
                    message: 'None of the specified labels are in the card.'
                });
                return; // Exit function
            }

            // Remove the specified labels from the card's labels array
            card.labels.pull(...labelsToRemove);

            // Log the change if changeLog is enabled in the schema
            if (card.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `${this.model_name} model ${labelsToRemove.length > 1 ? 'labels' : 'label'} removed.`;
                await accountLog.saveLog("updated", card, req.user, message); // Log the change
            }

            await card.save(); // Save the card
            // Respond with a 200 status and success message
            res.status(200).json({
                status: true,
                message: 'Labels removed successfully'
            });
        } catch (error) {
            // If an error occurs, log it and respond with a 500 status and server error message
            console.log(error);
            res.status(500).json({
                status: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Adds attachments to a card.
     * Validates input data, including the existence of the card and uploaded files.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async addAttachments(req, res) {
        const { id } = req.body; // Destructure card ID from request body

        // Validate the input data
        const v = new Validator(req.body, {
            id: 'required', // Card ID is required
        });
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
             res.status(422).json({
                status: false,
                errors: v.errors
            });
        }

        // Start a new session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the card document by ID using the session
            const card = await Card.findById(id).session(session);
            if (!card) {
                // If card is not found, abort transaction, end session, and return a 404 response
                await session.abortTransaction();
                session.endSession();
                res.status(404).json({
                    status: false,
                    message: 'Card not found.'
                });
                return; // Exit function
            }

            // Check if files are uploaded
            if (!req.files || _.isEmpty(req.files)) {
                // If no files are uploaded, abort transaction, end session, and return a 400 response
                await session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    status: false,
                    message: 'No files uploaded.'
                });
                return; // Exit function
            }

            const attachmentIds = [];

            // Loop through each uploaded file
            for (let file of Object.values(req.files)) {
                file = Array.isArray(file) ? file : [file];
                // Upload the file
                const uploadedFile = await file_uploader.upload(file, "card");
                if (!uploadedFile.status) {
                    // If file upload fails, abort transaction, end session, and return an error response
                    await session.abortTransaction();
                    session.endSession();
                    res.status(200).json({
                        status: false,
                        message: uploadedFile.trace,
                    });
                    return; // Exit function
                }

                // Create attachment documents for each uploaded file
                for (const file of Object.values(uploadedFile.files)) {
                    const attachment = new Attachment({
                        modelId: id,
                        model: 'card',
                        attachment: file,
                    });

                    // Save the attachment with the session
                    await attachment.save({ session });
                    attachmentIds.push(attachment._id);
                }
            }

            // Add the attachment IDs to the card's attachments array
            card.attachments.push(...attachmentIds);

            // Log the change if changeLog is enabled in the schema
            if (card.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `${this.model_name} model ${attachmentIds.length > 1 ? 'attachments' : 'attachment'} added.`;
                await accountLog.saveLog("updated", card, req.user, message, session);
            }

            // Save the card with the session
            await card.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            req.params.id=id;
            // Respond with a 200 status and success message
             res.status(200).json({
                status: true,
                message: 'Attachments uploaded successfully.',
                data: await this.view(req)
            });
        } catch (error) {
            // If an error occurs, abort transaction, end session, log the error, and return a 500 response
            await session.abortTransaction();
            session.endSession();
            console.error('Error adding attachments:', error);
             res.status(500).json({ status: false, message: 'Server Error.' });
        }
    }


    /**
     * Removes attachments from a card.
     * Validates input data, including the existence of the card and specified attachments.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async removeAttachments(req, res) {
        const { id, attachments } = req.body;
        // Validate the input data
        const v = new Validator(req.body, {
            id: 'required', // Card ID is required
            attachments: 'required|array' // Attachments should be an array and required
        });
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
            res.status(422).json({
                status: false,
                errors: v.errors
            });
            return; // Exit function
        }
            // Start a new session for transaction
            const session = await mongoose.startSession();
            session.startTransaction();
        try {
            // Find the card document by ID
            const card = await Card.findById(id).session(session);
            if (!card) {
                // If card is not found, abort transaction, end session, and return a 404 response
                await session.abortTransaction();
                session.endSession();
                 res.status(404).json({
                    status: false,
                    message: 'Card not found.'
                });
                return; // Exit function
            }

            // Check if the attachments to be removed exist in the card's attachments array
            const attachmentsToRemove = attachments.filter(attachmentId => card.attachments.includes(attachmentId));

            if (attachmentsToRemove.length === 0) {
                // If none of the specified attachments are in the card, return a 400 response
                await session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    status: false,
                    message: 'None of the specified attachments are in the card.'
                });
                return; // Exit function
            }

            // Remove the specified attachment IDs from the card's attachments array
            card.attachments.pull(...attachmentsToRemove);
             // Log the change if changeLog is enabled in the schema
             if (card.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `${this.model_name} model ${attachmentsToRemove.length > 1 ? 'attachments' : 'attachment'} removed.`;
                await accountLog.saveLog("updated", card, req.user, message, session); // Pass the session to saveLog
            }
            await card.save({ session }); // Save the card with the session

            // Delete associated attachments
            await Attachment.delete({ _id: { $in: attachmentsToRemove }, model: 'card' }).session(session);

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            // Respond with a 200 status and success message
            res.status(200).json({
                status: true,
                message: 'Attachments removed successfully.'
            });
        } catch (error) {
            // If an error occurs, abort transaction, end session, log the error, and return a 500 response
            await session.abortTransaction();
            session.endSession();
            console.error('Error removing attachments:', error);
             res.status(500).json({
                status: false,
                message: 'Server error.'
            });
        }
    }

    /**
     * Moves a card within a list by swapping its position with another card.
     * Validates input data, including the existence of both cards and their positions within the same list.
     * Handles errors with appropriate status codes and messages.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async moveWithInList(req, res) {
        // Validate the input data
        const v = new Validator(req.body, {
            sourceCardId: 'required', // Source card ID is required
            targetCardId: 'required'  // Target card ID is required
        });
        const matched = await v.check();
        if (!matched) {
            // If validation fails, respond with a 422 status and the validation errors
            res.status(422).json({
                status: false,
                errors: v.errors
            });
            // return; // Exit function
        } else {
            const { sourceCardId, targetCardId } = req.body;
            // Start a new session for transaction
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Find the source card
                const card1 = await Card.findById(new mongoose.Types.ObjectId(sourceCardId)).session(session);
                if (!card1) {
                    res.status(404).json({
                        status: true,
                        message: "Source card not found."
                    });
                    return; // Exit function
                }

                // Find the target card
                const card2 = await Card.findById(new mongoose.Types.ObjectId(targetCardId)).session(session);
                if (!card2) {
                    res.status(404).json({
                        status: true,
                        message: "Target card not found."
                    });
                    return; // Exit function
                }

                // Check if both cards belong to the same list
                if (!card1.list.equals(card2.list)) {
                    res.status(404).json({
                        status: true,
                        message: "Cards are not in the same list."
                    });
                    return; // Exit function
                }

                const card1Position = card1.position;
                const card2Position = card2.position;
                // Swap the positions
                const tempPosition = card1.position;
                card1.position = card2.position;
                card2.position = tempPosition;

                // Log the changes for both cards if changeLog is enabled
                if (card1.schema.changeLog) {
                    const accountLog1 = new AccountLog();
                    const message1 = `Update position from ${card1Position} to ${card2Position} with in list`;
                    await accountLog1.saveLog("updated", card1, req.user, message1, session);
                }
                // if (card2.schema.changeLog) {
                //     const accountLog2 = new AccountLog();
                //     const message2 = `Update position from ${card2Position} to ${card1Position}`;
                //     await accountLog2.saveLog("updated", card2, req.user, message2, session);
                // }

                // Save the updated cards
                await card1.save({ session });
                await card2.save({ session });

                // Commit the transaction and end the session
                await session.commitTransaction();
                session.endSession();
                res.status(200).json({
                    status: true,
                    message: "Card moved successfully."
                });
            } catch (error) {
                // If an error occurs, abort the transaction, end the session, and return a 500 response
                await session.abortTransaction();
                session.endSession();
                res.status(500).json({
                    message: 'Server Error.',
                });
            }
        }
    }

    /**
     * Moves a card from one list to another within the same board.
     * Validates input data, including the existence of both cards and their lists.
     * Updates positions of cards within lists accordingly.
     * Handles errors with appropriate status codes and messages.
     *
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async moveBetweenList(req, res) {
        const { sourceCardId, targetCardId, tagetListId } = req.body;
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            
           // Find the source card
           const card1 = await Card.findById(new mongoose.Types.ObjectId(sourceCardId)).session(session);
           if (!card1) {
               res.status(404).json({
                status: true,
                message: "Source card not found."
            }); 
            return; // Exit function
           }
           if(targetCardId){
           // Find the target card
           const card2 = await Card.findById(new mongoose.Types.ObjectId(targetCardId)).session(session);
           if (!card2) {
                res.status(404).json({
                    status: true,
                    message: "Target card not found."
                }); 
                return; // Exit function
           } 
            // Push source card ID to target list's cards array  
               await List.updateOne(
                { _id: new mongoose.Types.ObjectId(card2.list) },
                { $push: { cards: card1._id }},
                { session }
            );
           // Pull target card ID from source list's cards array
             await List.updateOne(
                { _id: new mongoose.Types.ObjectId(card1.list) },
                { $pull: { cards: card1._id} },
                { session }
            );

            const card1Position = card1.position;
            const card2Position = card2.position;

        // Update positions in the first card's list
        const list1Cards = await Card.find({ list: card1.list, _id: { $ne: card1._id } }).sort({ position: 1 }).session(session);
       
            for (let i = 0; i < list1Cards.length; i++) {
                list1Cards[i].position = i +1 ;
                await list1Cards[i].save({ session });
            }
           // Move the source card to the target list
            card1.position = card2.position;
            card1.list = card2.list;
            
            // Move the target card to the source list
            card2.list = card1.list;

            // Log the changes for both cards if changeLog is enabled
            if (card1.schema.changeLog) {
                const accountLog1 = new AccountLog();
                const message1 = `Update position from ${card1Position} to ${card2Position} between list`;
                await accountLog1.saveLog("updated", card1, req.user, message1, session);
            }

            // Save the updated cards
            await card1.save({ session });
            await card2.save({ session });

            // Update positions in the second card's list
            let lastPosition = card2.position;
            const list2Cards = await Card.find({ list: card2.list, _id: { $ne: card1._id }, position: { $gte: card2.position } }).sort({ position: 1 }).session(session);
           
            for (let j = 0; j < list2Cards.length; j++) {
                lastPosition++;
                list2Cards[j].position = lastPosition;
                await list2Cards[j].save({ session });
            }
        }else{
              // Find the target list
           const list = await List.findById(new mongoose.Types.ObjectId(tagetListId)).session(session);
           if (!list) {
                res.status(404).json({
                    status: true,
                    message: "Target list not found."
                }); 
                return; // Exit function
           } 
           // Push source card ID to target list's cards array  
           await List.updateOne(
            { _id: new mongoose.Types.ObjectId(tagetListId) },
            { $push: { cards: card1._id }},
            { session }
             );
              // Pull target card ID from source list's cards array
              await List.updateOne(
                { _id: new mongoose.Types.ObjectId(card1.list) },
                { $pull: { cards: card1._id} },
                { session }
            );
            const card1Position = card1.position;
            // Move the source card to the target list
            card1.position = 1;
            card1.list = tagetListId;
              // Log the changes for both cards if changeLog is enabled
              if (card1.schema.changeLog) {
                const accountLog1 = new AccountLog();
                const message1 = `Update position from ${card1Position} to 1 between list`;
                await accountLog1.saveLog("updated", card1, req.user, message1, session);
            }
            // Save the updated cards
            await card1.save({ session });
           
        }
         

            await session.commitTransaction();
            session.endSession();
    
            res.status(200).json({
                status: true,
                message: "Card moved successfully."
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Updates the dates of a card including start date, due date, and notification settings.
     * 
     * @param {object} req - The request object containing data from the client
     * @param {object} res - The response object to send data back to the client
     * @return {json} - JSON response indicating success or failure
     */
    async updateCardDates(req,res){
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
                    const message = `${this.model_name} model dates updated.`
                    await accountLog.saveLog("updated", obj, req.user, message);
                }
                await obj.save();
                return {
                    status: true,
                    message: "Updated Successfully",
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

    async removeCoverImage(req,res){
        try {
            // Find the card document by ID
            const card = await Card.findById(req.params.id);
            if (!card) {
                // If card is not found, respond with a 404 status and appropriate error message
                res.status(404).json({
                    status: false,
                    message: 'Card not found.'
                });
                return; // Exit function
            }
            card.cover_image={}
            // Log the change if changeLog is enabled in the schema
            if (card.schema.changeLog) {
                const accountLog = new AccountLog();
                const message = `Cover image removed.`;
                await accountLog.saveLog("updated", card, req.user, message); // Log the change
            }

            await card.save(); // Save the card
            // Respond with a 200 status and success message
            res.status(200).json({
                status: true,
                message: 'Cover image removed successfully'
            });
        } catch (error) {
            // If an error occurs, log it and respond with a 500 status and server error message
            console.log(error);
            res.status(500).json({
                status: false,
                message: 'Server error'
            });
        }
    }
    


}

module.exports = CardsController;
