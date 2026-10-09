import express from 'express'
import mongoose from 'mongoose';
import multer from 'multer'
import path from 'path';
import "dotenv/config"

import dns from 'dns'
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cloudinary import $ configuration code.
import { v2 as cloudinary } from 'cloudinary';
import { type } from 'os';
// configuration.
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

const url = process.env.API_Url;
mongoose.connect(url, {
    dbName: "nodejs_course",
}).then(() => console.log('mongoDB connected..!')).catch((err) => console.log(err))

// rendering login file
app.get("/", (req, res) => {
    res.render("login.ejs", { url: null });
});

// rendering register file
app.get("/register", (req, res) => {
    res.render("register.ejs", { url: null });
});

const storage = multer.diskStorage({
    //   destination: "./public/uploads",
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

const upload = multer({ storage: storage });

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: String,
    filename: String,
    public_id: String,
    imgUrl: String,
});

const User = mongoose.model("user", userSchema);

app.post("/register", upload.single("file"), async (req, res) => {
    const file = req.file.path;

    const { name, email, password } = req.body;

    const cloudinaryRes = await cloudinary.uploader.upload(file, {
        folder: "nodejs_course",
    });

    // Creating User
    const db = await User.create({
        name,
        email,
        password,
        filename: file.originalname,
        public_id: cloudinaryRes.public_id,
        imgUrl: cloudinaryRes.secure_url,
    });

    res.redirect("/");
    //   res.render("register.ejs", { url: cloudinaryRes.secure_url });

    // res.json({message:'file uploaded successfully',cloudinaryRes})
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("printing the body = ", req.body)

    let user = await User.findOne({ email });
    if (!user) {
        res.render("login.ejs");
        console.log(45);

    }

    else if (String(user.password) != password) {
        res.render("login.ejs");
    } else {
        res.render('profile.ejs', { user })
    }
});

const port = 3000;
app.listen(port, () => console.log(`server is running on port ${port}`));