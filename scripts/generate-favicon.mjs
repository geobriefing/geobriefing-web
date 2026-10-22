import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

// Ring + green dot, paper on ink. Source of truth is public/favicon.svg.
const svg = readFileSync('public/favicon.svg')

const pngBuffer = await sharp(svg, { density: 300 }).resize(32, 32).png().toBuffer()
writeFileSync('public/favicon.ico', pngBuffer)
writeFileSync('src/app/favicon.ico', pngBuffer)
console.log('favicon.ico generated')
