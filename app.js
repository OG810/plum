import express from "express"
const app = express();
import router from "./src/route/textroute.js"
import bodyParser from "body-parser";

// Middleware to parse JSON
app.use(express.json());

// Default route
app.use(router);
app.use(bodyParser.json());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
