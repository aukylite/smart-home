import { sql } from "../database/database.js";

const findAll = async () => {
  const result = await sql`SELECT * FROM measurements;`;
  return result;
};

const findLatest = async () => {
  const result = await sql`
  SELECT *
  FROM measurements
  WHERE measurement_time IN (
    SELECT MAX(measurement_time)
    FROM measurements
    GROUP BY sensor, data_type )`;
  return result;
};

const findLastWeek = async (deviceId, dataType) => {
  const result = await sql`
  SELECT *
  FROM measurements
  WHERE sensor = ${deviceId} AND 
  data_type = ${dataType} AND 
  measurement_time >= (now() - interval '1 week');`;
  return result;
};

const saveMeasurement = async (dataType, measurement, deviceId) => {
  return await sql`INSERT INTO measurements (
    data_type, 
    measurement_value,
    sensor) 
    values ( 
    ${dataType}, 
    ${measurement},
    ${deviceId}
    );`;
};


export { findAll, findLatest, findLastWeek, saveMeasurement, };
