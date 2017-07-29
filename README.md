pdiffy
======

```bash
npm pdiffy --expected=[url] --actual=[url]
```

Protractor test addon to visually compare the results in a flow (pdiff) of an expected instance and the actual instance.
To gain pdiffy support you have to wrap the jasmine expressions by 

```javascript 1.6
pdiffy(() => {
  // your describe/it blocks
})
```

A comparison in the flow can be triggered using

```javascript 1.6
pdiffy.expect(done)
```

Contacts
--------
@damoeb
