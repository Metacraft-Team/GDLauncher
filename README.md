# Metacraft Launcher

Known Issues:

### Code sign for MacOS

1. We are using `extraFiles` config in electron-builder, `extraFiles` seems need to be signed manually
```bash
codesign -s "Developer ID Application: xxx (xxxxxxx)" node_modules/7zip-bin/mac/x64/7za
```

2. And follow this instrcution to get the App notarized - https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/