const express = require('express');
const router = express.Router();
const {
    getPreguntasDisponibles,
    guardarPreguntas,
    obtenerPreguntasPorEmail,
    verificarSoloRespuestas,
    verificarRespuestasYCambiarPassword,
    tienePreguntas,
    obtenerPreguntasRespuestasUsuario
} = require('../controllers/preguntasSeguridadController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas (para recuperación de contraseña)
router.get('/disponibles', getPreguntasDisponibles);
router.get('/por-email', obtenerPreguntasPorEmail);
router.post('/verificar-respuestas', verificarSoloRespuestas);
router.post('/verificar-y-cambiar', verificarRespuestasYCambiarPassword);

// Rutas protegidas (requieren autenticación)
router.post('/guardar', verifyToken, guardarPreguntas);
router.get('/tiene/:usuario_id', verifyToken, tienePreguntas);
router.get('/usuario/:usuario_id', verifyToken, obtenerPreguntasRespuestasUsuario);

module.exports = router;
