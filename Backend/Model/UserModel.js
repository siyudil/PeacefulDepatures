const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String, //dataType
        required: true, //validate
    },
    nickName: {
        type: String,
        required: false, //validate
    },
    DoB: {
        type: String,
        required: true, //validate
    },
    DoD: {
        type: String,
        required: true, //validate
    },
   
    Age: {
        type: Number,
        required: true, //validate      
    },
    address: {
        type: String,
        required: true, //validate
    },
    Fdate: {
        type: String,
        required: true, //validate
    },
    Ftime: {
        type: String,
        required: true, //validate
    },
    Fvenue: {
        type: String,
        required: true, //validate
    },
    BorC: {
        type: String,
        required: true, //validate
    },
    Tline: {
        type: String,
        required: false, //validate
    },
    Msg: {
        type: String,
        required: false, //validate
    },
    image: {
        type:String,
        required:false,
    },
    template: {
        type:String,
        required:true,
        default:"A",
        enum:["A","B","C"],
    },
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
});


module.exports = mongoose.model(
    "UserModel", //file name
    userSchema //schema name
)