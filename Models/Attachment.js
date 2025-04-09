const mongoose = require("mongoose");
const _ = require('lodash');
const List = require("./List");
var mongoose_delete = require("mongoose-delete");
const { asset } = require("../Helpers/Global");
var AttachmentSchema = mongoose.Schema({
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'model' // Reference to the associated document model
    },
    model: {
        type: String,
        required: true,
        enum: ['card']
    },
    attachment: {
        type: Object,
        get: function(cc) {
            return !_.isEmpty(cc) ? asset("/uploads/card/" + cc.filename) : asset("/uploads/card/default.png");
        },
        default: {},
    },
    createdAt: { type: Date, default: Date.now }
});
AttachmentSchema.plugin(mongoose_delete);
AttachmentSchema.plugin(mongoose_delete, { overrideMethods: "all" });

AttachmentSchema.set("toObject", { getters: true });
AttachmentSchema.set("toJSON", { getters: true });

AttachmentSchema.fillable = ['title', 'list', 'position'];

AttachmentSchema.customFields = {
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
        "db_name": "cotitlede",
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
    "card": {
        "field_name": "card",
        "db_name": "card",
        "type": "text",
        "placeholder": "card",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "attachment": {
        "field_name": "attachment",
        "db_name": "attachment",
        "type": "text",
        "placeholder": "attachment",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    
}



module.exports = mongoose.model("attachment", AttachmentSchema);