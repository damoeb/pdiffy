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
let lastSpec = 0;
function nextSpec() {
  lastSpec ++;
  return lastSpec;
}

module.exports = {
  // see https://github.com/larrymyers/jasmine-reporters/blob/master/src/junit_reporter.js
  createReporter(customOptions) {
    const options = {};
    _.assign(options, defaultOptions, customOptions);

    function hasBeenExecutedInEvaluationMode(spec) {
      return spec.fullName.startsWith(modes.evaluation);
    }

    const specs = [];

    return {
      specDone(spec) {
        if (hasBeenExecutedInEvaluationMode(spec)) {
          specs.push({
            id: spec.id,
            passed: spec.status === 'passed',
            fullName: spec.fullName.replace(modes.evaluation, '').trim(),
            message: spec.failedExpectations.map(expectation => expectation.message).join(', ')
          });
        }
      },
      jasmineDone() {
        const fs = require('fs');
        fs.writeFile(`${options.outputFolder}/pdiffy-report.json`, JSON.stringify(specs), function(err) {
          if(err) {
            return console.log(err);
          }

          console.log('report saved!');
        });
      }
    };
  },
  createEnvironment(customOptions, specsFn) {
    instanceCount++;
    const instanceId = instanceCount;
    let expectId = 0;

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
        beforeAll(() => {
          expectId = 0;
        });
        beforeEach(() => {
          browser.get(options.expectedUrl);
        });
        specsFn(pdiffy);
      });

      // actual
      describe(modes.evaluation, () => {
        beforeAll(() => {
          expectId = 0;
        });
        beforeEach(() => {
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

      pdiffy.expectSimilarity = (done) => {
        const currentSpecId = expectId;
        expectId ++;
        // wait for animations
        setTimeout(() => {
          const match = cache[currentSpecId];
          if (typeof(match) === 'undefined') {

            // create snapshot and cache
            console.log(`cache #${instanceId}-${currentSpecId}`);
            pdiffy.takeScreenshot().then((imageExpected) => {
              cache[currentSpecId] = imageExpected;
              done();
            });
          } else {

            // take snapshot and compare with cache result
            const imageExpected = cache[currentSpecId];

            const specId = nextSpec();

            pdiffy.takeScreenshot().then((imageActual) => {
              const diff = new BlinkDiff({
                imageA: imageExpected,
                imageB: imageActual,

                thresholdType: BlinkDiff.THRESHOLD_PERCENT,
                threshold: options.similarityThreshold / 100,

                // export the the images highlighting the difference
                // The file name has to match the spec id, wich is not in our control
                imageOutputPath: `${options.outputFolder}/spec${ specId }.png`
              });

              diff.run((error, diffResult) => {
                if (error) {
                  throw error;
                } else {
                  console.log(`compare #${instanceId}-${currentSpecId} with ${diffResult.differences} differences`);
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
