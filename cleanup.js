const fs = require('fs');
const files = ['check_medidas_schema.js', 'check_posicion.js', 'check_db_schema_atletas.js', 'check_other_schemas.js', 'check_atletas_schema.js'];
files.forEach(file => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted ${file}`);
    }
});
