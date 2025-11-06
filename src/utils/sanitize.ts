const sensitiveFields = ['jwtToken', 'password'];

export function hideSensitiveDataJSON(data: any) {
  return JSON.stringify(data, (key, value) => {
    return sensitiveFields.includes(key) ? '****' : value;
  });
}
