export const getEnvironment = () => {
  return process.env.NODE_ENV === 'production'
    ? 'production'
    : 'test';
};