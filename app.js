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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    googleId: String,
    secret: String,
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new model("User", userSchema);

passport.use(User.createStrategy())

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id).exec()
        .then(user => {
            done(null, user)
        })
        .catch(e => {
            console.log(e)
        })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets", // without www
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

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
        User.find({"secret": {$ne: null}}).then(users => {
            if (users) {
                res.render("secrets", {usersWithSecret: users})
            }
        }).catch(e => {console.log(e)})
    });

app.route('/auth/google')
    .get((req, res) => {
        passport.authenticate('google', { scope: ["profile"] })
            (req, res, () => { })
    });

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect("/secrets");
    })

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit')
        } else {
            res.redirect('/login')
        }
    })
    .post((req, res) => {
        User.findById(req.user.id).then(user => {
            user.secret = req.body.secret
            user.save().then(r => {
                res.redirect("/secrets")
            })
        }).catch(e => {
            console.log(e)
        })
    });

app.listen(3000, () => {
    console.log("Server started on port 3000")
})