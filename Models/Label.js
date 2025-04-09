const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var LabelSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    color: {
        type: String, 
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
LabelSchema.plugin(mongoose_delete);
LabelSchema.plugin(mongoose_delete, { overrideMethods: "all" });

LabelSchema.fillable = ['name', 'color'];
LabelSchema.changeLog = true;

LabelSchema.customFields = {
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
    "name": {
        "field_name": "name",
        "db_name": "name",
        "type": "text",
        "placeholder": "name",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "color": {
        "field_name": "color",
        "db_name": "color",
        "type": "text",
        "placeholder": "color",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    }
}



module.exports = mongoose.model("label", LabelSchema);