const express = require('express');

const {
    initializeContributionPayment,
    verifyContributionPayment
} = require('../controllers/paystackContribution');

const router = express.Router();

router.post('/initialize',initializeContributionPayment);
router.get('/verify/:reference',verifyContributionPayment);


module.exports = router;