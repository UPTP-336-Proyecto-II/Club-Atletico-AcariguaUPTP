const axios = require('axios');

const verify = async () => {
    const url = 'http://localhost:3000/api/atletas'; // Tries 3000
    try {
        const res = await axios.get(url);
        console.log(`GET ${url} Status:`, res.status);
        console.log('Data Length:', res.data.length);
        if (res.data.length > 0) {
            const a = res.data[0];
            console.log('First Athlete Sample:', {
                nombre: a.nombre,
                pais: a.pais,
                estado: a.estado,
                municipio: a.municipio,
                parroquia: a.parroquia
            });
            if (a.pais) console.log('✅ Address data validated properly!');
            else console.log('⚠️ Address data is empty/null, might be partial data or logic issue if address existed.');
        }
    } catch (error) {
        console.error('API Verification Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
};

verify();
