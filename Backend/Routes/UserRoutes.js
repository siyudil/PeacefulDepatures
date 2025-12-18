const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController');

//user
router.get("/", userController.getAllUsers);
router.post("/",userController.upload.single("image"), userController.AddUsers);
router.get("/:id", userController.getById);
router.put("/:id",userController.upload.single("image"), userController.updateUser);
router.delete("/:id", userController.deleteUser);


//export
module.exports = router;