const Invoice = require("../Model/invoiceModel");

// ✅ Get all invoices
const getAllinvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.status(200).json({ invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add new invoice
const addinvoices = async (req, res) => {
  const {
    name,
    email,
    packages,
    additionalservices,
    hallname,
    packageprice,
    additionalservicestotalprice,
    hallprice,
    phonenumber,
    address,
    payment,
    totalprice,
    discountedTotal, // ✅ include discountedTotal
    cardDetails,
    status = "Pending", // ✅ default status
  } = req.body;

  try {
    const invoice = new Invoice({
      name,
      email,
      packages,
      additionalservices,
      hallname,
      packageprice,
      additionalservicestotalprice,
      hallprice,
      phonenumber,
      address,
      payment,
      totalprice,
      discountedTotal, // ✅ save discountedTotal
      status,
      cardDetails: payment === "Credit Card" ? cardDetails : null,
    });

    await invoice.save();
    res.status(201).json({ invoice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get invoice by ID
const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update invoice
const updateinvoice = async (req, res) => {
  const {
    name,
    email,
    packages,
    additionalservices,
    hallname,
    packageprice,
    additionalservicestotalprice,
    hallprice,
    phonenumber,
    address,
    payment,
    totalprice,
    discountedTotal, // ✅ include discountedTotal
    cardDetails,
    status, // ✅ include status if provided
  } = req.body;

  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        packages,
        additionalservices,
        hallname,
        packageprice,
        additionalservicestotalprice,
        hallprice,
        phonenumber,
        address,
        payment,
        totalprice,
        discountedTotal,
        status,
        cardDetails: payment === "Credit Card" ? cardDetails : null,
      },
      { new: true }
    );

    if (!invoice)
      return res.status(404).json({ message: "Unable to update invoice" });

    res.status(200).json({ invoice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete invoice
const deleteinvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice)
      return res.status(404).json({ message: "Unable to delete invoice" });

    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update only invoice status (Approve / Reject)
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Status updated successfully", invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ✅ Exports
exports.getAllinvoices = getAllinvoices;
exports.addinvoices = addinvoices;
exports.getById = getById;
exports.updateinvoice = updateinvoice;
exports.deleteinvoice = deleteinvoice;
exports.updateInvoiceStatus = updateInvoiceStatus;