const pdiffyFactory = require('../pdiffy');
const EC = protractor.ExpectedConditions;

pdiffyFactory.createEnvironment(
  {
    expectedUrl: 'http://getbootstrap.com/javascript/#dropdowns',
    actualUrl: 'http://getbootstrap.com/javascript/#dropdowns'
  },
  (pdiffy) => {
    describe('dropdown', () => {
      beforeEach(() => {
        element(by.id('drop4')).click();
      });

      it('opens', (done) => {
        pdiffy.expectSimilarity(done);
      });
    });
  });
