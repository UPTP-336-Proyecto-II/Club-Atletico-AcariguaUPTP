<template>
  <footer id="footer" class="footer">
    <div class="footer-content">
      <div class="footer-grid">
        <!-- Columna 1: Marca -->
        <div class="footer-column brand-column">
          <div class="footer-logo">
            <img src="../../assets/icons/logo.png" class="logo-icon">
            <div class="logo-text">
              <span class="club-name">Club Atlético</span>
              <span class="club-subname">Deportivo Acarigua</span>
              <span class="club-motto">"La Armadura de Dios"</span>
            </div>
          </div>
          <p class="brand-info">
            Asociación Civil - RIF: J-503114630<br>
            Afiliada a la Asociación de Fútbol de Portuguesa
          </p>
        </div>

        <!-- Columna 2: Contacto -->
        <div class="footer-column">
          <h3 class="column-title">Contacto</h3>
          <ul class="contact-list">
            <li>
              <div class="contact-item">
                <a href="https://wa.me/5841215562442" target="_blank" rel="noopener" class="icon-link">
                  <img src="../../assets/icons/whatsapp-icon.png" alt="Whatsapp" class="contact-icon">
                </a>
                <span class="static-text">+58 412-15562442</span>
              </div>
            </li>
            <li>
              <div class="contact-item">
                <a href="mailto:clubatleticodeportivoacarigua@gmail.com" class="icon-link">
                  <img src="../../assets/icons/email-icon.png" alt="Email" class="contact-icon">
                </a>
                <span class="static-text">Clubatleticodeportivoacarigua@gmail.com</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Ubicación -->
        <div class="footer-column">
          <h3 class="column-title">Ubicación</h3>
          <div class="contact-item">
            <a
              href="https://www.google.com/maps/place/Universidad+Polit%C3%A9cnica+Territorial+de+Puerto+Cabello/@10.4578943,-68.0537897,17z/data=!4m6!3m5!1s0x8e8054018566d7a3:0x70a7d25b77dc46ff!8m2!3d10.4577097!4d-68.0527812!16s%2Fg%2F1hc63v0bq?entry=ttu&g_ep=EgoyMDI1MTExMi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener"
              class="icon-link"
            >
              <img src="../../assets/icons/maps-icon.png" alt="Ubicación" class="contact-icon">
            </a>
            <span class="static-text">U.P.T.P Juan de Jesús Montilla<br>Acarigua, Portuguesa</span>
          </div>
        </div>

        <!-- Columna 4: Redes -->
        <div class="footer-column">
          <h3 class="column-title">Redes</h3>
          <ul class="contact-list">
            <li>
              <div class="contact-item">
                <a href="https://www.facebook.com/profile.php?id=100086449924024" target="_blank" rel="noopener" class="icon-link">
                  <img src="../../assets/icons/facebook-icon.png" alt="Facebook" class="contact-icon">
                </a>
                <span class="static-text">CLUB atlético Deportivo acarigua</span>
              </div>
            </li>
            <li>
              <div class="contact-item">
                <a href="https://instagram.com/Deportivoacarigua_oficial" target="_blank" rel="noopener" class="icon-link">
                  <img src="../../assets/icons/instagram-icon.png" alt="Instagram" class="contact-icon">
                </a>
                <span class="static-text">deportivoacarigua_oficial</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-divider" />

      <div class="footer-bottom">
        <div class="copyright-section">
          <p>&copy; 2025 - 2026 <strong>Asociación Civil “Club Atlético Deportivo Acarigua”</strong>. Todos los derechos reservados.</p>
          <p class="credits">
            Sistema Antropométrico desarrollado por el Equipo de Proyecto II - UPTP.
            <a href="#" class="license-link" @click.prevent="licenseVisible = true">Ver Licencia MIT</a>
          </p>
        </div>
        <p class="ministerio-info">Inscrito en el Ministerio del Poder Popular del Deporte</p>
      </div>
    </div>
    <el-dialog
      title="Licencia de Software"
      :visible.sync="licenseVisible"
      width="60%"
      append-to-body
      custom-class="license-modal"
    >
      <div class="license-content">
        <h3>LICENCIA DE SOFTWARE - PROYECTO II UPTP</h3>
        <p><strong>Copyright (c) 2025 - 2026</strong></p>

        <h4>Autores:</h4>
        <ul>
          <li>Colmenarez S. Luis A. (V-27.414.006)</li>
          <li>Legón F. Robert A. (V-31.492.108)</li>
          <li>Gómez C. Sergio J. (V-30.966.012)</li>
          <li>Medina A. Gabriela N. (V-30.239.788)</li>
          <li>Torrealba E. Albany P. (V-30.440.776)</li>
          <li>Abreu A. José A. (V-31.558.506)</li>
        </ul>

        <h4>Título del Proyecto:</h4>
        <p>"Aplicación Web para la recopilación, monitoreo y análisis antropométrico del rendimiento deportivo"</p>

        <h4>Comunidad Beneficiada:</h4>
        <p>Asociación Civil “Club Atlético Deportivo Acarigua” (RIF: J-503114630)</p>

        <h4>Institución:</h4>
        <p>Universidad Politécnica Territorial de Portuguesa "Juan de Jesús Montilla" (UPTP)<br>
          Docente: Elsio Sánchez | Tutor: Juan Carlos Esteller</p>

        <hr>

        <p class="license-tech">
          Este software incluye componentes de terceros bajo la siguiente licencia:<br>
          Copyright (c) 2017-present PanJiaChen (MIT License)
        </p>

        <hr>

        <h4>POR LA PRESENTE SE CONCEDE PERMISO:</h4>
        <p>
          Se otorga permiso, sin cargo, a cualquier persona que obtenga una copia de este software y los archivos de documentación asociados (el "Software"), para utilizar el Software sin restricción, incluyendo, sin limitación, los derechos de usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o entregar copias del Software a la comunidad beneficiaria, bajo las siguientes condiciones:
        </p>
        <p>
          1. El aviso de copyright anterior y este aviso de permiso se incluirán en todas las copias o partes sustanciales del Software.
        </p>
        <p>
          2. EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A GARANTÍAS DE COMERCIALIZACIÓN, IDONEIDAD PARA UN PROPÓSITO PARTICULAR Y NO INFRACCIÓN.
        </p>
        <p>
          3. EN NINGÚN CASO LOS AUTORES O TITULARES DEL COPYRIGHT SERÁN RESPONSABLES DE NINGUNA RECLAMACIÓN, DAÑO U OTRA RESPONSABILIDAD, YA SEA EN UNA ACCIÓN DE CONTRATO, AGRAVIO O DE OTRO MODO, QUE SURJA DE, FUERA DE O EN CONEXIÓN CON EL SOFTWARE O EL USO U OTROS TRATOS EN EL SOFTWARE.
        </p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="licenseVisible = false">Cerrar</el-button>
      </span>
    </el-dialog>
  </footer>
