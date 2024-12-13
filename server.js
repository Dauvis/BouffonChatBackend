import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello World from the backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
