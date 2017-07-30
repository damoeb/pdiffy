const BlinkDiff = require('blink-diff');
const _ = require('lodash');

const modes = {
  preparation: '(preparation mode)',
  evaluation: '(evaluation mode)'
};

const defaultOptions = {
  outputFolder: './reports',
  similarityThreshold: 100,
  waitForAngular: false,
  waitBeforeScreenshotTime: 500,
  strict: true // fails test if differences exist independent of similarityThreshold
};
let instanceCount = 0;

module.exports = {
  // see https://github.com/larrymyers/jasmine-reporters/blob/master/src/junit_reporter.js
  createReporter(customOptions) {
    const options = {};
    _.assign(options, defaultOptions, customOptions);

    function hasBeenExecutedInEvaluationMode(spec) {
      return spec.fullName.startsWith(modes.evaluation);
    }

    return {
      specDone(spec) {
        if (hasBeenExecutedInEvaluationMode(spec)) {
          console.log('done', spec);
        }
      },
      jasmineDone() {
        console.log('write report');
      }
    };
  },
  createEnvironment(customOptions, specsFn) {
    let expectId = 0;
    instanceCount++;
    const instanceId = instanceCount;

    return new function () {
      const pdiffy = this;
      const cache = {};
      const options = {};
      _.assign(options, defaultOptions, customOptions);

      beforeEach(function() {
        browser.waitForAngularEnabled(options.waitForAngular);
        jasmine.addMatchers({
          toBeDoozy(util, customEqualityTesters) {
            return {
              compare: function({diff, diffResult}, expected) {
                const passThreshold = diff.hasPassed(diffResult.code);
                const passDifferences = !options.strict || diffResult.differences === 0;
                return {
                  pass: passThreshold && passDifferences,
                  message: `${diffResult.differences} differences found`
                };
              }
            }
          }
        });
      });

      // expected
      describe(modes.preparation, () => {
        beforeEach(() => {
          expectId = 0;
          browser.get(options.expectedUrl);
        });
        specsFn(pdiffy);
      });

      // actual
      describe(modes.evaluation, () => {
        beforeEach(() => {
          expectId = 0;
          browser.get(options.actualUrl);
        });
        specsFn(pdiffy);
      });

      pdiffy.takeScreenshot = () => {
        return new Promise((resolve, reject) => {
          browser.takeScreenshot()
            .then((base64) => {
              resolve(new Buffer(base64, 'base64'));
            })
            .catch(reject);
        });
      };

      pdiffy.expect = (done) => {
        setTimeout(() => {
          expectId++;
          const match = cache[expectId];
          if (typeof(match) === 'undefined') {

            // create snapshot and cache
            console.log(`cache #${instanceId}-${expectId}`);
            pdiffy.takeScreenshot().then((imageExpected) => {
              cache[expectId] = imageExpected;
              done();
            });
          } else {

            // take snapshot and compare with cache result
            const imageExpected = cache[expectId];

            pdiffy.takeScreenshot().then((imageActual) => {
              const diff = new BlinkDiff({
                imageA: imageExpected,
                imageB: imageActual,

                thresholdType: BlinkDiff.THRESHOLD_PERCENT,
                threshold: options.similarityThreshold / 100,

                // export the the images highlighting the difference
                imageOutputPath: `${options.outputFolder}/${instanceId}-${expectId}.png`
              });

              diff.run((error, diffResult) => {
                if (error) {
                  throw error;
                } else {
                  console.log(`compare #${instanceId}-${expectId} with ${diffResult.differences} differences`);
                  expect({diff, diffResult}).toBeDoozy();

                  done();
                }
              });

            }).catch(err => console.error(err));
          }
        }, options.waitBeforeScreenshotTime);
      };
    };
  }
};
