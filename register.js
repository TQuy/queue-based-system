import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Register ts-node ESM loader with custom configuration
register('ts-node/esm', pathToFileURL('./'), {
  data: {
    tsconfig: './tsconfig.json'
  }
})