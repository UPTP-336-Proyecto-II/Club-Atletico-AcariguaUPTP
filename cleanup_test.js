try {
    const fs = require('fs');
    if (fs.existsSync('test_query_atletas.js')) fs.unlinkSync('test_query_atletas.js');
} catch (e) { console.log(e) }
