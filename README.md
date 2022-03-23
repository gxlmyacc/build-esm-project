# build-esm-project

a build command that will transform js/jsx/images/scss with babel/postcss.

## Installtion

```bash
  npm install --save-dev build-esm-project
  // or 
  yarn add -D build-esm-project
```

## Usage

```bash
## build options:
##   --root <path>', 'provide project root directory, default process.cwd()
##   --build-config <path>', 'provide build esm config file path, default is process.cwd()/build-esm.config.js
##   --babel-config <path>', 'provide babel config file path, default is process.cwd()/babel.config.js
##   --postcss-config <path>', 'provide postcss config file path, default is process.cwd()/postcss.config.js
##   --ignore <path>', 'provide igonre transfrom files
##   --src <path>', 'source directory, default is src
##   --out <path>', 'output directory, default is esm

build-esm build
```

build-esm.config.js: 
```js
{
  cleanEsm() {
    // return false will skip
  },
  buildJs(babelConfig, done, file) {
    // return false will skip
  },
  buildScss(postcssPlugins, done, file) {
    // return false will skip
  },
  buildOthers(done, file) {
    // return false will skip
  },
}
```


