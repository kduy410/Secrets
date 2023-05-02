require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const { Schema, model } = mongoose;
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express()
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: "Our secret.",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const userSchema = new Schema({
    email: String,
    password: String,
})

userSchema.plugin(passportLocalMongoose);

const User = new model("User", userSchema);

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



app.route('/')
    .get((req, res) => {
        res.render('home')
    });

app.route('/login')
    .get((req, res) => {
        res.render('login')
    })
    .post((req, res) => {
        req.login(new User({
            username: req.body.username,
            password: req.body.password
        }), (e) => {
            if (e) {
                console.log(e)
            } else {
                passport.authenticate('local', { failureRedirect: '/login' })(req, res, () => {
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route('/register')
    .get((req, res) => {
        res.render('register')
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password)
            .then(user => {
                if (user) {
                    console.log(user)
                    passport.authenticate('local', { failureRedirect: '/register' })(req, res, () => {
                        res.redirect("/secrets")
                    })
                }
            })
            .catch(e => {
                console.log(e)
                res.redirect('/register')
            })
    });

app.route('/logout')
    .get((req, res) => {
        req.logout({}, (e) => {
            if (e) {
                console.log(e)
            } else {
                res.redirect('/')
            }
        })
    });

app.route('/secrets')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('secrets')
        } else {
            res.redirect('/login')
        }
    });

app.listen(3000, () => {
    console.log("Server started on port 3000")
})