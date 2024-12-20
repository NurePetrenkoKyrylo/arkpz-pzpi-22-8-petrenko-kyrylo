const {connection} = require("./config");
const cors = require('cors');
const express = require('express');
const mongoose = require("mongoose");
const userRouter = require("./routes/userRouter");
const inventoryRouter = require("./routes/inverntoryRouter");
const adminRouter = require("./routes/adminRouter");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/user", userRouter)
app.use("/inventory", inventoryRouter)
app.use("/admin", adminRouter)

const start = async () =>{
    try{
        await mongoose.connect(connection);
        app.listen(PORT, () => console.log(`Server started at port  ${PORT}`));
    } catch (e){
        console.log(e);
    }
}
start();