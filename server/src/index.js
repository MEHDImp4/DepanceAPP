const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/accounts', require('./routes/accountRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/transfers', require('./routes/transferRoutes'));
app.use('/templates', require('./routes/templateRoutes'));

app.get('/', (req, res) => {
    res.send('DepanceAPP API is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
