const pool = require('../config/database');
const { isLegacySchema } = require('../services/schemaService');

// Obtener todas las fichas médicas
const getFichasMedicas = async (req, res) => {
    try {
        const { atleta_id } = req.query;
        const legacySchema = await isLegacySchema();

        let query = legacySchema 
            ? `SELECT f.ficha_id, f.atleta_id, f.grupo_sanguineo as tipo_sanguineo, f.alergias, 
                      f.antecedentes_quirurgicos as lesion, f.condicion_cronica as condicion_medica, 
                      f.medicacion_actual as observacion, f.antecedentes_familiares, f.updated_at,
                      a.nombre as atleta_nombre, a.apellido as atleta_apellido
               FROM ficha_medica f
               LEFT JOIN atletas a ON f.atleta_id = a.atleta_id`
            : `SELECT f.*,
                      a.nombre as atleta_nombre,
                      a.apellido as atleta_apellido
               FROM ficha_medica f
               LEFT JOIN atletas a ON f.atleta_id = a.atleta_id`;

        const params = [];

        if (atleta_id) {
            query += ' WHERE f.atleta_id = ?';
            params.push(atleta_id);
        }

        query += legacySchema ? ' ORDER BY f.updated_at DESC' : ' ORDER BY f.created_at DESC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo fichas médicas:', error);
        res.status(500).json({ error: 'Error al obtener fichas médicas' });
    }
};

const getFichaMedicaByAtleta = async (req, res) => {
    try {
        const { atleta_id } = req.params;
        const legacySchema = await isLegacySchema();

        const query = legacySchema
            ? `SELECT f.ficha_id, f.atleta_id, f.grupo_sanguineo as tipo_sanguineo, f.alergias, 
                      f.antecedentes_quirurgicos as lesion, f.condicion_cronica as condicion_medica, 
                      f.medicacion_actual as observacion, f.antecedentes_familiares, f.updated_at,
                      a.nombre as atleta_nombre, a.apellido as atleta_apellido
               FROM ficha_medica f
               LEFT JOIN atletas a ON f.atleta_id = a.atleta_id
               WHERE f.atleta_id = ? `
            : `SELECT f.*,
                      a.nombre as atleta_nombre,
                      a.apellido as atleta_apellido
               FROM ficha_medica f
               LEFT JOIN atletas a ON f.atleta_id = a.atleta_id
               WHERE f.atleta_id = ? `;

        const [rows] = await pool.execute(query, [atleta_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ficha médica no encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo ficha médica:', error);
        res.status(500).json({ error: 'Error al obtener ficha médica' });
    }
};

// Crear ficha médica
const createFichaMedica = async (req, res) => {
    try {
        const {
            atleta_id,
            alergias,
            tipo_sanguineo,
            lesion,
            condicion_medica,
            observacion
        } = req.body;

        const legacySchema = await isLegacySchema();

        // Verificar si ya existe ficha para este atleta
        const [existing] = await pool.execute(
            'SELECT ficha_id FROM ficha_medica WHERE atleta_id = ?',
            [atleta_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Ya existe una ficha médica para este atleta' });
        }

        let result;
        if (legacySchema) {
            [result] = await pool.execute(
                `INSERT INTO ficha_medica
                (atleta_id, grupo_sanguineo, alergias, antecedentes_quirurgicos, condicion_cronica, medicacion_actual)
                VALUES(?, ?, ?, ?, ?, ?)`,
                [atleta_id, tipo_sanguineo || 'O+', alergias, lesion, condicion_medica, observacion]
            );
        } else {
            [result] = await pool.execute(
                `INSERT INTO ficha_medica
                (atleta_id, alergias, tipo_sanguineo, lesion, condicion_medica, observacion)
                VALUES(?, ?, ?, ?, ?, ?)`,
                [atleta_id, alergias, tipo_sanguineo, lesion, condicion_medica, observacion]
            );
        }

        res.status(201).json({
            message: 'Ficha médica creada exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creando ficha médica:', error);
        res.status(500).json({ error: 'Error al crear ficha médica' });
    }
};

// Actualizar ficha médica
const updateFichaMedica = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            alergias,
            tipo_sanguineo,
            lesion,
            condicion_medica,
            observacion
        } = req.body;

        const legacySchema = await isLegacySchema();

        let result;
        if (legacySchema) {
            [result] = await pool.execute(
                `UPDATE ficha_medica 
                 SET alergias = ?, grupo_sanguineo = ?, antecedentes_quirurgicos = ?, condicion_cronica = ?, medicacion_actual = ?
                 WHERE ficha_id = ? `,
                [alergias, tipo_sanguineo || 'O+', lesion, condicion_medica, observacion, id]
            );
        } else {
            [result] = await pool.execute(
                `UPDATE ficha_medica 
                 SET alergias = ?, tipo_sanguineo = ?, lesion = ?, condicion_medica = ?, observacion = ?
                 WHERE ficha_id = ? `,
                [alergias, tipo_sanguineo, lesion, condicion_medica, observacion, id]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ficha médica no encontrada' });
        }

        res.json({ message: 'Ficha médica actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando ficha médica:', error);
        res.status(500).json({ error: 'Error al actualizar ficha médica' });
    }
};

module.exports = {
    getFichasMedicas,
    getFichaMedicaByAtleta,
    createFichaMedica,
    updateFichaMedica
};
