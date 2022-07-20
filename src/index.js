require("dotenv").config();
const axios = require("axios");
const figmaRestApi = require("./util/figmaRestApi");
const Utils = require("./util/utils");
const path = require('path');
const outputFolder = "./icons/";
const rateLimit = 20;
const waitTimeInSeconds = 30;

const getProjectNode = async () => {
  return await figmaRestApi.get(
    "files/" +
      process.env.FIGMA_PROJECT_ID +
      "/nodes?ids=" +
      process.env.FIGMA_PROJECT_NODE_ID
  );
};

const getSVGURL = async (id) => {
  return await figmaRestApi.get(
    "images/" + process.env.FIGMA_PROJECT_ID + "/?ids=" + id + "&format=svg"
  );
};

const svgExporter = async () => {
  try {
    const response = await getProjectNode();
    const children = await response.data.nodes[
      process.env.FIGMA_PROJECT_NODE_ID
    ].document.children;

    // Top level svgs
    let svgs = children.filter(c => c.type === 'COMPONENT');

    // Includes 1st level groups (e.g. 24px, 16px)
    let groups = children.filter(c => c.type === 'GROUP');
    if (groups.length > 0) {
      groups.forEach((group) => {
        const components = group.children.filter(c => c.type === 'COMPONENT');
        if (components.length > 0) {
          svgs.push(...components);
        }
      });
    }

    // If ignoring private components
    if (process.env.FILTER_PRIVATE_COMPONENTS !== 'false') {
      svgs = Utils.filterPrivateComponents(svgs);
    }

    const numOfSvgs = svgs.length;

    console.log("Number of SVGs", numOfSvgs);

    for (i = 0; i < numOfSvgs; i += rateLimit) {
      const requests = svgs.slice(i, i + rateLimit).map(async (svg) => {
        // Get URL of each SVG
        let svgName = svg.name.replaceAll(' ', '');
        // keep only one level of folders with the size
        let svgSubfolders = svgName.split('/');
        if (svgSubfolders.length >= 2) {
          svgName = [svgSubfolders[0], svgSubfolders[svgSubfolders.length - 1]].join('/')
        }

        // Create subdirectories for icon (e.g. svg/16px/name.svg)
        await Utils.createFolder(path.join(outputFolder, path.dirname(svgName)));

        const svgURL = await getSVGURL(svg.id);

        // Get SVG DOM
        const svgDOM = await axios.get(svgURL.data.images[svg.id]);
        Utils.writeToFile(
          path.join(outputFolder, `${Utils.camelCaseToDash(svgName)}.svg`),
          svgDOM.data
        );
      });

      await Promise.all(requests)
        .then(() => {
          console.log(`Wait for ${waitTimeInSeconds} seconds`);
          return new Promise(function (resolve) {
            setTimeout(() => {
              console.log(`${waitTimeInSeconds} seconds!`);
              resolve();
            }, waitTimeInSeconds * 1000);
          });
        })
        .catch((err) => console.error(`Error proccessing ${i} - Error ${err}`));
    }
  } catch (err) {
    console.error(err);
  }
};

svgExporter();
