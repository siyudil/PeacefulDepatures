const User = require('../Model/UserModel');
const multer = require("multer");
const Notification = require("../Model/NotificationModel");

// Multer setup
const storageimg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder name
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG allowed!'), false);
  }
};

const upload = multer({ storage: storageimg, fileFilter });


// ====== CONTROLLERS ======

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({status: "approved"});
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add user
const addUsers = async (req, res) => {
  const { name, nickName, Age, address, DoB, DoD, Fdate, Ftime, Fvenue, BorC, Tline, Msg } = req.body;
  const imageName = req.file ? req.file.filename : null;

  try {
    const user = new User({
      name,
      nickName,
      Age,
      address,
      DoB,
      DoD,
      Fdate,
      Ftime,
      Fvenue,
      BorC,
      Tline,
      Msg,
      image: imageName,
      status: "pending",
    });
    await user.save();

    // ✅ Create notification BEFORE sending response
    await new Notification({
      userId: user._id,
      userName: user.name,
      category: "Obituary",
      title: "Submission Received",
      message: "Your obituary submission is pending approval.",
      relatedId: String(user._id),
    }).save();

    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to add user" });
  }
};


// Get by id
const getById = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
       { $inc: { views: 1 } },   // increment views
       { new: true }
    );
    if (!user) return res.status(404).json({ message: "No user found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { name, nickName, Age, address, DoB, DoD, Fdate, Ftime, Fvenue, BorC, Tline, Msg } = req.body;

  try {
    const updateData = { name, nickName, Age, address, DoB, DoD, Fdate, Ftime, Fvenue, BorC, Tline, Msg };
    if (req.file) updateData.image = req.file.filename;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ message: "Unable to update user" });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Unable to delete user" });
    return res.status(200).json({ message: "User successfully deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Approve obituary
const approveObituary = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    // ✅ Save notification for user
    await new Notification({
      userId: updated._id,
      userName: updated.name,
      category: "Obituary",
      title: "Obituary Approved",
      message: "Your obituary has been approved by the admin.",
      relatedId: String(updated._id),
    }).save();

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error approving obituary" });
  }
};


// Reject obituary
const rejectObituary = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    // ✅ Save notification for user
    await new Notification({
      userId: updated._id,
      userName: updated.name,
      category: "Obituary",
      title: "Obituary Rejected",
      message: "Your obituary has been rejected by the admin.",
      relatedId: String(updated._id),
    }).save();

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error rejecting obituary" });
  }
};




// Get Top 5 most viewed obituaries
const getTopViewed = async (req, res) => {
  try {
    const topViewed = await User.find({ status: "approved" })
      .sort({ views: -1 })  // sort by views, highest first
      .limit(5);

    if (!topViewed || topViewed.length === 0) {
      return res.status(404).json({ message: "No obituaries found" });
    }
    return res.status(200).json(topViewed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching top viewed obituaries" });
  }
};





// Export
exports.upload = upload;
exports.getAllUsers = getAllUsers;
exports.AddUsers = addUsers;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.approveObituary = approveObituary;
exports.rejectObituary = rejectObituary;
exports.getTopViewed = getTopViewed;