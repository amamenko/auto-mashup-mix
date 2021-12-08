const express = require("express");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Listening on port ${port}...`));
