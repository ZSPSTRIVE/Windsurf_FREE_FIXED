module.exports = function(app) {
  // This is a workaround for the allowedHosts issue
  app.use((req, res, next) => {
    next();
  });
};
