pdiffy
======

```bash

npm pdiffy

```

Protractor test addon to visually compare the results in a flow (pdiff) of an expected instance and the actual instance.
To gain pdiffy support you have to wrap the jasmine expressions by 

```javascript 1.6
const pdiffyFactory = require('pdiffy');

pdiffyFactory.createEnvironment(
  {
    expectedUrl: 'http://getbootstrap.com/javascript/#dropdowns'
    actualUrl: 'http://getbootstrap.com/javascript/#dropdowns',
  },
  (pdiffy) => {
  // your describe/it blocks
  }
)

```

A comparison in the flow can be triggered using

```javascript 1.6

pdiffy.expectSimilarity(done)

```

License
--------
GNU GPLv3

Contacts
--------
@damoeb
