const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var ChecklistitemSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    checklists: { type: mongoose.Schema.Types.ObjectId, ref: 'checklist',required: true },
    completed: {
        type: Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

ChecklistitemSchema.plugin(mongoose_delete);
ChecklistitemSchema.plugin(mongoose_delete, { overrideMethods: "all" });

ChecklistitemSchema.fillable = ['title', 'checklists', 'completed'];
ChecklistitemSchema.changeLog = true;

ChecklistitemSchema.customFields = {
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
    "checklists": {
        "field_name": "checklists",
        "db_name": "checklists",
        "type": "objectId",
        "placeholder": "checklists",
        "listing": true,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
   
    "completed": {
        "field_name": "completed",
        "db_name": "completed",
        "type": "text",
        "placeholder": "completed",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    
}

module.exports = mongoose.model("checklistitem", ChecklistitemSchema);