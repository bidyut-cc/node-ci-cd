const mongoose = require("mongoose");
const _ = require('lodash');
var mongoose_delete = require("mongoose-delete");
var CommentSchema = mongoose.Schema({
    comment: {
        type: String,
        required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
    card: { type: mongoose.Schema.Types.ObjectId, ref: 'card', required: true },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
CommentSchema.plugin(mongoose_delete);
CommentSchema.plugin(mongoose_delete, { overrideMethods: "all" });

CommentSchema.fillable = ['comment', 'user','card'];
CommentSchema.changeLog = true;

CommentSchema.customFields = {
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
    "comment": {
        "field_name": "comment",
        "db_name": "comment",
        "type": "text",
        "placeholder": "comment",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "user": {
        "field_name": "user",
        "db_name": "user",
        "type": "objectId",
        "placeholder": "user",
        "listing": false,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    },
    "card": {
        "field_name": "card",
        "db_name": "card",
        "type": "objectId",
        "placeholder": "card",
        "listing": false,
        "sort": false,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": false
    }
}



module.exports = mongoose.model("comment", CommentSchema);