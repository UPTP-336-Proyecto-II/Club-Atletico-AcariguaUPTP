const pool = require('../config/database');

// Lista de preguntas predefinidas
const PREGUNTAS_DISPONIBLES = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es el nombre de tu mejor amigo de infancia?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál era el nombre de tu escuela primaria?',
    '¿Cuál es tu equipo de fútbol favorito?',
    '¿Cuál es el nombre de tu madre?',
    '¿Cuál es tu película favorita?'
];

// Obtener lista de preguntas disponibles
const getPreguntasDisponibles = (req, res) => {
    res.json(PREGUNTAS_DISPONIBLES);
};

// Guardar preguntas de seguridad para un usuario
const guardarPreguntas = async (req, res) => {
    try {
        const { usuario_id, pregunta_1, respuesta_1, pregunta_2, respuesta_2 } = req.body;

        if (!usuario_id || !pregunta_1 || !respuesta_1 || !pregunta_2 || !respuesta_2) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Normalizar respuestas a minúsculas
        const resp1 = respuesta_1.toLowerCase().trim();
        const resp2 = respuesta_2.toLowerCase().trim();

        // Verificar si ya existen preguntas para este usuario
        const [existing] = await pool.execute(
            'SELECT id FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        if (existing.length > 0) {
            // Actualizar
            await pool.execute(
                `UPDATE preguntas_seguridad 
         SET pregunta_1 = ?, respuesta_1 = ?, pregunta_2 = ?, respuesta_2 = ?
         WHERE usuario_id = ?`,
                [pregunta_1, resp1, pregunta_2, resp2, usuario_id]
            );
        } else {
            // Insertar
            await pool.execute(
                `INSERT INTO preguntas_seguridad (usuario_id, pregunta_1, respuesta_1, pregunta_2, respuesta_2)
         VALUES (?, ?, ?, ?, ?)`,
                [usuario_id, pregunta_1, resp1, pregunta_2, resp2]
            );
        }

        res.json({ message: 'Preguntas de seguridad guardadas exitosamente' });
    } catch (error) {
        console.error('Error guardando preguntas:', error);
        res.status(500).json({ error: 'Error al guardar preguntas de seguridad' });
    }
};

// Obtener preguntas de un usuario (solo las preguntas, no las respuestas)
const obtenerPreguntasPorEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'El email es requerido' });
        }

        // Buscar usuario por email
        const [usuarios] = await pool.execute(
            'SELECT usuario_id FROM usuarios WHERE LOWER(email) = ? AND estatus = ?',
            [email.toLowerCase(), 'ACTIVO']
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'No se encontró un usuario activo con ese email' });
        }

        const usuario_id = usuarios[0].usuario_id;

        // Buscar preguntas
        const [preguntas] = await pool.execute(
            'SELECT pregunta_1, pregunta_2 FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        if (preguntas.length === 0) {
            return res.status(404).json({ error: 'Este usuario no tiene preguntas de seguridad configuradas' });
        }

        res.json({
            usuario_id,
            pregunta_1: preguntas[0].pregunta_1,
            pregunta_2: preguntas[0].pregunta_2
        });
    } catch (error) {
        console.error('Error obteniendo preguntas:', error);
        res.status(500).json({ error: 'Error al obtener preguntas de seguridad' });
    }
};

// Verificar solo las respuestas (sin cambiar contraseña)
const verificarSoloRespuestas = async (req, res) => {
    try {
        const { usuario_id, respuesta_1, respuesta_2 } = req.body;

        if (!usuario_id || !respuesta_1 || !respuesta_2) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Obtener respuestas guardadas
        const [preguntas] = await pool.execute(
            'SELECT respuesta_1, respuesta_2 FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        if (preguntas.length === 0) {
            return res.status(404).json({ error: 'No se encontraron preguntas de seguridad' });
        }

        const resp1Normalizada = respuesta_1.toLowerCase().trim();
        const resp2Normalizada = respuesta_2.toLowerCase().trim();

        // Comparar respuestas
        if (resp1Normalizada !== preguntas[0].respuesta_1 || resp2Normalizada !== preguntas[0].respuesta_2) {
            return res.status(401).json({ error: 'Las respuestas no son correctas' });
        }

        res.json({ message: 'Respuestas verificadas correctamente', verified: true });
    } catch (error) {
        console.error('Error verificando respuestas:', error);
        res.status(500).json({ error: 'Error al verificar respuestas' });
    }
};

// Verificar respuestas y permitir cambio de contraseña
const verificarRespuestasYCambiarPassword = async (req, res) => {
    try {
        const { usuario_id, respuesta_1, respuesta_2, nueva_password } = req.body;

        if (!usuario_id || !respuesta_1 || !respuesta_2 || !nueva_password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Validar nueva contraseña
        if (nueva_password.length < 12) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 12 caracteres' });
        }

        // Obtener respuestas guardadas
        const [preguntas] = await pool.execute(
            'SELECT respuesta_1, respuesta_2 FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        if (preguntas.length === 0) {
            return res.status(404).json({ error: 'No se encontraron preguntas de seguridad' });
        }

        const resp1Normalizada = respuesta_1.toLowerCase().trim();
        const resp2Normalizada = respuesta_2.toLowerCase().trim();

        // Comparar respuestas
        if (resp1Normalizada !== preguntas[0].respuesta_1 || resp2Normalizada !== preguntas[0].respuesta_2) {
            return res.status(401).json({ error: 'Las respuestas no son correctas' });
        }

        // Actualizar contraseña
        await pool.execute(
            'UPDATE usuarios SET password = ?, token = NULL WHERE usuario_id = ?',
            [nueva_password, usuario_id]
        );

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error verificando respuestas:', error);
        res.status(500).json({ error: 'Error al verificar respuestas' });
    }
};

// Verificar si un usuario tiene preguntas configuradas
const tienePreguntas = async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const [preguntas] = await pool.execute(
            'SELECT id FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        res.json({ tiene_preguntas: preguntas.length > 0 });
    } catch (error) {
        console.error('Error verificando preguntas:', error);
        res.status(500).json({ error: 'Error al verificar preguntas' });
    }
};

// Obtener preguntas y respuestas de un usuario (para edición - protegido)
const obtenerPreguntasRespuestasUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const [preguntas] = await pool.execute(
            'SELECT pregunta_1, respuesta_1, pregunta_2, respuesta_2 FROM preguntas_seguridad WHERE usuario_id = ?',
            [usuario_id]
        );

        if (preguntas.length === 0) {
            return res.json({ tiene_preguntas: false });
        }

        res.json({
            tiene_preguntas: true,
            pregunta_1: preguntas[0].pregunta_1,
            respuesta_1: preguntas[0].respuesta_1,
            pregunta_2: preguntas[0].pregunta_2,
            respuesta_2: preguntas[0].respuesta_2
        });
    } catch (error) {
        console.error('Error obteniendo preguntas de usuario:', error);
        res.status(500).json({ error: 'Error al obtener preguntas de seguridad' });
    }
};

module.exports = {
    getPreguntasDisponibles,
    guardarPreguntas,
    obtenerPreguntasPorEmail,
    verificarSoloRespuestas,
    verificarRespuestasYCambiarPassword,
    tienePreguntas,
    obtenerPreguntasRespuestasUsuario
};
