const pdiffy = require('../pdiffy');

pdiffy(() => {
  describe('example test', () => {
    it('should be true', (done) => {
      pdiffy.expect(done);
    });
  });
});
