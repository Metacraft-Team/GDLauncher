# Metacraft

note patchs:

/node_modules/app-builder-lib/node_modules/electron-osx-sign/sign.js
```
var args = [
        '--sign', opts.identity.hash || opts.identity.name,
        "--deep",
        '--force'
      ]
      
// add "--deep",
```
