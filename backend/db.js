import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: "51.21.33.66",        
  user: "postgres",         
  password: "elementsenergies1234", 
  database: "aptest", 
  port: 5432,
});

export default pool;