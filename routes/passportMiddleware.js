var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var callBackURL = process.env.NODE_ENV=='production'?'https://mfrashad-todo-app.herokuapp.com/auth/google/callback':'http://localhost:3000/google/callback';

module.exports = function(keystone){
  var User = keystone.list("User");
  passport.serializeUser(function (user, cb) {
    cb(null, user._id)
  });
  
  passport.deserializeUser(function (id, cb) {
    User.model.findById(id, function (er, user) {
      cb(er, user)
    })
  });
  
  passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:callBackURL
  },
    function(token,refreshToken,profile,done){
      
      var query = {'googleId':profile.id};
      User.model.findOne(query,function(err,user){
        if(user){
          console.log('found');
          done(null,user);
        } else {
          console.log('not found');
          var user = new User.model({
            name: {first: profile.displayName, last:''} ,
            image:profile._json.image.url,
            email:profile.emails[0].value,
            password:'password',
            googleId:profile.id,
            googleToken:token,
            isAdmin:false
          });
          user.save(function (err) {
              if (err) {
                  // handle error
                  return console.log(err);
              }
            
              // user has been saved
              console.log(user);
          });
          done(null,user);
        }
      });

    }
  ));
  
  keystone.pre("routes", passport.initialize())
  keystone.pre("routes", passport.session())
  
}