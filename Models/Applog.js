const mongoose = require("mongoose");
const _ = require('lodash');
var ApplogSchema = mongoose.Schema({
    clientId: {
        type: String,
        required: true
    },
    customerId: {
        type: String,
        required: false
    },
    appIdentifier: {
        type: String,
        required: false
    },
    appVersion: {
        type: String,
        required: false
    },
    loginTime: {
        type: Date,
        required: false
    }
});

ApplogSchema.fillable = ['clientId', 'customerId', 'appIdentifier', 'appVersion', 'loginTime'];

ApplogSchema.customFields = {
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
    "clientId": {
        "field_name": "clientId",
        "db_name": "clientId",
        "type": "Number",
        "placeholder": "clientId",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "customerId": {
        "field_name": "customerId",
        "db_name": "customerId",
        "type": "Number",
        "placeholder": "customerId",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": true,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "appIdentifier": {
        "field_name": "appIdentifier",
        "db_name": "appIdentifier",
        "type": "text",
        "placeholder": "appIdentifier",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "appVersion": {
        "field_name": "appVersion",
        "db_name": "appVersion",
        "type": "text",
        "placeholder": "appVersion",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": true
    },
    "loginTime": {
        "field_name": "loginTime",
        "db_name": "loginTime",
        "type": Date,
        "placeholder": "loginTime",
        "listing": true,
        "sort": true,
        "default_sort": false,
        "required": false,
        "value": "",
        "width": "50",
        "searchable": true
    }
}

module.exports = mongoose.model("applog", ApplogSchema);