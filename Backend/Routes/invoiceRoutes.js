const express = require("express");
const router = express.Router();
const invoiceController = require("../Controllers/invoiceControllers");

router.get("/", invoiceController.getAllinvoices);
router.post("/", invoiceController.addinvoices);
router.get("/:id", invoiceController.getById);
router.put("/:id", invoiceController.updateinvoice);
router.delete("/:id", invoiceController.deleteinvoice);
router.put("/:id/status", invoiceController.updateInvoiceStatus);



module.exports = router;