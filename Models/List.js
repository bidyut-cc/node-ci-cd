const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var ListSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    boards: { type: mongoose.Schema.Types.ObjectId, ref: 'board', required: true},
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'card' }],
    position: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

ListSchema.plugin(mongoose_delete);
ListSchema.plugin(mongoose_delete, { overrideMethods: "all" });

ListSchema.fillable = ['title', 'boards', 'position'];
ListSchema.changeLog = true;

ListSchema.customFields = {
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
    "boards": {
        "field_name": "boards",
        "db_name": "boards",
        "type": "objectId",
        "placeholder": "boards",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "cards": {
        "field_name": "cards",
        "db_name": "cards",
        "type": "array",
        "placeholder": "cards",
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
    
}

module.exports = mongoose.model("list", ListSchema);