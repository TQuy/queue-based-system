export function isTest() {
  return process.env['NODE_ENV'] === 'test';
}

export function isDev() {
  return process.env['NODE_ENV'] === 'development';
}
