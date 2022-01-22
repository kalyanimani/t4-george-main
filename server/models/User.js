const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema

const UserSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    mobile: {
        type: String,
        required: true
    },
    photo: {
        type: String,
    },
    origin: {
        type: String,
        // required:true
    },
    deviceID: {
        type: String,
    },
    socketID: {
        type: String,
    },
    // status:{
    //     type:String,
    //     required:true
    // },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    quickbooksID: {
        type: String
    }
});

module.exports = User = mongoose.model('users', UserSchema);
