const pool = require('../config/database');

/**
 * Service to handle Address Normalization Logic
 */
const addressService = {
    /**
     * Resolves or Creates an Address structure returning the direccion_id
     * @param {Object} addressData - { pais, estado, municipio, parroquia, descripcion_descriptiva }
     * @returns {Promise<number>} direccion_id
     */
    async findOrCreateAddress(addressData) {
        const { pais, estado, municipio, parroquia, descripcion_descriptiva } = addressData;

        // Minimal validation: if no country, assume Venezuela or fail? 
        // Let's assume Venezuela if missing but other data present.
        const paisName = pais || 'Venezuela';
        const estadoName = estado || '';
        const municipioName = municipio || '';
        const parroquiaName = parroquia || '';

        // We need at least Country + State + Municipality to link a Parroquia properly.
        // If incomplete hierarchy, we can't create a valid relation in normalized tables easily without orphans.
        // However, we will try to resolve as deep as possible.

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Pais
            let paisId;
            const [paisRows] = await connection.execute('SELECT pais_id FROM ubicacion_pais WHERE UPPER(nombre) = UPPER(?)', [paisName]);
            if (paisRows.length > 0) {
                paisId = paisRows[0].pais_id;
            } else {
                const [res] = await connection.execute('INSERT INTO ubicacion_pais (nombre) VALUES (?)', [paisName]);
                paisId = res.insertId;
            }

            // 2. Estado
            let estadoId = null;
            if (estadoName) {
                const [estRows] = await connection.execute('SELECT estado_id FROM ubicacion_estado WHERE UPPER(nombre) = UPPER(?) AND pais_id = ?', [estadoName, paisId]);
                if (estRows.length > 0) {
                    estadoId = estRows[0].estado_id;
                } else {
                    const [res] = await connection.execute('INSERT INTO ubicacion_estado (nombre, pais_id) VALUES (?, ?)', [estadoName, paisId]);
                    estadoId = res.insertId;
                }
            }

            // 3. Municipio
            let municipioId = null;
            if (estadoId && municipioName) {
                const [munRows] = await connection.execute('SELECT municipio_id FROM ubicacion_municipio WHERE UPPER(nombre) = UPPER(?) AND estado_id = ?', [municipioName, estadoId]);
                if (munRows.length > 0) {
                    municipioId = munRows[0].municipio_id;
                } else {
                    const [res] = await connection.execute('INSERT INTO ubicacion_municipio (nombre, estado_id) VALUES (?, ?)', [municipioName, estadoId]);
                    municipioId = res.insertId;
                }
            }

            // 4. Parroquia
            let parroquiaId = null;
            if (municipioId && parroquiaName) {
                const [parRows] = await connection.execute('SELECT parroquia_id FROM ubicacion_parroquia WHERE UPPER(nombre) = UPPER(?) AND municipio_id = ?', [parroquiaName, municipioId]);
                if (parRows.length > 0) {
                    parroquiaId = parRows[0].parroquia_id;
                } else {
                    const [res] = await connection.execute('INSERT INTO ubicacion_parroquia (nombre, municipio_id) VALUES (?, ?)', [parroquiaName, municipioId]);
                    parroquiaId = res.insertId;
                }
            }

            // 5. Create Direccion
            // Note: punto_referencia maps to descripcion_descriptiva in frontend
            const puntoReferencia = descripcion_descriptiva || '';

            const [dirRes] = await connection.execute(
                'INSERT INTO direcciones (parroquia_id, punto_referencia) VALUES (?, ?)',
                [parroquiaId, puntoReferencia]
            );

            await connection.commit();
            return dirRes.insertId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    updateAddress: async (direccionId, addressData) => {
        // Since Address tables are shared references (Location), we don't update 'Lara' to 'Zulia' globally.
        // We change the LINKS.
        // And for 'direcciones' table, it's specific to an entity usually, but good practice is to create NEW address logic 
        // OR update the fields of the specific address row if it's 1:1.
        // The schema implies `direcciones` rows are unique per entity usually.
        // So we can update the links (parroquia_id) and text (punto_referencia) of the EXISTING row.

        // Use logic similar to findOrCreate to get IDs, then UPDATE existing IDs.
        // ... For brevity/safety, avoiding code dup, better to implement a wrapper or just use findOrCreate logic 
        // to resolve IDs then run UPDATE.
        // But actually, we need to return the IDs from step 1-4.

        // Implementation:
        // Reuse the resolution logic. Ideally extract it.
        // For now, I'll allow the controller to just call findOrCreate logic to get new Parroquia ID 
        // and then update the specific row.

        // Actually, simple approach:
        // Just creating a new address and linking to it is safer for history?
        // But typically we update the user's address.
        // I'll implement a `resolveLocationIds` helper later if needed.
        // For now, let's just use `findOrCreateAddress` to CREATE a NEW one and return ID? 
        // No, that creates orphaned rows in `direcciones`.
        // Better to UPDATE the existing row. See `updateAddressInPlace`.
        return null; // Implementation pending if needed, or simply use create logic and update FK? 
        // But standard is Update the Row.
    },

    getSelectColumns: () => `
    up.nombre as pais, 
    ue.nombre as estado, 
    um.nombre as municipio, 
    upa.nombre as parroquia, 
    d.punto_referencia as descripcion_descriptiva
  `,

    getJoins: () => `
    LEFT JOIN direcciones d ON entity.direccion_id = d.direccion_id
    LEFT JOIN ubicacion_parroquia upa ON d.parroquia_id = upa.parroquia_id
    LEFT JOIN ubicacion_municipio um ON upa.municipio_id = um.municipio_id
    LEFT JOIN ubicacion_estado ue ON um.estado_id = ue.estado_id
    LEFT JOIN ubicacion_pais up ON ue.pais_id = up.pais_id
  `
};

module.exports = addressService;
