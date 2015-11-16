var Model = require('../schema');

module.exports = function(req, res, next) {
    req.authenticatedId = undefined;
    token = req.query.token
    try {
        buff = JSON.parse(new Buffer(token, 'base64').toString('utf8'))
        Model.findOne({_id:buff.id}, '+access_key', function(err, data) {
            if(err || !data) return next({status:403})
            if(buff.access_key == data.access_key) {
                req.authenticatedId = buff.id
            }
            next()
        })
    }
    catch (e) {
        next()
    }
}
