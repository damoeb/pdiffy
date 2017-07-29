const pdiffy = require('../pdiffy');
const EC = protractor.ExpectedConditions;

pdiffy(
  {
    actualUrl: 'http://getbootstrap.com/javascript/#modals',
    expectedUrl: 'http://getbootstrap.com/javascript/#modals'
  },
  () => {
    describe('modal', () => {
      beforeEach(() => {
        let button = element(by.css('.bs-example.bs-example-padded-bottom')).element(by.tagName('button'));
        button.click();

        let modal = element(by.id('myModal'));
        browser.wait(EC.not(() => modal.isDisplayed()));
      });
      it('opens', (done) => {
        pdiffy.expect(done);
      });
    });
  });
