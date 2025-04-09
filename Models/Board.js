const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var BoardSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true}],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'list'}],
    slug: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

BoardSchema.plugin(mongoose_delete);
BoardSchema.plugin(mongoose_delete, { overrideMethods: "all" });

BoardSchema.fillable = ['title', 'members', 'createdBy','slug'];
BoardSchema.changeLog = true;

BoardSchema.customFields = {
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
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "members": {
        "field_name": "members",
        "db_name": "members",
        "type": "array",
        "placeholder": "members",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "createdBy": {
        "field_name": "createdBy",
        "db_name": "createdBy",
        "type": "objectId",
        "placeholder": "createdBy",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "lists": {
        "field_name": "lists",
        "db_name": "lists",
        "type": "array",
        "placeholder": "lists",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "slug": {
        "field_name": "slug",
        "db_name": "slug",
        "type": "text",
        "placeholder": "slug",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    }
    
}

module.exports = mongoose.model("board", BoardSchema);