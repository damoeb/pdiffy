pdiffy
======

```bash

npm run pdiffy # to run the examples

```

Protractor test addon to visually compare the results in a flow (pdiff) of an expected instance and the actual instance.
To gain pdiffy support you have to wrap the jasmine expressions by 

```javascript 1.6
const pdiffy = require('pdiffy');

pdiffy.createEnvironment(
  {
    expectedUrl: 'http://your-staging-url',
    actualUrl: 'http://your-new-feature-url',
  },
  (pdiffyInstance) => {
  // your describe/it blocks
  }
)

```

A comparison in the flow can be triggered using

```javascript 1.6

pdiffyInstance.expectSimilarity(done)

```

License
--------
GNU GPLv3

Contacts
--------
@damoeb
