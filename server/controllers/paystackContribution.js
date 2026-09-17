const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// =====================================================
// INITIALIZE CONTRIBUTION PAYMENT
// =====================================================

const initializeContributionPayment = async (req, res) => {
    try {
        const { amount, stokvelId, userId, email } = req.body;
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Contribution amount is required.'
            });
        }
        if (!stokvelId) {
            return res.status(400).json({
                success: false,
                message: 'Stokvel ID is required.'
            });
        }
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contribution amount.'
            });
        }
        const amountInCents = Math.round(numericAmount * 100);
        const reference = `CONTRIBUTION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { data: contribution, error: contributionError } = await supabase
            .from('contributions')
            .insert([
                {
                    stokvel_id: stokvelId,
                    user_id: userId,
                    amount: numericAmount,
                    status: 'pending',
                    payment_reference: reference
                }
            ])
            .select()
            .single();
        if (contributionError) {
            return res.status(500).json({
                success: false,
                message: 'Could not create contribution record.'
            });
        }

        const callbackUrl = `${process.env.APP_CALLBACK_BASE_URL}/payment-complete?reference=${reference}`;
        const paystackResponse = await fetch(
            'https://api.paystack.co/transaction/initialize',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    amount: amountInCents,
                    reference: reference,
                    currency: 'ZAR',
                    callback_url: callbackUrl,
                    metadata: {
                        contribution_id: contribution.id,
                        stokvel_id: stokvelId,
                        user_id: userId
                    }
                })
            }
        );

        const paystackData = await paystackResponse.json();

        if (!paystackResponse.ok || !paystackData.status) {
            await supabase
                .from('contributions')
                .update({ status: 'failed' })
                .eq('id', contribution.id);

            return res.status(400).json({
                success: false,
                message: paystackData.message || 'Unable to initialize Paystack payment.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment initialized successfully.',
            contributionId: contribution.id,
            reference: reference,
            authorizationUrl: paystackData.data.authorization_url,
            accessCode: paystackData.data.access_code
        });
    } catch (error) {
        console.error('Initialize contribution payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while initializing payment.'
        });
    }
};

// VERIFY CONTRIBUTION PAYMENT
const verifyContributionPayment = async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Payment reference is required.'
            });
        }

        if (!reference.startsWith('CONTRIBUTION-')) {
            console.warn(
                `verifyContributionPayment called with non-contribution reference: ${reference}`
            );
            return res.status(400).json({
                success: false,
                message: 'This reference does not belong to a contribution payment.'
            });
        }

        // VERIFY PAYMENT WITH PAYSTACK
        const paystackResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const paystackData = await paystackResponse.json();

        if (!paystackResponse.ok || !paystackData.status) {
            return res.status(400).json({
                success: false,
                message: paystackData.message || 'Unable to verify payment.'
            });
        }
        const payment = paystackData.data;

        // PAYMENT SUCCESSFUL
        if (payment.status === 'success') {
            const paidAmount = Number(payment.amount) / 100;

            const { data: result, error: rpcError } = await supabase.rpc(
                'mark_contribution_paid',
                {
                    p_reference: reference,
                    p_paid_amount: paidAmount
                }
            );

            if (rpcError) {
                return res.status(500).json({
                    success: false,
                    message: 'Payment succeeded but contribution could not be processed.'
                });
            }

            if (result.status === 'not_found') {
                return res.status(404).json({
                    success: false,
                    message: 'Contribution record not found.'
                });
            }

            if (result.status === 'amount_mismatch') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment amount does not match contribution amount.',
                    status: 'amount_mismatch',
                    reference: reference
                });
            }

            return res.status(200).json({
                success: true,
                message: result.alreadyProcessed
                    ? 'Payment was already processed.'
                    : 'Contribution payment successful.',
                status: 'paid',
                reference: reference,
                contribution: result.contribution
            });
        }

        // TERMINAL FAILURE
        const terminalFailureStates = ['failed', 'reversed'];

        if (terminalFailureStates.includes(payment.status)) {
            await supabase
                .from('contributions')
                .update({ status: 'failed' })
                .eq('payment_reference', reference);

            return res.status(200).json({
                success: false,
                message: 'Payment failed.',
                status: 'failed',
                reference: reference
            });
        }

        // NOT FINISHED YET
        return res.status(200).json({
            success: false,
            message: 'Payment not completed yet.',
            status: payment.status,
            reference: reference
        });
    } catch (error) {
        console.error('Verify contribution payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while verifying payment.'
        });
    }
};

module.exports = {
    initializeContributionPayment,
    verifyContributionPayment
};