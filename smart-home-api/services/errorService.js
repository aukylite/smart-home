import { sql } from "../database/database.js";

const findAllErrors = async () => {
  const result = await sql`SELECT * FROM errors;`;
  return result;
};

const saveError = async (error, deviceId) => {
  return await sql`INSERT INTO errors (
    error,
    sensor) 
    values ( 
    ${error}, 
    ${deviceId}
    );`;
};


export { findAll, saveError, };
