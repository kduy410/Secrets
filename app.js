require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const { Schema, model } = mongoose;
const md5 = require('md5')
const bcrypt = require('bcrypt')
const saltRounds = 10;

const app = express()
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
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

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

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
        User.findOne({ email: req.body.username })
            .then(user => {
                if (user) {
                    bcrypt.compare(req.body.password, user.password)
                        .then(result => {
                            if (result) {
                                res.render('secrets')
                            } else {
                                console.log("Wrong password: " + req.body.password)
                            }

                        })
                        .catch(e => {
                            console.log(e)
                        })
                }
            })
    })

app.route('/register')
    .get((req, res) => {
        res.render('register')
    })
    .post((req, res) => {
        bcrypt.hash(req.body.password, saltRounds).then(hash => {
            console.log(hash)
            let user = new User({
                email: req.body.username,
                password: hash,
            })
            user.save().then(r => {
                console.log("SAVED")
                console.log(r)
                res.render('secrets')
            })
        })
    });

app.route('/logout')
    .get((req, res) => {
        res.redirect('/')
    });

app.listen(3000, () => {
    console.log("Server started on port 3000")
})