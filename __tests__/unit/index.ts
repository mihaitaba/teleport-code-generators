import componentUIDL from '../../examples/uidl-samples/component-author-card.json'

import {
  createReactComponentGenerator,
  createVueComponentGenerator,
  ComponentGeneratorTypes,
} from '../../src'

const { ReactComponentStylingFlavors } = ComponentGeneratorTypes

describe('React Component Generator', () => {
  describe('with CSS Modules', () => {
    const generator = createReactComponentGenerator({
      variation: ReactComponentStylingFlavors.CSSModules,
    })

    it('should return the code as string', async () => {
      const uidl = JSON.parse(JSON.stringify(componentUIDL))
      const result = await generator.generateComponent(uidl)
      expect(result.code).toContain('import React from "react"')
      expect(result.externalCSS).toBeDefined()
      expect(result.dependencies).toBeDefined()
    })
  })

  describe('with Custom Mapping', () => {
    const generator = createReactComponentGenerator({
      variation: ReactComponentStylingFlavors.InlineStyles,
      customMapping: { container: { type: 'fakediv' } },
    })

    it('should render <fakediv> tags', async () => {
      const uidl = JSON.parse(JSON.stringify(componentUIDL))
      const result = await generator.generateComponent(uidl)
      expect(result.code).toContain('<fakediv')
      expect(result.externalCSS).toBe('')
      expect(result.dependencies).toBeDefined()
    })
  })
})

describe('Vue Component Generator', () => {
  describe('with standard plugins', () => {
    const generator = createVueComponentGenerator()

    it('should return the code as string', async () => {
      const uidl = JSON.parse(JSON.stringify(componentUIDL))
      const result = await generator.generateComponent(uidl)
      expect(result.code).toContain('<template>')
      expect(result.externalCSS).toBeUndefined()
      expect(result.dependencies).toBeDefined()
    })
  })

  describe('with Custom Mapping', () => {
    const generator = createVueComponentGenerator({
      customMapping: { container: { type: 'fakediv' } },
    })
    // generator.addMapping()

    it('should render <fakediv> tags', async () => {
      const uidl = JSON.parse(JSON.stringify(componentUIDL))
      const result = await generator.generateComponent(uidl)
      expect(result.code).toContain('<fakediv')
      expect(result.externalCSS).toBeUndefined()
      expect(result.dependencies).toBeDefined()
    })
  })
})
