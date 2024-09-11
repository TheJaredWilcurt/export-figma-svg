import fs from 'node:fs';

export const writeToFile = async (filename, data) => {
  return fs.writeFile(filename, data, (error) => {
    if (error) {
      throw error;
    }
    console.log('The file ' + filename + ' has been saved!');
  });
};

export const camelCaseToDash = (string) => {
  return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

export const createFolder = async (path) => {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
  } catch {
    await fs.promises.mkdir(path, { recursive: true });
  }
};
