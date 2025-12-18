const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  packages: {
    type: String,
    required: true,
  },
  additionalservices: {
    type: [String],
    default: [],
  },
  hallname: {
    type: String,
    required: true,
  },
  packageprice: {
    type: Number,
    required: true,
  },
  additionalservicestotalprice: {
    type: Number,
    default: 0,
  },
  hallprice: {
    type: Number,
    required: true,
  },
  totalprice: {
    type: Number,
    required: true,
  },
  discountedTotal: {    // ✅ Added field
    type: Number,
    default: null,
  },
  phonenumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  payment: {
    type: String,
    required: true,
  },
  cardDetails: {
    type: Object,
    default: null,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);