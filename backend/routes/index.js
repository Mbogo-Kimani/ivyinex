const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/packages', require('./packages'));
router.use('/checkout', require('./checkout'));
router.use('/devices', require('./devices'));
router.use('/vouchers', require('./vouchers'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/admin', require('./admin'));
router.use('/mikrotik', require('./mikrotik'));
router.use('/points', require('./points'));
router.use('/email', require('./email'));
router.use('/ads', require('./ads'));
router.use('/messages', require('./messages'));
router.use('/analytics', require('./analytics'));


module.exports = router;
