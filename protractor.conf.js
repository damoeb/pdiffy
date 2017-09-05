const pdiffy = require('./pdiffy');

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['examples/**/*.js'],
  framework: 'jasmine2',
  onPrepare: function() {
    pdiffy.install();
  }
};
