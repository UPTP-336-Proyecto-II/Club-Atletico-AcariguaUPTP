const pool = require('../config/database');
const { isLegacySchema, isMigratedLegacySchema } = require('./schemaService');

const addressService = {
    async findOrCreateAddress(addressData) {
        const { pais, estado, municipio, parroquia, descripcion_descriptiva } = addressData;
        const legacySchema = await isLegacySchema();
        const migratedLegacySchema = await isMigratedLegacySchema();

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let direccionId;

            if (legacySchema) {
                const estadoName = estado || '';
                const municipioName = municipio || '';
                const parroquiaName = parroquia || '';
                const localidad = descripcion_descriptiva || '';

                if (migratedLegacySchema) {
                    // Migrated legacy schema: 'parroquias' table is gone, 'direcciones' has direct columns
                    const [dirRes] = await connection.execute(
                        'INSERT INTO direcciones (parroquias_id, pais, estado, municipio, parroquia, descripcion_descriptiva, localidad, tipo_vivienda, `ubicación vivienda`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [0, pais || 'Venezuela', estadoName, municipioName, parroquiaName, localidad, localidad, '', '']
                    );
                    direccionId = dirRes.insertId;
                } else {
                    let parroquiaId = null;

                    if (estadoName) {
                        const [estRows] = await connection.execute(
                            'SELECT estado_id FROM estados WHERE UPPER(estado) = UPPER(?)',
                            [estadoName]
                        );
                        let estadoId;
                        if (estRows.length > 0) {
                            estadoId = estRows[0].estado_id;
                        } else {
                            const [res] = await connection.execute(
                                'INSERT INTO estados (estado) VALUES (?)',
                                [estadoName]
                            );
                            estadoId = res.insertId;
                        }

                        if (municipioName && estadoId) {
                            const [munRows] = await connection.execute(
                                'SELECT municipio_id FROM municipios WHERE UPPER(municipio) = UPPER(?) AND estadoi_id = ?',
                                [municipioName, estadoId]
                            );
                            let municipioId;
                            if (munRows.length > 0) {
                                municipioId = munRows[0].municipio_id;
                            } else {
                                const [res] = await connection.execute(
                                    'INSERT INTO municipios (municipio, estadoi_id) VALUES (?, ?)',
                                    [municipioName, estadoId]
                                );
                                municipioId = res.insertId;
                            }

                            if (parroquiaName && municipioId) {
                                const [parRows] = await connection.execute(
                                    'SELECT parroquia_id FROM parroquias WHERE UPPER(parroquia) = UPPER(?) AND municipio_id = ?',
                                    [parroquiaName, municipioId]
                                );
                                if (parRows.length > 0) {
                                    parroquiaId = parRows[0].parroquia_id;
                                } else {
                                    const [res] = await connection.execute(
                                        'INSERT INTO parroquias (parroquia, municipio_id) VALUES (?, ?)',
                                        [parroquiaName, municipioId]
                                    );
                                    parroquiaId = res.insertId;
                                }
                            }
                        }
                    }

                    const [dirRes] = await connection.execute(
                        'INSERT INTO direcciones (parroquias_id, localidad, tipo_vivienda, `ubicación vivienda`) VALUES (?, ?, ?, ?)',
                        [parroquiaId || 0, localidad, '', localidad]
                    );
                    direccionId = dirRes.insertId;
                }

            } else {
                const paisName = pais || 'Venezuela';
                const estadoName = estado || '';
                const municipioName = municipio || '';
                const parroquiaName = parroquia || '';

                let paisId;
                const [paisRows] = await connection.execute('SELECT pais_id FROM ubicacion_pais WHERE UPPER(nombre) = UPPER(?)', [paisName]);
                if (paisRows.length > 0) {
                    paisId = paisRows[0].pais_id;
                } else {
                    const [res] = await connection.execute('INSERT INTO ubicacion_pais (nombre) VALUES (?)', [paisName]);
                    paisId = res.insertId;
                }

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

                const puntoReferencia = descripcion_descriptiva || '';
                const [dirRes] = await connection.execute(
                    'INSERT INTO direcciones (parroquia_id, punto_referencia) VALUES (?, ?)',
                    [parroquiaId, puntoReferencia]
                );
                direccionId = dirRes.insertId;
            }

            await connection.commit();
            return direccionId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async getSelectColumnsForSchema() {
        const legacySchema = await isLegacySchema();
        const migratedLegacySchema = await isMigratedLegacySchema();

        if (legacySchema) {
            if (migratedLegacySchema) {
                return `
                    d.estado as estado,
                    d.municipio as municipio,
                    d.parroquia as parroquia,
                    d.descripcion_descriptiva as descripcion_descriptiva,
                    d.pais as pais
                `;
            }
            return `
                e.estado as estado,
                m.municipio as municipio,
                p.parroquia as parroquia,
                d.localidad as descripcion_descriptiva,
                'Venezuela' as pais
            `;
        }
        return `
            up.nombre as pais, 
            ue.nombre as estado, 
            um.nombre as municipio, 
            upa.nombre as parroquia, 
            d.punto_referencia as descripcion_descriptiva
        `;
    },

    async getJoinsForSchema(entityAlias) {
        const legacySchema = await isLegacySchema();
        const migratedLegacySchema = await isMigratedLegacySchema();

        if (legacySchema) {
            if (migratedLegacySchema) {
                return `LEFT JOIN direcciones d ON ${entityAlias}.direccion_id = d.direccion_id`;
            }
            return `
                LEFT JOIN direcciones d ON ${entityAlias}.direccion_id = d.direccion_id
                LEFT JOIN parroquias p ON d.parroquias_id = p.parroquia_id
                LEFT JOIN municipios m ON p.municipio_id = m.municipio_id
                LEFT JOIN estados e ON m.estadoi_id = e.estado_id
            `;
        }
        return `
            LEFT JOIN direcciones d ON ${entityAlias}.direccion_id = d.direccion_id
            LEFT JOIN ubicacion_parroquia upa ON d.parroquia_id = upa.parroquia_id
            LEFT JOIN ubicacion_municipio um ON upa.municipio_id = um.municipio_id
            LEFT JOIN ubicacion_estado ue ON um.estado_id = ue.estado_id
            LEFT JOIN ubicacion_pais up ON ue.pais_id = up.pais_id
        `;
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
    `,

    getLegacySelectColumns: (isMigrated = false) => {
        if (isMigrated) {
            return `
                d.estado as estado,
                d.municipio as municipio,
                d.parroquia as parroquia,
                d.descripcion_descriptiva as descripcion_descriptiva,
                d.pais as pais
            `;
        }
        return `
            e.estado as estado,
            m.municipio as municipio,
            p.parroquia as parroquia,
            d.localidad as descripcion_descriptiva,
            'Venezuela' as pais
        `;
    },

    getLegacyJoins: (entityAlias, isMigrated = false) => {
        if (isMigrated) {
            return `LEFT JOIN direcciones d ON ${entityAlias}.direccion_id = d.direccion_id`;
        }
        return `
            LEFT JOIN direcciones d ON ${entityAlias}.direccion_id = d.direccion_id
            LEFT JOIN parroquias p ON d.parroquias_id = p.parroquia_id
            LEFT JOIN municipios m ON p.municipio_id = m.municipio_id
            LEFT JOIN estados e ON m.estadoi_id = e.estado_id
        `;
    }
};

module.exports = addressService;
