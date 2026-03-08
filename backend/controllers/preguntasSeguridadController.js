const pool = require('../config/database');
// const bcrypt = require('bcryptjs'); // Removed unused dependency to prevent load errors
// loginController uses plain text comparison: if (password !== user.password)
// validamos si usamos bcrypt o no. En loginController no usan hash... 
// Pero para seguridad deberíamos.
// Por ahora usaré texto plano si asi está el login, o mejor, simplemente comparo strings.

// Obtener preguntas disponibles (catálogo)
const getPreguntasDisponibles = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM preguntas_seguridad');
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo preguntas:', error);
        res.status(500).json({ error: 'Error al obtener preguntas de seguridad' });
    }
};

// Guardar respuestas de seguridad de un usuario
const guardarPreguntas = async (req, res) => {
    try {
        const userId = req.userId; // Ahora es el email
        const { preguntas } = req.body; // Array de { pregunta_id, respuesta }

        if (!preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
            return res.status(400).json({ error: 'Se requieren preguntas y respuestas' });
        }

        // Primero borramos las existentes para permitir actualización completa
        await pool.execute('DELETE FROM respuesta_seguridad WHERE email_id = ?', [userId]);

        // Insertamos las nuevas
        for (const p of preguntas) {
            await pool.execute(
                'INSERT INTO respuesta_seguridad (email_id, pregunta_id, respuesta) VALUES (?, ?, ?)',
                [userId, p.pregunta_id, p.respuesta.toLowerCase().trim()]
            );
        }

        res.json({ message: 'Preguntas de seguridad guardadas exitosamente' });

    } catch (error) {
        console.error('Error guardando preguntas:', error);
        res.status(500).json({ error: 'Error al guardar preguntas de seguridad' });
    }
};

// Verificar si un usuario ya tiene preguntas configuradas
const tienePreguntas = async (req, res) => {
    try {
        const { usuario_id } = req.params; // Ahora recibimos email
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM respuesta_seguridad WHERE email_id = ?',
            [usuario_id]
        );

        res.json({ tiene: rows[0].count > 0 });
    } catch (error) {
        console.error('Error verificando preguntas:', error);
        res.status(500).json({ error: 'Error al verificar preguntas' });
    }
};

// Obtener preguntas configuradas por email (para flujo de recuperación)
// No devolvemos las respuestas, solo las preguntas
const obtenerPreguntasPorEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        // Verificar que el usuario existe (email es PK)
        const [users] = await pool.execute('SELECT email FROM usuarios WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const [preguntas] = await pool.execute(`
            SELECT p.preguntas_id, p.preguntas 
            FROM preguntas_seguridad p
            JOIN respuesta_seguridad rs ON p.preguntas_id = rs.pregunta_id
            WHERE rs.email_id = ?
        `, [email]);

        if (preguntas.length === 0) {
            return res.status(400).json({ error: 'El usuario no tiene preguntas de seguridad configuradas' });
        }

        res.json({ email: email, preguntas });

    } catch (error) {
        console.error('Error obteniendo preguntas por email:', error);
        res.status(500).json({ error: 'Error al obtener preguntas' });
    }
};

// Verificar respuestas (paso intermedio)
const verificarSoloRespuestas = async (req, res) => {
    try {
        const { usuario_id, respuestas } = req.body; // usuario_id ahora es email

        console.log('Verificando respuestas para usuario:', usuario_id);
        console.log('Respuestas recibidas:', respuestas);

        // Obtener respuestas guardadas
        const [guardadas] = await pool.execute(
            'SELECT pregunta_id, respuesta FROM respuesta_seguridad WHERE email_id = ?',
            [usuario_id]
        );

        console.log('Respuestas guardadas:', guardadas);

        if (guardadas.length === 0) {
            return res.status(400).json({ error: 'Usuario sin preguntas configuradas' });
        }

        let valid = true;
        for (const g of guardadas) {
            // Convertir pregunta_id a string para comparar con las claves del objeto
            const respuestaUsuario = respuestas[String(g.pregunta_id)];
            const respuestaGuardada = g.respuesta;
            const respuestaUsuarioNormalizada = respuestaUsuario ? respuestaUsuario.toLowerCase().trim() : '';

            console.log(`Pregunta ${g.pregunta_id}: Usuario="${respuestaUsuarioNormalizada}" vs Guardada="${respuestaGuardada}"`);

            if (!respuestaUsuario || respuestaUsuarioNormalizada !== respuestaGuardada) {
                valid = false;
                break;
            }
        }

        if (valid) {
            res.json({ message: 'Respuestas correctas' });
        } else {
            res.status(400).json({ error: 'Respuestas incorrectas' });
        }

    } catch (error) {
        console.error('Error verificando respuestas:', error);
        res.status(500).json({ error: 'Error al verificar respuestas' });
    }
};

// Verificar respuestas y cambiar contraseña
const verificarRespuestasYCambiarPassword = async (req, res) => {
    try {
        const { usuario_id, respuestas, newPassword } = req.body;

        // 1. Verificar respuestas
        const [guardadas] = await pool.execute(
            'SELECT pregunta_id, respuesta FROM respuesta_seguridad WHERE email_id = ?',
            [usuario_id]
        );

        if (guardadas.length === 0) {
            return res.status(400).json({ error: 'Usuario sin preguntas configuradas' });
        }

        let valid = true;
        for (const g of guardadas) {
            // Convertir pregunta_id a string para comparar con las claves del objeto
            const respuestaUsuario = respuestas[String(g.pregunta_id)];
            const respuestaGuardada = g.respuesta;
            const respuestaUsuarioNormalizada = respuestaUsuario ? respuestaUsuario.toLowerCase().trim() : '';

            if (!respuestaUsuario || respuestaUsuarioNormalizada !== respuestaGuardada) {
                valid = false;
                break;
            }
        }

        if (!valid) {
            return res.status(400).json({ error: 'Respuestas incorrectas' });
        }

        // 2. Cambiar contraseña
        // updateUsuario o directo update
        await pool.execute(
            'UPDATE usuarios SET password = ? WHERE email = ?',
            [newPassword, usuario_id]
        );

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
};

// Obtener preguntas y respuestas del usuario (para mostrar en perfil si se desea editar)
const obtenerPreguntasRespuestasUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params; // Ahora es email

        const [rows] = await pool.execute(`
            SELECT rs.pregunta_id, rs.respuesta, p.preguntas
            FROM respuesta_seguridad rs
            JOIN preguntas_seguridad p ON rs.pregunta_id = p.preguntas_id
            WHERE rs.email_id = ?
        `, [usuario_id]);

        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo respuestas usuario:', error);
        res.status(500).json({ error: 'Error al obtener información' });
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
