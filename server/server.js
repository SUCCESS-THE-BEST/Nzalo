require("dotenv").config();

const express = require("express");
const cors = require("cors");

const paystackRoutes =require("./routes/paystackRoutes");

const app = express();

app.use(cors());

app.use(
    express.json()
);

app.use("/paystack", paystackRoutes);

app.listen(3000, () => {
        console.log("Server running on port 3000");
    }
);