import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { splitProps, generateEmptyVueComponentJS, generateVueComponentPropTypes } from './utils'

import { createXMLNode, createXMLRoot } from '../../utils/xml'
import { objectToObjectExpression } from '../../utils/js-ast'
import { ContentNode, ComponentDependency } from '../../../uidl-definitions/types'

const addTextNodeToTag = (tag: Cheerio, text: string) => {
  if (text.startsWith('$props.') && !text.endsWith('$props.')) {
    // For real time, when users are typing we need to make sure there's something after the dot (.)
    const propName = text.replace('$props.', '')
    if (propName === 'children') {
      const slot = createXMLNode('slot')
      tag.append(slot)
    } else {
      tag.append(`{{${propName}}}`)
    }
  } else {
    tag.append(text.toString())
  }
}

const generateVueNodesTree = (
  content: ContentNode,
  templateLookup: Record<string, any>,
  dependencies: Record<string, ComponentDependency>
): CheerioStatic => {
  const { type, key, children, attrs, dependency } = content

  if (dependency) {
    dependencies[type] = { ...dependency }
  }

  const xmlRoot = createXMLRoot(type)
  const xmlNode = xmlRoot(type)

  if (children) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        addTextNodeToTag(xmlNode, child)
        return
      }
      const childTag = generateVueNodesTree(child, templateLookup, dependencies)
      xmlNode.append(childTag.root())
    })
  }

  const { staticProps, dynamicProps } = splitProps(attrs || {})

  Object.keys(staticProps).forEach((propKey) => {
    xmlNode.attr(propKey, staticProps[propKey])
  })

  Object.keys(dynamicProps).forEach((propKey) => {
    const propName = dynamicProps[propKey].replace('$props.', '')
    xmlNode.attr(`:${propKey}`, propName)
  })

  templateLookup[key] = xmlNode

  return xmlRoot
}

interface VueComponentConfig {
  vueTemplateChunkName: string
  vueJSChunkName: string
  htmlFileId: string
  jsFileAfter: string[]
  jsFileId: string
}

export const createPlugin: ComponentPluginFactory<VueComponentConfig> = (config) => {
  const {
    vueTemplateChunkName = 'vue-component-template-chunk',
    vueJSChunkName = 'vue-component-js-chunk',
    htmlFileId = null,
    jsFileId = null,
    jsFileAfter = [],
  } = config || {}

  const vueBasicComponentChunks: ComponentPlugin = async (structure) => {
    const { uidl, chunks, dependencies } = structure

    // if file ids are not falsy, and different in value
    const separateFiles = (htmlFileId || jsFileId) && htmlFileId !== jsFileId

    const templateLookup: { [key: string]: any } = {}
    const scriptLookup: { [key: string]: any } = {}

    const templateContent = generateVueNodesTree(uidl.content, templateLookup, dependencies)

    chunks.push({
      type: 'html',
      name: vueTemplateChunkName,
      meta: {
        lookup: templateLookup,
        fileId: htmlFileId,
      },
      wrap: separateFiles
        ? undefined
        : (generatedContent) => {
            return `<template>\n${generatedContent}</template>`
          },
      content: templateContent,
    })

    const jsContent = generateEmptyVueComponentJS(
      uidl.name,
      {
        importStatements: [],
        componentDeclarations: Object.keys(dependencies),
      },
      scriptLookup
    )

    // todo refactor into pure function
    if (uidl.propDefinitions) {
      scriptLookup.props.value.properties.push(
        ...objectToObjectExpression(generateVueComponentPropTypes(uidl.propDefinitions)).properties
      )
    }

    chunks.push({
      type: 'js',
      name: vueJSChunkName,
      linker: {
        after: jsFileAfter,
      },
      meta: {
        lookup: scriptLookup,
        fileId: jsFileId,
      },
      wrap: separateFiles
        ? undefined
        : (generatedContent) => {
            return `<script>\n${generatedContent}</script>`
          },
      content: jsContent,
    })

    return structure
  }

  return vueBasicComponentChunks
}

export default createPlugin()
