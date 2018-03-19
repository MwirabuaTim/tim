#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const findit = require('findit')
const finder = findit(path.resolve(process.cwd(), 'node_modules'))
const prettify = obj => JSON.stringify(obj, null, 2)
const rethrow = err => {
  if (err) throw err
}

const removeReactNativePeerDep = file => {
  const pkgJson = require(file)
  const { peerDependencies } = pkgJson
  if (peerDependencies && peerDependencies['react-native']) {
    console.log(`removing react-native from ${file} peerDependencies`)
    delete pkgJson.peerDependencies['react-native']
    fs.writeFile(file, prettify(pkgJson), rethrow)
  }
}

finder.on('file', (file, stat) => {
  if (/package\.json$/.test(file)) removeReactNativePeerDep(file)
})
