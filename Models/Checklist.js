const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var ChecklistSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    cards: { type: mongoose.Schema.Types.ObjectId, ref: 'card',required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'checklistitem',required: false }],
    hidden: {
        type: Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

ChecklistSchema.plugin(mongoose_delete);
ChecklistSchema.plugin(mongoose_delete, { overrideMethods: "all" });

ChecklistSchema.fillable = ['title', 'cards', 'items', 'hidden'];
ChecklistSchema.changeLog = true;

ChecklistSchema.customFields = {
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
    "cards": {
        "field_name": "cards",
        "db_name": "cards",
        "type": "text",
        "placeholder": "cards",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "items": {
        "field_name": "items",
        "db_name": "items",
        "type": "text",
        "placeholder": "items",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "hidden": {
        "field_name": "hidden",
        "db_name": "hidden",
        "type": "text",
        "placeholder": "hidden",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    
}

module.exports = mongoose.model("checklist", ChecklistSchema);