# WIP: This project is not done/published yet


# Export SVGs from Figma


## Getting Started

1. Run: `npm install --save-dev export-figma-svg` (not published)
1. Create a node script like this:

```js
import fs from 'node:fs';
import path from 'node:path';

import exportFigmaSvgs from 'export-figma-svgs';

const __dirname = import.meta.dirname;

const getIcons = async function () {
  // Returns JSON data about each icon as an object with SVG data in the object.
  const iconsData = await exportFigmaSvgs({
    // Defaults to 'https://api.figma.com/v1/'
    baseUrl: 'https://api.figma.com/v1/',

    // Click on the frame containing all your icons, then grab the ID and Node ID from the URL:
    // https://www.figma.com/design/ABCdEfg0HIJkLmN12OpqrS/Whatever?node-id=123-456&node-type=frame&t=ZyXWvUt98SRqpOnm-0
    projectId: 'ABCdEfg0HIJkLmN12OpqrS',
    projectNodeId: '123:456',

    // Defaults to false. Set this to true to skip icons that begin with a period (.) or underscore (_)
    filterPrivateComponents: false,

    // Where to output your SVG files. If not provided, no SVGs files are created.
    svgOutput: path.resolve(__dirname, 'icons'),

    // Figma.com > Account > Account Settings > Personal Access Token
    // You can store it in a `.env` file and use `node --env-file=.env ./scripts/this-file.js` to run it
    personalAccessToken: process.env.FIGMA_API_KEY
  });

  // To store the Icons data
  const iconsDataFile = path.resolve(__dirname, 'icons.json');
  fs.writeFileSync(iconsDataFile, JSON.stringify(iconsData, null, 2));
};
```


## Pre-requisties

* You will need a personal access token from Figma.com (API key)
* Your icons are in a single Frame
* Each icon is a Figma Component (Select Icon and use `Ctrl+Alt+K` / `Command+Option+K`)


### Running locally

1. `npm install`
1. `npm run lint`


### Limitations

Figma API has a fixed number of requests (rate limits) you can call per minute. This script will process a 20 requests per 45 seconds to avoid hitting that limit.


## This repo started as a fork

@jacobtyq made [export-figma-svg](https://github.com/jacobtyq/export-figma-svg), a CLI tool.

Then @FlatIO [forked it](https://github.com/FlatIO/export-figma-svg)) to make a several improvements.

Then I forked their code and made a bunch of changes so this could be published to npm for script usage, rather than used via CLI.

But not sure if I'll actually publish it yet.
