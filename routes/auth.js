const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

// vc = verificationCode

router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.put('/verify/:vc', authController.verify);

router.put('/generatevcode', authController.generateVCode);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/changeforgotpassword', authController.changeForgotPassword);
router.post('/verifytoken', authController.verifyPasswordChangeToken);
module.exports = router;
