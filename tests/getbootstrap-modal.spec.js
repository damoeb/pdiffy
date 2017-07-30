const pdiffyFactory = require('../pdiffy');
const EC = protractor.ExpectedConditions;

pdiffyFactory.createEnvironment(
  {
    expectedUrl: 'http://getbootstrap.com/javascript/#modals',
    actualUrl: 'http://getbootstrap.com/javascript/'
  },
  (pdiffy) => {
    describe('modal', () => {
      beforeEach(() => {
        let button = element(by.css('.bs-example.bs-example-padded-bottom')).element(by.tagName('button'));
        button.click();

        let modal = element(by.id('myModal'));
        browser.wait(EC.not(() => modal.isDisplayed()));
      });

      it('opens', (done) => {
        pdiffy.expectSimilarity(done);
      });
    });
  });
