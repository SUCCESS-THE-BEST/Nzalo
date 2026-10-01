const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// INITIALIZE PAYSTACK PAYMENT
// ==========================================

const initializePayment = async (req, res) => {

    try {

        const { amount, email } = req.body;

        if (!amount || Number(amount) <= 0) {

            return res.status(400).json({
                message: "Invalid deposit amount"
            });

        }

        if (!email) {

            return res.status(400).json({
                message: "Email is required"
            });

        }

        const amountInCents =
            Math.round(
                Number(amount) * 100
            );

        const reference =
            `DEP-${Date.now()}-${Math.floor(
                Math.random() * 100000
            )}`;

        const response = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",
                headers: {
                    "Authorization":
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    amount: amountInCents,
                    currency: "ZAR",
                    reference: reference,
                    callback_url:
                        "https://paystack-callback.local/paystack/callback"

                })
            }
        );

        const data = await response.json();

        if (!data.status) {
            console.log(
                "Paystack error:",
                data
            );

            return res.status(400).json({

                message:
                    data.message ||
                    "Paystack initialization failed"

            });

        }

        return res.json({
            authorization_url:
                data.data.authorization_url,

            access_code:
                data.data.access_code,

            reference:
                data.data.reference

        });

    } catch (error) {
        console.error(
            "Paystack initialize error:",
            error
        );

        return res.status(500).json({
            message: "Unable to initialize Paystack payment"
        });

    }

};

// ==========================================
// VERIFY PAYMENT + CREDIT WALLET
// ==========================================

const verifyPayment = async (req, res) => {

    try {

        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required"
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Missing authorization token"
            });
        }

        const token = authHeader.split(" ")[1];

        const {
            data: { user },
            error: userError
        } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired session"
            });
        }

        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!data.status || data.data.status !== "success") {
            return res.status(400).json({
                success: false,
                message: "Payment was not successful"
            });
        }

        const paidAmount = Number(data.data.amount) / 100;

        const { data: existingTx, error: existingTxError } = await supabaseAdmin
            .from("wallet_transactions")
            .select("id")
            .eq("reference", reference)
            .eq("status", "completed")
            .maybeSingle();

        if (existingTxError) {
            console.error("Existing transaction lookup error:", existingTxError);
        }

        if (existingTx) {
            return res.json({
                success: true,
                reference,
                amount: paidAmount,
                alreadyCredited: true
            });
        }

        const supabaseUser = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` }
                }
            }
        );

        const { data: wallet, error: depositError } = await supabaseUser.rpc(
            "deposit_to_wallet",
            {
                p_amount: paidAmount,
                p_reference: reference,
                p_description: "Paystack deposit"
            }
        );

        if (depositError) {
            
            console.error("Wallet credit error:", depositError);

            return res.status(500).json({
                success: false,
                message: "Payment verified but wallet credit failed. Please contact support."
            });
        }

        console.log("Verified + credited payment:", reference, paidAmount);

        return res.json({
            success: true,
            reference,
            amount: paidAmount,
            balance: wallet?.balance
        });

    } catch (error) {
        console.error(
            "Paystack verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify payment"
        });
    }
};


module.exports = {
    initializePayment,
    verifyPayment
};