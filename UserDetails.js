const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
    name: String,
    email: {type: String, required: true},
    mobile: {type: String, required: true},
    password: String,

},{
    collection: "UserInfo",
});

mongoose.model("UserInfo", UserDetailsSchema);