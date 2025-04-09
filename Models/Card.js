const mongoose = require("mongoose");
const _ = require('lodash');
const List = require("./List");
var mongoose_delete = require("mongoose-delete");
const { asset } = require("../Helpers/Global");
var CardSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'list' },
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'label' }],
    checklists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'checklist' }],
    cover_image: {
        type: Object,
        get: function(cc) {
            return !_.isEmpty(cc) ? asset("/uploads/card/" + cc.filename) : asset("/uploads/card/default.png");
        },
        default: {},
    },
    description: {
        type: String, 
        required: false,
        get: function(desc) {
            return !_.isEmpty(desc) ? desc : '';
        },
    },
    position: {
        type: Number,
        required: true
    },
   attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'attachment' }],
   comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
   startDate: {
        type: Date,
        required: false,
        default: null
    },
   dueDate: {
        type: Date,
        required: false,
        default: null
    },
   notifyBefore: {
        type: Number, // Number of hours before dueDate
        required: false,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
CardSchema.plugin(mongoose_delete);
CardSchema.plugin(mongoose_delete, { overrideMethods: "all" });

CardSchema.set("toObject", { getters: true });
CardSchema.set("toJSON", { getters: true });

CardSchema.fillable = ['title', 'list', 'labels', 'checklists', 'cover_image', 'description', 'position','attachments','comments','startDate','dueDate','notifyBefore'];
CardSchema.changeLog = true;

// CardSchema.virtual('files', {
//     ref: 'attachment', // Model to populate
//     localField: '_id', // Field in BlogPost model
//     foreignField: 'modelId', // Field in Comment model
//     justOne: false // Set to false to populate an array of comments
//   });

CardSchema.customFields = {
    "_id": {
        "field_name": "_id",
        "db_name": "_id",
        "type": "text",
        "placeholder": "Id",
        "listing": true,
        "show_in_form": false,
        "sort": true,
        "default_sort": true,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "title": {
        "field_name": "title",
        "db_name": "title",
        "type": "text",
        "placeholder": "title",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "list": {
        "field_name": "list",
        "db_name": "list",
        "type": "text",
        "placeholder": "list",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "labels": {
        "field_name": "labels",
        "db_name": "labels",
        "type": "array",
        "placeholder": "labels",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "checklists": {
        "field_name": "checklists",
        "db_name": "checklists",
        "type": "array",
        "placeholder": "checklists",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "cover_image": {
        "field_name": "cover_image",
        "db_name": "cover_image",
        "type": "object",
        "placeholder": "cover_image",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "description": {
        "field_name": "description",
        "db_name": "description",
        "type": "text",
        "placeholder": "description",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "position": {
        "field_name": "position",
        "db_name": "position",
        "type": "text",
        "placeholder": "position",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "attachments": {
        "field_name": "attachments",
        "db_name": "attachments",
        "type": "text",
        "placeholder": "attachments",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "comments": {
        "field_name": "comments",
        "db_name": "comments",
        "type": "text",
        "placeholder": "comments",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "startDate": {
        "field_name": "startDate",
        "db_name": "startDate",
        "type": "Date",
        "placeholder": "startDate",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "dueDate": {
        "field_name": "dueDate",
        "db_name": "dueDate",
        "type": "Date",
        "placeholder": "dueDate",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "notifyBefore": {
        "field_name": "notifyBefore",
        "db_name": "notifyBefore",
        "type": "Number",
        "placeholder": "notifyBefore",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
 
    
}

CardSchema.post('remove', async function(next) {
    try {
        // Remove this card from the associated list's cards array
        await List.updateOne(
            { _id: this.list }, 
            { $pull: { cards: this._id } }
        );
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("card", CardSchema);