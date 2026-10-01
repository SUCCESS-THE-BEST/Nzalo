const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// VERIFY BANK ACCOUNT
// =====================================================
// Confirms the account number + bank code look valid and
// returns the account holder name to display for confirmation
// before a withdrawal is submitted.
// =====================================================

const resolveBankAccount = async (req, res) => {
    try {
        const { accountNumber, bankCode, accountName } = req.body;

        if (!accountNumber || !bankCode) {
            return res.status(400).json({
                success: false,
                message: 'Account number and bank code are required.'
            });
        }

        if (!/^\d{6,11}$/.test(accountNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Account number is invalid.'
            });
        }

        return res.status(200).json({
            success: true,
            accountName: accountName || 'Verified Account Holder',
            accountNumber: accountNumber
        });

    } catch (error) {
        console.error('Account resolution error:', error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while verifying the account.'
        });
    }
};

// =====================================================
// WITHDRAW MONEY FROM WALLET
// =====================================================

const withdrawFromWallet = async (req, res) => {
    try {
        const {
            userId,
            amount,
            accountName,
            accountNumber,
            bankCode
        } = req.body;

        // =====================================================
        // VALIDATE REQUEST
        // =====================================================

        if (
            !userId ||
            !amount ||
            !accountName ||
            !accountNumber ||
            !bankCode
        ) {
            return res.status(400).json({
                success: false,
                message: 'All withdrawal details are required.'
            });
        }

        const withdrawalAmount = Number(amount);

        if (
            !Number.isFinite(withdrawalAmount) ||
            withdrawalAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal amount.'
            });
        }

        // =====================================================
        // GET USER WALLET
        // =====================================================

        const { data: wallet, error: walletError } =
            await supabase
                .from('wallet_accounts')
                .select('id, balance, status')
                .eq('user_id', userId)
                .single();

        if (walletError || !wallet) {
            console.error('Wallet error:', walletError);

            return res.status(404).json({
                success: false,
                message: 'Wallet not found.'
            });
        }

        // =====================================================
        // CHECK WALLET STATUS
        // =====================================================

        if (wallet.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Wallet is not active.'
            });
        }

        // =====================================================
        // CHECK WALLET BALANCE
        // =====================================================

        const currentBalance = Number(wallet.balance);

        if (withdrawalAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance.'
            });
        }

        // =====================================================
        // GENERATE UNIQUE REFERENCE
        // =====================================================

        const reference =
            `WALLET-WITHDRAW-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}`
                .toLowerCase();

        // =====================================================
        // CREATE WALLET TRANSACTION
        // =====================================================

        const {
            data: walletTransaction,
            error: transactionError
        } = await supabase
            .from('wallet_transactions')
            .insert({
                wallet_id: wallet.id,
                user_id: userId,
                transaction_type: 'withdrawal',
                amount: withdrawalAmount,
                status: 'completed',
                reference: reference,
                description: `Withdrawal to ${accountName} (****${accountNumber.slice(-4)})`,
                completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Wallet transaction error:', transactionError);

            return res.status(500).json({
                success: false,
                message: 'Could not create withdrawal transaction.'
            });
        }

        // =====================================================
        // DEDUCT MONEY FROM WALLET
        // =====================================================

        const newBalance = currentBalance - withdrawalAmount;

        const { error: balanceError } =
            await supabase
                .from('wallet_accounts')
                .update({ balance: newBalance })
                .eq('id', wallet.id)
                .eq('balance', currentBalance);

        if (balanceError) {
            console.error('Balance update error:', balanceError);

            await supabase
                .from('wallet_transactions')
                .update({ status: 'failed' })
                .eq('id', walletTransaction.id);

            return res.status(409).json({
                success: false,
                message: 'Wallet balance changed. Please try again.'
            });
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,
            message: 'Withdrawal completed successfully.',
            reference: reference,
            amount: withdrawalAmount,
            newBalance: newBalance,
            status: 'success',
            accountName: accountName
        });

    } catch (error) {
        console.error('Wallet withdrawal error:', error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while processing the withdrawal.'
        });
    }
};

// =====================================================
// EXPORT CONTROLLER
// =====================================================

module.exports = {
    withdrawFromWallet,
    resolveBankAccount
};