const mysql = require('mysql2/promise');
require('dotenv').config(); 
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Fetch batch from the database
const fetchBatch = async (offset, batchSize, query) => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.query(query, [offset, batchSize]);
  await connection.end();
  return rows;
};
const updateDatabase = async (id, column, sanitizedValue) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const query = `UPDATE image_master SET ${column} = ? WHERE id = ?`;
    await connection.query(query, [sanitizedValue, id]);
  } 
  catch (error) {
    console.error(`Error updating database for id=${id}, column=${column}: ${error.message}`);
    throw error;
  } 
  finally {
    console.log("executed and closed")
    await connection.end();
  }
};



module.exports = { fetchBatch , updateDatabase };
