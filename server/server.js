require("dotenv").config();

const express = require("express");
const cors = require("cors");

const paystackRoutes =require("./routes/paystackRoutes");
const paystackContributionRoutes =require('./routes/paystackContributionRoutes');

const app = express();

app.use(cors());

app.use(
    express.json()
);

app.use("/paystack", paystackRoutes);
app.use('/api/paystack-contribution',paystackContributionRoutes);

app.listen(3000, () => {
        console.log("Server running on port 3000");
    }
);