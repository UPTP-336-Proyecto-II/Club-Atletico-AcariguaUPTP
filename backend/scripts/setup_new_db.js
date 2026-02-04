const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const applySchema = async () => {
  const schemaPath = path.join(__dirname, '../database/normalized_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  
  // Connect to MySQL server (without database selected initially to create it)
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });

  try {
    console.log('Applying schema...');
    await connection.query(sql);
    console.log('Normalized database created successfully!');
  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await connection.end();
  }
};

applySchema();
