const BlinkDiff = require('blink-diff');
const _ = require('lodash');
const fs = require('fs');

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
let environmentCount = 0;
let lastSpec = 0;
function nextSpec() {
  lastSpec++;
  return lastSpec;
}

module.exports = {
  /**
   * Install pdiffy in jasmine
   */
  install() {
    // install reporter
    jasmine.getEnv().addReporter(this.createReporter({}));
  },

  // see https://github.com/larrymyers/jasmine-reporters/blob/master/src/junit_reporter.js
  // @private
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
            status: spec.status,
            fullName: spec.fullName.replace(modes.evaluation, '').trim(),
            message: spec.failedExpectations.map(expectation => expectation.message).join(', ')
          });
        }
      },
      jasmineDone() {
        // generate report
        const outFn = `${options.outputFolder}/pdiffy-report.html`;
        const reportTemplate = fs.readFileSync('./pdiffy-report.template.html');

        const specsWithId = _.map(specs, (specs, index) => { specs.id = `spec${index+1}`; return specs; });
        const report = _.template(reportTemplate)({specs: specsWithId});
        fs.writeFileSync(outFn, report);
        console.log(`Pdiffy report saved to ${outFn}`);
      }
    };
  },
  /**
   * Defines pdiffy environment for the expected and actual test run
   * @param customOptions a subset of default options
   * @param specsFn the jasmine specs
   */
  createEnvironment(customOptions, specsFn) {
    environmentCount++;
    const environmentId = environmentCount;
    let expectId = 0;

    return new function () {
      const pdiffy = this;
      const cache = {};
      const options = {};
      _.assign(options, defaultOptions, customOptions);

      beforeEach(function () {
        browser.waitForAngularEnabled(options.waitForAngular);
        jasmine.addMatchers({
          toBeIsomorph(util, customEqualityTesters) {
            return {
              compare: function ({diff, diffResult}, expected) {
                const passThreshold = diff.hasPassed(diffResult.code);
                const passDifferences = options.strict && diffResult.differences === 0;
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

      // @private
      pdiffy.takeScreenshot = () => {
        return new Promise((resolve, reject) => {
          browser.takeScreenshot()
            .then((base64) => {
              resolve(new Buffer(base64, 'base64'));
            })
            .catch(reject);
        });
      };

      /**
       * Hook to pdiffy to compare the particular state based on screenshots
       * @param done
       */
      pdiffy.expectSimilarity = (done) => {
        const currentSpecId = expectId;
        expectId++;
        // wait for animations
        setTimeout(() => {
          const match = cache[currentSpecId];
          if (typeof(match) === 'undefined') {

            // create snapshot and cache
            console.log(`cache #${currentSpecId} on environment #${environmentId}`);
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
                  console.log(`compare #${currentSpecId} with ${diffResult.differences} differences on environment #${environmentId}`);
                  expect({diff, diffResult}).toBeIsomorph();

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
