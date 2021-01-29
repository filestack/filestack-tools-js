<p align="center">
  <a href="https://www.filestack.com"><img src="https://static.filestackapi.com/filestack.svg?refresh" align="center" width="250" /></a>
</p>
<p align="center">
  <strong>Javascript tools used by filestack</strong>
</p>
<hr/>

- [Api Documentation](#api-documentation)
- [Tools included](#tools-included)
- [How to use](#how-to-use)
  - [NodeJS](#nodejs)
  - [Browsers](#browsers)
    - [ES module](#es-module)
    - [UMD module](#umd-module)
    - [SRI](#sri)
  - [Rollup support](#rollup-support)
- [Versioning](#versioning)
- [Contributing](#contributing)

## Api Documentation
Api documentations is available on <a href="https://filestack.github.io/filestack-tools-js">github pages</a>

## Tools included
- file - file manipulation tools like exif removal, mimetypes operations etc
  - filterJpeg - filter jpeg file metadata
  - extensionToMime - convert extension to mimetype
  - getMimetype - returns mimetype based on magicbytes and extension
  - isAcceptable - checks if ext or mime is in acceptable array

## How to use

### NodeJS
```js
import { filterJpeg } from 'filestack-tools';
filterJpeg(FILE_BUFFER, options)
```

### Browsers

#### ES module
```js
import { filterJpeg } from 'filestack-tools';
filterJpeg(BLOB, options)
```

#### UMD module
```HTML
<script src="//static.filestackapi.com/filestack-tools/{MAJOR_VERSION}.x.x/filestack-tools.min.js" crossorigin="anonymous"></script>
<script>
  const filterJpeg = filestackTools.filterJpeg(FILE);
</script>
```

where ```{MAJOR_VERSION}``` is one of the MAJOR versions of the filestack-js ie:
```HTML
<script src="//static.filestackapi.com/filestack-tools/3.x.x/filestack-tools.min.js" crossorigin="anonymous"></script>
<script>
  const filterJpeg = filestackTools.filterJpeg(FILE);
</script>
```


#### SRI
Subresource Integrity (SRI) is a security feature that enables browsers to verify that files they fetch (for example, from a CDN) are delivered without unexpected manipulation. It works by allowing you to provide a cryptographic hash that a fetched file must match

To obtain sri hashes for filestack-tools library check manifest.json file on CDN:

```
https://static.filestackapi.com/filestack-tools/{LIBRARY_VERSION}/manifest.json
```

```HTML
<script src="//static.filestackapi.com/filestack-tools/{LIBRARY_VERSION}/filestack-tools.min.js" integrity="{FILE_HASH}" crossorigin="anonymous"></script>
```

Where ```{LIBRARY_VERSION}``` is currently used library version and ```{FILE_HASH}``` is one of the hashes from integrity field in manifest.json file


### Rollup support
When using with rollup, set resolve plugin with option browser:true

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags](https://github.com/filestack/js-filestack-tools/tags) on this repository.

## Contributing

We follow the [conventional commits](https://conventionalcommits.org/) specification to ensure consistent commit messages and changelog formatting.
