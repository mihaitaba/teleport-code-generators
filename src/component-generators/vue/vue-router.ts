import { ComponentAssemblyLine, Builder, Resolver } from '../pipeline'

import { createPlugin as createRouterPlugin } from '../plugins/vue/vue-router'
import { createPlugin as createImportPlugin } from '../plugins/common/import-statements'

import { GeneratorOptions } from '../types'
import { ComponentUIDL } from '../../uidl-definitions/types'

import htmlMapping from '../../uidl-definitions/elements-mapping/html-mapping.json'
import vueMapping from './elements-mapping.json'

const createVuePipeline = ({ customMapping }: GeneratorOptions = {}) => {
  const resolver = new Resolver({ ...htmlMapping, ...vueMapping, ...customMapping })
  const assemblyLine = new ComponentAssemblyLine([
    createRouterPlugin({
      codeChunkName: 'vue-router',
      importChunkName: 'import-lib',
    }),
    createImportPlugin({
      importLibsChunkName: 'import-lib',
    }),
  ])

  const chunksLinker = new Builder()

  const generateComponent = async (uidl: ComponentUIDL, options: GeneratorOptions = {}) => {
    const resolvedUIDL = resolver.resolveUIDL(uidl, options)
    const result = await assemblyLine.run(resolvedUIDL)
    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return {
    generateComponent,
  }
}

export default createVuePipeline
