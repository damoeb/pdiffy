const BlinkDiff = require('blink-diff');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

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

class pdiffy {

  /**
   * Install pdiffy in jasmine
   */
  install(customOptions) {

    const mergedOptions = _.assign({}, defaultOptions, customOptions);
    mergedOptions.outputFolder = path.resolve(process.cwd(), mergedOptions.outputFolder);
    // create report dir
    if (!fs.existsSync(mergedOptions.outputFolder)){
      fs.mkdirSync(mergedOptions.outputFolder);
    }

    this.initialOptions = mergedOptions;

    // install reporter
    jasmine.getEnv().addReporter(this.createReporter());
  }

  options() {
    return this.initialOptions;
  }

  // see https://github.com/larrymyers/jasmine-reporters/blob/master/src/junit_reporter.js
  // @private
  createReporter() {

    function hasBeenExecutedInEvaluationMode(spec) {
      return spec.fullName.startsWith(modes.evaluation);
    }

    const specs = [];

    const outputFolder = this.outputFolder;

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
        console.log('Creating pdiff report');
        // generate report
        const outFn = `${outputFolder}/pdiffy-report.html`;
        const reportTemplate = fs.readFileSync(path.resolve(__dirname, '/pdiffy-report.template.html')).toString();

        const specsWithId = _.map(specs, (specs, index) => { specs.id = `spec${index+1}`; return specs; });
        const report = _.template(reportTemplate)({specs: specsWithId});
        fs.writeFileSync(outFn, report);
        console.log(`Pdiffy report saved to ${outFn}`);
      }
    };
  }

  /**
   * Defines pdiffy environment for the expected and actual test run
   * @param customOptions a subset of default options
   * @param specsFn the jasmine specs
   */
  createEnvironment(customOptions, specsFn) {
    environmentCount++;
    const environmentId = environmentCount;
    let expectId = 0;
    const baseOptions = this.options();

    return new function () {
      const pdiffy = this;
      const cache = {};
      const options = {};
      _.assign(options, baseOptions, customOptions);
      this.options = () => options;

      function tryPrepare(testRunOptions, done) {
        if (_.isFunction(baseOptions.prepare)) {
          return baseOptions.prepare(pdiffy, testRunOptions, done);
        } else {
          done();
        }
      }

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
        let testRunOptions = {isExpectedRun: true, isActualRun: false};
        beforeAll(() => {
          expectId = 0;
        });
        if(_.isFunction(options.prepareExpectedInstance)) {
          options.prepareExpectedInstance();
        }
        beforeAll(() => {
          browser.get(options.expectedUrl);
        });
        beforeAll((done) => {
          tryPrepare(testRunOptions, done)
        });
        specsFn(pdiffy, testRunOptions);
      });

      // actual
      describe(modes.evaluation, () => {
        let testRunOptions = {isExpectedRun: false, isActualRun: true};
        beforeAll(() => {
          expectId = 0;
        });
        beforeAll(() => {
          browser.restartSync();
        });
        if(_.isFunction(options.prepareActualInstance)) {
          options.prepareActualInstance();
        }
        beforeAll(() => {
          browser.get(options.actualUrl);
        });
        beforeAll((done) => {
          tryPrepare(testRunOptions, done)
        });
        specsFn(pdiffy, testRunOptions);
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

module.exports = new pdiffy();
