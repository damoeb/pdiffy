const pdiffyFactory = require('../pdiffy');
const EC = protractor.ExpectedConditions;

pdiffyFactory.create(
  {
    actualUrl: 'http://getbootstrap.com/javascript/#dropdowns',
    expectedUrl: 'http://getbootstrap.com/javascript/#dropdowns'
  },
  (pdiffy) => {
    describe('dropdown', () => {
      beforeEach(() => {
        element(by.id('drop4')).click();
      });

      it('opens', (done) => {
        pdiffy.expect(done);
      });
    });
  });
