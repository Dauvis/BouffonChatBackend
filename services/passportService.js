import passport from "passport";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

export const passportService = passport.initialize();
