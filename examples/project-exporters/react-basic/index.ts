import path from 'path'
import { removeDir, copyDirRec, readJSON, writeFolder } from '../utils/path-utils'

import projectJson from '../../uidl-samples/project-state-components.json'
import customMapping from './custom-mapping.json'

import {
  UIDLTypes,
  ProjectGeneratorTypes,
  UIDLValidators,
  createReactBasicProject,
} from '../../../src'

const writeToDisk = async (
  projectUIDL: UIDLTypes.ProjectUIDL,
  generatorFunction: ProjectGeneratorTypes.ProjectGeneratorFunction,
  templatePath: string = 'project-template',
  distPath: string = 'dist'
) => {
  await removeDir(path.join(__dirname, distPath))
  await copyDirRec(templatePath, path.join(__dirname, distPath))
  const packageJsonTemplate = path.join(templatePath, 'package.json')
  const packageJson = await readJSON(packageJsonTemplate)
  if (!packageJson) {
    throw new Error('could not find a package.json in the template folder')
  }

  const { outputFolder } = await generatorFunction(projectUIDL, {
    sourcePackageJson: packageJson,
    distPath,
    customMapping,
  })
  await writeFolder(outputFolder, __dirname)
}

// const runInMemory = async (
//   projectUIDL: ProjectUIDL,
//   generatorFunction: ProjectGeneratorFunction
// ) => {
//   const result = await generatorFunction(projectUIDL)
//   console.log(JSON.stringify(result, null, 2))
// }

console.log(UIDLValidators.validateProject(projectJson))

writeToDisk(projectJson, createReactBasicProject, path.join(__dirname, 'project-template'), 'dist')
// runInMemory(projectJson, createReactProject)