</template>

<script>
export default {
  name: 'LandingFooter',
  data() {
    return {
      licenseVisible: false
    }
  }
}
</script>

<style scoped>
.footer {
  background: var(--color-text-dark);
  color: var(--color-background);
  padding: 4rem 0 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Grid Layout */
.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 0.8fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

/* Marca */
.footer-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.logo-icon {
  height: 55px;
  width: auto;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.club-name {
  font-size: 1.3rem;
  font-weight: 700;
}

.club-subname {
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.9;
}

.brand-info {
  line-height: 1.6;
  opacity: 0.8;
  font-size: 0.95rem;
}

.club-motto {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-style: italic;
  font-weight: 500;
}

/* Columnas Comunes */
.column-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 2.2rem; /* Ajustado para que el contenido empiece en "La Armadura de Dios" */
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 28px; /* Altura igual al logo para alineación perfecta */
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-list li {
  margin-bottom: 1.25rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.contact-icon {
  width: 33px;
  height: 33px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
  transition: all 0.3s ease;
}

.icon-link:hover {
  background: var(--color-primary);
  transform: scale(1.1);
}

.icon-link:hover .contact-icon {
  opacity: 1;
  filter: brightness(0) invert(1);
}

.static-text {
  line-height: 1.4;
  opacity: 0.85;
}

/* Footer Bottom */
.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

.ministerio-info {
  font-size: 0.8rem;
  opacity: 0.8;
}

.copyright-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.credits {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.license-link {
  color: var(--color-primary);
  text-decoration: none;
  margin-left: 5px;
  opacity: 0.8;
  transition: opacity 0.3s;
  cursor: pointer;
}

.license-link:hover {
  opacity: 1;
  text-decoration: underline;
}

/* License Modal Styles */
.license-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  line-height: 1.6;
  color: #2c3e50;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.license-content h3 {
  color: #E51D22;
  margin-bottom: 1rem;
}

.license-content h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: #444;
}

.license-content p {
  margin-bottom: 1rem;
  text-align: justify;
}

.license-content ul {
  padding-left: 20px;
}

.license-content hr {
  border: 0;
  border-top: 1px solid #eee;
  margin: 2rem 0;
}

.license-tech {
  font-family: monospace;
  background: #f4f4f5;
  padding: 10px;
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1.5fr 1fr;
    gap: 2.5rem;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 2.5rem 0 1.5rem;
  }

  .footer-content {
    padding: 0 1.5rem;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .footer-logo {
    justify-content: center;
  }

  .contact-item {
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
  }

  .static-text {
    text-align: center;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .copyright-section {
    order: 2;
  }

  .ministerio-info {
    order: 1;
  }

  /* Modal responsive */
  .license-modal {
    width: 95% !important;
  }

  .license-content {
    max-height: 55vh;
    padding-right: 5px;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 2rem 0 1rem;
  }

  .footer-content {
    padding: 0 1rem;
  }

  .club-name {
    font-size: 1.1rem;
  }

  .club-subname {
    font-size: 0.85rem;
  }

  .column-title {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }

  .contact-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .static-text {
    font-size: 0.85rem;
  }

  .logo-icon {
    height: 45px;
  }

  .brand-info {
    font-size: 0.85rem;
  }

  .credits {
    font-size: 0.75rem;
  }
}
</style>
