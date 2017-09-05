const pdiffy = require('../../pdiffy');

pdiffy.createEnvironment(
  {
    expectedUrl: 'http://getbootstrap.com/javascript/#dropdowns',
    actualUrl: 'http://getbootstrap.com/javascript/#dropdowns'
  },
  (pdiffyInstance) => {
    describe('bootstrap dropdown', () => {
      beforeEach(() => {
        element(by.id('drop4')).click();
      });

      it('opens', (done) => {
        pdiffyInstance.expectSimilarity(done);
      });
    });
  });
