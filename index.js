var crypto = require('crypto');

var express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    methodOverride = require('method-override');
var Model = require('./schema');

var app = express()
app.use(methodOverride('X-HTTP-Method-Override'))
app.use(require('morgan')('dev'));

app.use(bodyParser.json())
app.use(cors())

app.use(require('./helpers/authentication'));

var requireAuth = function(req, res, next) {
    if(req.authenticatedId !== undefined) {
        next()
    }
    else {
        next({status:403})
    }
}

app.use(function(req, res, next) {
    console.log(req.body);
    setTimeout(function() {
        next()
    },500)
})

app.route('/')
.get([requireAuth],function(req, res, next) {
    res.send({status:200})
})

app.route('/users')
.get([requireAuth],function(req, res, next) {
    // Requires User Authentication
    Model.find({}, function(err, data) {
        if(err) return next(err)
        res.send(data)
    })
})
.post(function(req, res, next) {
    var User = new Model(req.body);
    User.save(function(err, data) {
        if(err) return next(err)
        res.send(data)
    })
})
.patch(function(req, res, next) {
    Model.findOne({username:req.body.username}, '+password', function(err, user) {
        if(err || !user) return next({status:403})
        user.comparePassword(req.body.password, function(err, isMatch) {
            if(err || !isMatch) return next({status:403})
            var key = newKey();
            Model.update({_id:user._id},{access_key:key}, function(err, response) {
                res.send({token: makeToken(user._id, key)})
            })
        })
    })
})

app.route('/users/:id')

app.listen(5000, function() {
    console.log('Connected')
})

app.use(function(err, req, res, next) {
    console.error(err);
    if(!err.status) err.status = 500;
    res.status(err.status)
    res.send({status:err.status})
})

var newKey = function() {
    return crypto.createHash('md5').update(Math.random().toString()).digest("hex");
}

var makeToken = function(id, access_key) {
    var token = JSON.stringify({
        id:id,
        access_key:access_key
    })
    return new Buffer(token).toString("base64");
}
