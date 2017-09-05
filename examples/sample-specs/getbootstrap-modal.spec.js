const pdiffy = require('../../pdiffy');
const EC = protractor.ExpectedConditions;

pdiffy.createEnvironment(
  {
    expectedUrl: 'http://getbootstrap.com/javascript/#modals',
    actualUrl: 'http://getbootstrap.com/javascript/#modals'
  },
  (pdiffyInstance) => {

    describe('bootstrap modals', () => {
      it('loads', (done) => {
        pdiffyInstance.expectSimilarity(done);
      });

      describe('modal', () => {
        beforeEach(() => {
          let button = element(by.css('.bs-example.bs-example-padded-bottom')).element(by.tagName('button'));
          button.click();

          let modal = element(by.id('myModal'));
          browser.wait(EC.not(() => modal.isDisplayed()));
        });

        it('opens', (done) => {
          pdiffyInstance.expectSimilarity(done);
        });
      });
    });
  });
