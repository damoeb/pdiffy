const BlinkDiff = require('blink-diff');
const argv = require('yargs').argv;

function usage() {
  console.error('Usage: npm pdiffy --expected=[url] --actual=[url]');
  process.exit(1);
}

if (!argv.expected || !argv.actual) {
  usage();
}

const cache = {};
const REPORTS_DIR = './reports';
const THRESHOLD = 99;
let testRunId = 0;

const pdiffy = function (tests) {
  const expectedUrl = argv.expected;
  const actualUrl = argv.actual;

  // expected
  describe('(expected run)', () => {
    beforeEach(() => {
      testRunId = 0;
      browser.waitForAngularEnabled(false);
      browser.get(expectedUrl);
    });
    tests();
  });

  // actual
  describe('(actual run)', () => {
    beforeEach(() => {
      testRunId = 0;
      browser.waitForAngularEnabled(false);
      browser.get(actualUrl);
    });
    tests();
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
        threshold: THRESHOLD / 100,

        // export the the images highlighting the difference
        imageOutputPath: `${REPORTS_DIR}/${testRunId}.png`
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
