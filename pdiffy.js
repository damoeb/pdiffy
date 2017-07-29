const BlinkDiff = require('blink-diff');
const _ = require('lodash');

const cache = {};
let options = {};
const defaultOptions = {
  reportFolder: './reports',
  threshold: 100,
  waitForAngular: false,
};
let testRunId = 0;

const pdiffy = function (customOptions, jasmineBlock) {
  _.assign(options, defaultOptions, customOptions);
  const expectedUrl = options.expectedUrl;
  const actualUrl = options.actualUrl;

  // expected
  describe('(expected run)', () => {
    beforeEach(() => {
      testRunId = 0;
      browser.waitForAngularEnabled(options.waitForAngular);
      browser.get(expectedUrl);
    });
    jasmineBlock();
  });

  // actual
  describe('(actual run)', () => {
    beforeEach(() => {
      testRunId = 0;
      browser.waitForAngularEnabled(options.waitForAngular);
      browser.get(actualUrl);
    });
    jasmineBlock();
  });
};

pdiffy.expect = (done) => {
  testRunId++;
  const match = cache[testRunId];
  if (typeof(match) === 'undefined') {

    // create snapshot and cache
    console.log(`cache #${testRunId}`);
    pdiffy.takeScreenshot().then((imageExpected) => {
      cache[testRunId] = imageExpected;
      done();
    });
  } else {

    // take snapshot and compare with cache result
    const imageExpected = cache[testRunId];

    pdiffy.takeScreenshot().then((imageActual) => {

      const diff = new BlinkDiff({
        imageA: imageExpected,
        imageB: imageActual,

        thresholdType: BlinkDiff.THRESHOLD_PERCENT,
        threshold: options.threshold / 100,

        // export the the images highlighting the difference
        imageOutputPath: `${options.reportFolder}/${testRunId}.png`
      });

      diff.run((error, result) => {
        if (error) {
          throw error;
        } else {
          console.log(`compare #${testRunId} with ${result.differences} differences`);
          expect(diff.hasPassed(result.code)).toBe(true);
          done();
        }
      });

    }).catch(err => console.error(err));
  }
};

pdiffy.takeScreenshot = () => {
   return new Promise((resolve, reject) => {
     browser.takeScreenshot()
      .then((base64) => {
        resolve(new Buffer(base64, 'base64'));
      })
     .catch(reject);
  });
};

module.exports = pdiffy;
