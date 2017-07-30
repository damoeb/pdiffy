const pdiffyFactory = require('./pdiffy');

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['tests/**/*.js'],
  framework: 'jasmine2',
  onPrepare: function() {
    jasmine.getEnv().addReporter(pdiffyFactory.createReporter({}));
  }
};
