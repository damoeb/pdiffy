const BlinkDiff = require('blink-diff');
const _ = require('lodash');

const defaultOptions = {
  reportFolder: './reports',
  threshold: 100,
  waitForAngular: false,
  waitBeforeScreenshotTime: 500
};
let instanceCount = 0;

module.exports = {
  create(customOptions, jasmineBlock) {
    let expectId = 0;
    instanceCount ++;
    const instanceId = instanceCount;

    return new function () {
      const pdiffy = this;
      const options = {};
      const cache = {};
      _.assign(options, defaultOptions, customOptions);

      // expected
      describe('(expected run)', () => {
        beforeEach(() => {
          expectId = 0;
          browser.waitForAngularEnabled(options.waitForAngular);
          browser.get(options.expectedUrl);
        });
        jasmineBlock(pdiffy);
      });

      // actual
      describe('(actual run)', () => {
        beforeEach(() => {
          expectId = 0;
          browser.waitForAngularEnabled(options.waitForAngular);
          browser.get(options.actualUrl);
        });
        jasmineBlock(pdiffy);
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
                threshold: options.threshold / 100,

                // export the the images highlighting the difference
                imageOutputPath: `${options.reportFolder}/${instanceId}-${expectId}.png`
              });

              diff.run((error, result) => {
                if (error) {
                  throw error;
                } else {
                  console.log(`compare #${instanceId}-${expectId} with ${result.differences} differences`);
                  expect(diff.hasPassed(result.code)).toBe(true);
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
