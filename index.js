const express = require("express");
const app = express();
const findMixable = require("./functions/match/findMixable");
require("dotenv").config();

const port = process.env.PORT || 4000;

findMixable();

app.listen(port, () => console.log(`Listening on port ${port}...`));
