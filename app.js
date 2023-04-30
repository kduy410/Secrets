require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const { Schema, model } = mongoose;

const app = express()
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

const userSchema = new Schema({
    email: String,
    password: String,
})

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:['password'] });

const User = new model("User", userSchema);

app.route('/')
    .get((req, res) => {
        res.render('home')
    });

app.route('/login')
    .get((req, res) => {
        res.render('login')
    })
    .post((req, res) => {
        User.findOne({ email: req.body.username }).then(user => {
            if (user) {
                console.log(user);
                if (user.password === req.body.password) {
                    console.log(user);
                    res.render('secrets')
                }
            }
        })
    });

app.route('/register')
    .get((req, res) => {
        res.render('register')
    })
    .post((req, res) => {
        let user = new User({
            email: req.body.username,
            password: req.body.password
        })
        user.save().then(r => console.log(r))
        res.render('secrets')
    });

app.route('/logout')
    .get((req, res) => {
        res.render('home')
    });

app.listen(3000, () => {
    console.log("Server started on port 3000")
})