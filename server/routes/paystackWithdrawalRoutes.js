const express = require('express');

const {
    withdrawFromWallet,
    resolveBankAccount
} = require('../controllers/paystackWithdrawalControllers');

const router = express.Router();

// =====================================================
// VERIFY A BANK ACCOUNT (real Paystack call, no money moves)
// =====================================================

router.post(
    '/resolve-account',
    resolveBankAccount
);

// =====================================================
// WITHDRAW MONEY FROM WALLET
// =====================================================

router.post(
    '/withdraw',
    withdrawFromWallet
);

module.exports = router;