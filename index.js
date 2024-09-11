import fs from 'node:fs';

import { svgExporter } from './src/svgExporter.js';

const logger = function (message) {
  throw 'Export Figma SVGs: ' + message;
};

const validateAndDefaultOptions = function (options) {
  options = options || {};
  options.baseUrl = options.baseUrl || 'https://api.figma.com/v1/';
  if (options.filterPrivateComponents === undefined) {
    options.filterPrivateComponents = false;
  }

  if (
    !options.baseUrl ||
    typeof(options.baseUrl) !== 'string'
  ) {
    logger('options.baseUrl must be a string or undefined');
  }

  if (
    !options.projectId ||
    typeof(options.projectId) !== 'string'
  ) {
    logger('options.projectId is a required string');
  }

  if (
    !options.projectNodeId ||
    typeof(options.projectNodeId) !== 'string'
  ) {
    logger('options.projectNodeId is a required string');
  }

  if (
    !options.personalAccessToken ||
    typeof(options.personalAccessToken) !== 'string'
  ) {
    logger('options.personalAccessToken is a required string');
  }

  if (typeof(options.filterPrivateComponents) !== 'boolean') {
    logger('options.filterPrivateComponents must be a boolean or undefined.');
  }

  if (
    options.svgOutput !== undefined &&
    typeof(options.svgOutput) !== 'string'
  ) {
    logger('options.svgOutput must be a string or undefined.');
  }
};

export default function exportFigmaSvgs (options) {
  validateAndDefaultOptions(options);
  svgExporter(options);
};
