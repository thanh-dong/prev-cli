// src/content/pages.test.ts
import { test, expect } from 'bun:test'
import { scanPages, fileToRoute, buildSidebarTree, parseFrontmatter } from './pages'
import { useTempDirPerTest, writeFiles } from '../../test/utils'

const getTempDir = useTempDirPerTest('prev-pages-test-')

// fileToRoute: all cases in one test
test('fileToRoute converts paths to routes', () => {
  expect(fileToRoute('index.mdx')).toBe('/')
  expect(fileToRoute('guide/intro.mdx')).toBe('/guide/intro')
  expect(fileToRoute('guide/index.mdx')).toBe('/guide')
  expect(fileToRoute('README.md')).toBe('/')
  expect(fileToRoute('guide/README.md')).toBe('/guide')
  expect(fileToRoute('readme.md')).toBe('/') // case insensitive
})

// parseFrontmatter: happy path
test('parseFrontmatter extracts typed values', () => {
  const result = parseFrontmatter(`---
title: "Title with: colon"
description: A description
draft: true
order: 42
---
# Content`)

  expect(result.frontmatter.title).toBe('Title with: colon')
  expect(result.frontmatter.draft).toBe(true)
  expect(result.frontmatter.order).toBe(42)
  expect(result.content).toContain('# Content')
})

// parseFrontmatter: edge case
test('parseFrontmatter handles missing frontmatter', () => {
  const result = parseFrontmatter('# Just content')
  expect(Object.keys(result.frontmatter)).toHaveLength(0)
  expect(result.content).toBe('# Just content')
})

// scanPages: comprehensive test
test('scanPages finds pages with frontmatter', async () => {
  await writeFiles(getTempDir(), {
    'index.mdx': '---\ntitle: Home\n---\n# Home',
    'guide/intro.mdx': '# Intro',
  })

  const pages = await scanPages(getTempDir())
  expect(pages).toHaveLength(2)
  expect(pages.find(p => p.route === '/')?.title).toBe('Home')
  expect(pages.map(p => p.route).sort()).toEqual(['/', '/guide/intro'])
})

// scanPages: README handling
test('scanPages handles README files', async () => {
  await writeFiles(getTempDir(), {
    'README.md': '# Welcome',
    'guide/README.md': '# Guide',
  })

  const pages = await scanPages(getTempDir())
  expect(pages.find(p => p.route === '/')?.title).toBe('Welcome')
  expect(pages.find(p => p.route === '/guide')?.title).toBe('Guide')
})

// scanPages: index preferred over README
test('scanPages prefers index over README', async () => {
  await writeFiles(getTempDir(), {
    'index.md': '# Home',
    'README.md': '# Readme',
  })

  const pages = await scanPages(getTempDir())
  expect(pages).toHaveLength(1)
  expect(pages[0].file).toBe('index.md')
})

// buildSidebarTree: meaningful assertion
test('buildSidebarTree creates nested structure', () => {
  const pages = [
    { route: '/', title: 'Home', file: 'index.mdx' },
    { route: '/guide', title: 'Guide', file: 'guide/index.mdx' },
    { route: '/guide/intro', title: 'Intro', file: 'guide/intro.mdx' },
  ]

  const tree = buildSidebarTree(pages)
  expect(tree.some(item => item.title === 'Home')).toBe(true)
  expect(tree.some(item => item.title === 'Guide' && item.children?.length)).toBe(true)
})
