import path from 'node:path';
import axios from 'axios';

import {
  camelCaseToDash,
  createFolder,
  writeToFile
} from './helpers.js';

const rateLimit = 20;
const waitTimeInSeconds = 30;


const filterPrivateSvgs = function (svgs) {
  return svgs.filter((svg) => {
    return (
      !svg.name.startsWith('.') &&
      !svg.name.startsWith('_')
    );
  });
};

const extractFigmaGroup = (children) => {
  const svgs = [];

  // SVG in current folder
  const components = children.filter((child) => {
    return child.type === 'COMPONENT';
  });
  if (components.length > 0) {
    svgs.push(...components);
  }

  const componentsSets = children.filter((child) => {
    return child.type === 'COMPONENT_SET';
  });
  componentsSets.forEach((componentsSet) => {
    const groupComponents = extractFigmaGroup(componentsSet.children);
    if (groupComponents.length > 0) {
      groupComponents.forEach((component) => {
        component.name = 'name=' + componentsSet.name + ', ' + component.name;
        svgs.push(component);
      });
    }
  });

  // Sub-groups
  const groups = children.filter((child) => {
    return ['GROUP', 'FRAME'].includes(child.type);
  });
  groups.forEach((group) => {
    const groupComponents = extractFigmaGroup(group.children);
    if (groupComponents.length > 0) {
      svgs.push(...groupComponents);
    }
  });

  return svgs;
};

const buildFilename = (svgName) => {
  svgName = svgName.trim().replaceAll(' ', '');

  // Component set with attributes, e.g. name=list,size=24px,style=outline
  if (svgName.includes('=')) {
    // { name: 'caract-left', state: 'default', size: '24px' }
    const attributes = svgName
      .split(',')
      .map((attr) => {
        const [key, value] = attr.split('=');
        return { key, value };
      })
      .reduce((obj, item) => {
        obj[item.key] = item.value;
        return obj;
      }, {});

    if (!attributes.size) {
      console.error('Size attribute not found for ' + svgName);
      return null;
    }

    svgName = attributes.size + '/' + attributes.name;
    if (attributes.state && attributes.state !== 'default') {
      svgName = svgName + '-' + attributes.state;
    }
    if (attributes.style) {
      svgName = svgName + '-' + attributes.style;
    }

    return svgName;
  }

  // Old icons, e.g. ' 24px / icon name' to '24px-icon-name'
  // - keep only one level of folders with the size
  const svgSubfolders = svgName.split('/');
  if (svgSubfolders.length >= 2) {
    svgName = [svgSubfolders[0], svgSubfolders.slice(1).join('-')].join('/');
  }
  return svgName;
};

export const svgExporter = async (options) => {
  const {
    baseUrl,
    projectId,
    projectNodeId,
    filterPrivateComponents,
    svgOutput,
    personalAccessToken
  } = options;
  const iconsData = {};

  const get = function (url) {
    const axiosOptions = {
      baseURL: baseUrl,
      headers: {
        'X-Figma-Token': personalAccessToken
      }
    };
    return axios.get(url, axiosOptions)
  };

  const getProjectNode = (projectId, projectNodeId) => {
    return get('files/' + projectId + '/nodes?ids=' + projectNodeId);
  };

  const getSvgUrl = (projectId, id) => {
    return axios.get('images/' + projectId + '/?ids=' + id + '&format=svg');
  };

  try {
    const response = await getProjectNode(projectId, projectNodeId);
    const rootFrame = await response.data?.nodes?.[projectNodeId]?.document?.children;

    // Top level svgs
    let svgs = await extractFigmaGroup(rootFrame);

    // If ignoring private components
    if (filterPrivateComponents) {
      svgs = await filterPrivateSvgs(svgs);
    }

    const svgsAmount = svgs.length;

    console.log('Number of SVGs', svgsAmount);

    console.log(svgs);
    return svgs;
    /*
    for (let i = 0; i < svgsAmount; i += rateLimit) {
      const requests = svgs.slice(i, i + rateLimit).map(async (svg) => {
        // Normalize SVG name
        const svgName = buildFilename(svg.name);

        if (!svgName) {
          console.error('Error processing ' + svg.name);
          return;
        }

        // Create subdirectories for icon (e.g. svg/16px/name.svg)
        await createFolder(path.join(svgOutput, path.dirname(svgName)));

        const svgURL = await getSvgUrl(projectId, svg.id);

        // Get SVG DOM
        const svgDOM = await axios.get(svgURL.data.images[svg.id]);
        writeToFile(
          path.join(svgOutput, camelCaseToDash(svgName) + '.svg'),
          svgDOM.data
        );
      });

      await Promise
        .all(requests)
        .then(() => {
          console.log('Wait for ' + waitTimeInSeconds + ' seconds');
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log(waitTimeInSeconds + ' seconds!');
              resolve();
            }, waitTimeInSeconds * 1000);
          });
        })
        .catch((error) => {
          console.error('Error proccessing ' + i + ' - Error ' + error);
        });
    }
    */
  } catch (error) {
    console.error(error);
  }
};
