const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  DATABASE_URL:         required('DATABASE_URL'),
  JWT_ACCESS_SECRET:    required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET:   required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES:   process.env['JWT_ACCESS_EXPIRES'],
  JWT_REFRESH_EXPIRES:  process.env['JWT_REFRESH_EXPIRES'],
  CORS_ORIGIN:          process.env['CORS_ORIGIN'],
  PORT:                 Number(process.env['PORT']),
  CLOUDINARY_CLOUD_NAME: required('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY:    required('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: required('CLOUDINARY_API_SECRET'),
} as const;
