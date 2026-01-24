<template>
  <div class="atletas-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>
            <i class="el-icon-user" /> Gestión de Atletas
            <el-tag v-if="!canUserEdit && !isUserMedico" type="info" size="small" style="margin-left: 10px;">
              Solo Lectura
            </el-tag>
            <el-tag v-if="isUserMedico" type="warning" size="small" style="margin-left: 10px;">
              Acceso Médico
            </el-tag>
          </h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
        <el-button v-if="canUserEdit" type="primary" icon="el-icon-plus" @click="openAtletaModal(false)">
          Agregar Atleta
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de atletas -->
      <aside class="sidebar">
        <el-card shadow="hover">
          <div slot="header" class="sidebar-header">
            <span><i class="el-icon-user" /> Lista de Atletas</span>
            <el-popover
              placement="bottom-end"
              width="250"
              trigger="click"
            >
              <div class="filter-popover">
                <h4>Filtros Avanzados</h4>
                <div class="filter-item">
                  <label>Categoría</label>
                  <el-select v-model="filterCategoria" placeholder="Todas" clearable size="small" style="width: 100%">
                    <el-option
                      v-for="cat in categorias"
                      :key="cat.categoria_id"
                      :label="cat.nombre_categoria"
                      :value="cat.categoria_id"
                    />
                  </el-select>
                </div>
                <div class="filter-item">
                  <label>Estatus</label>
                  <el-select v-model="filterEstatus" placeholder="Predeterminado" clearable size="small" style="width: 100%">
                    <el-option label="Activos / Lesionados" value="" />
                    <el-option label="Activo" value="ACTIVO" />
                    <el-option label="Inactivo" value="INACTIVO" />
                    <el-option label="Lesionado" value="LESIONADO" />
                    <el-option label="Suspendido" value="SUSPENDIDO" />
                    <el-option label="Ver Todos" value="TODOS" />
                  </el-select>
                </div>
              </div>
              <el-button slot="reference" type="text" icon="el-icon-s-operation" class="filter-btn" />
            </el-popover>
          </div>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="Buscar por nombre..."
              prefix-icon="el-icon-search"
              size="small"
              clearable
            />
          </div>
          <div class="athlete-list">
            <div
              v-for="atleta in atletas"
              :key="atleta.atleta_id"
              class="athlete-item"
              :class="{ active: currentAtletaId === atleta.atleta_id }"
              @click="selectAtleta(atleta.atleta_id)"
            >
              <div class="athlete-photo">
                <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="avatar-img">
                <i v-else class="el-icon-user" />
              </div>
              <div class="athlete-info">
                <h3>{{ atleta.nombre }} {{ atleta.apellido }}</h3>
                <p>{{ atleta.posicion_de_juego || 'Sin posición' }}</p>
                <p>{{ atleta.categoria_nombre || 'Sin categoría' }}</p>
              </div>
            </div>
            <div v-if="atletas.length === 0" class="empty-state">
              <p>No hay atletas registrados</p>
            </div>
          </div>
        </el-card>
      </aside>

      <!-- Área de contenido -->
      <main class="content-area">
        <el-card v-if="!currentAtletaId" shadow="hover">
          <div class="empty-state">
            <i class="el-icon-user-solid" style="font-size: 4rem; color: #ddd;" />
            <h3>No hay atleta seleccionado</h3>
            <p>Selecciona un atleta de la lista o agrega uno nuevo.</p>
          </div>
        </el-card>

        <el-card v-else shadow="hover">
          <!-- Encabezado del atleta -->
          <div class="athlete-details-header">
            <div class="athlete-details-photo">
              <img v-if="currentAtleta.foto" :src="getFotoUrl(currentAtleta.foto)" class="avatar-img-large">
              <i v-else class="el-icon-user" />
            </div>
            <div class="athlete-details-info">
              <h2>{{ currentAtleta.nombre }} {{ currentAtleta.apellido }}</h2>
              <p>Categoría: {{ currentAtleta.categoria_nombre || 'No asignada' }}</p>
              <p>Edad: {{ calculateAge(currentAtleta.fecha_nacimiento) }} años</p>
              <el-tag :type="getStatusType(currentAtleta.estatus)">{{ currentAtleta.estatus }}</el-tag>
            </div>
            <div class="athlete-actions">
              <el-button v-if="!isUserMedico" type="info" icon="el-icon-data-line" @click="goToProgress">Análisis</el-button>
              <el-button v-if="canUserEdit && !isUserMedico" type="danger" icon="el-icon-delete" @click="deleteAtleta">Eliminar</el-button>
              <el-button v-if="canUserEdit || isUserMedico" type="primary" icon="el-icon-edit" @click="handleEdit">Editar</el-button>
            </div>
          </div>

          <!-- Tabs -->
          <el-tabs v-model="activeTab" type="border-card">
            <!-- Tab 1: Datos Personales -->
            <el-tab-pane v-if="isTabVisible('datos-personales')" label="Datos Personales" name="personal">
              <div class="form-grid">
                <div class="form-item">
                  <label>Nombre</label>
                  <p>{{ currentAtleta.nombre }}</p>
                </div>
                <div class="form-item">
                  <label>Apellido</label>
                  <p>{{ currentAtleta.apellido }}</p>
                </div>
                <div class="form-item">
                  <label>Fecha de Nacimiento</label>
                  <p>{{ formatDate(currentAtleta.fecha_nacimiento) }}</p>
                </div>
                <div class="form-item">
                  <label>Edad</label>
                  <p>{{ calculateAge(currentAtleta.fecha_nacimiento) }} años</p>
                </div>
                <div class="form-item">
                  <label>Posición de Juego</label>
                  <p>{{ currentAtleta.posicion_de_juego || 'No especificada' }}</p>
                </div>
                <div class="form-item">
                  <label>Categoría</label>
                  <p>{{ currentAtleta.categoria_nombre || 'No asignada' }}</p>
                </div>
                <div class="form-item">
                  <label>Entrenador a Cargo</label>
                  <p>{{ getEntrenadorNombre(currentAtleta.categoria_id) }}</p>
                </div>
                <div class="form-item">
                  <label>Teléfono</label>
                  <p>{{ currentAtleta.telefono || 'No especificado' }}</p>
                </div>
                <div class="form-item">
                  <label>Estatus</label>
                  <el-tag :type="getStatusType(currentAtleta.estatus)">{{ currentAtleta.estatus }}</el-tag>
                </div>
                <div class="form-item">
                  <label>Pierna Dominante</label>
                  <p>{{ currentAtleta.pierna_dominante || 'Derecha' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Dirección</label>
                  <p>
                    {{ currentAtleta.localidad || '' }}
                    {{ currentAtleta.municipio ? ', ' + currentAtleta.municipio : '' }}
                    {{ currentAtleta.estado ? ', ' + formatEnum(currentAtleta.estado) : '' }}
                    {{ currentAtleta.pais ? ', ' + formatEnum(currentAtleta.pais) : '' }}
                  </p>
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab 2: Ficha Médica -->
            <el-tab-pane v-if="isTabVisible('ficha-medica')" label="Ficha Médica" name="medical">
              <div v-if="fichaMedica" class="form-grid">
                <div class="form-item">
                  <label>Tipo Sanguíneo</label>
                  <p>{{ fichaMedica.tipo_sanguineo || 'No especificado' }}</p>
                </div>
                <div class="form-item">
                  <label>Alergias</label>
                  <p>{{ fichaMedica.alergias || 'Ninguna' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Lesiones</label>
                  <p>{{ fichaMedica.lesion || 'Ninguna' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Condición Médica</label>
                  <p>{{ fichaMedica.condicion_medica || 'Ninguna' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Observaciones</label>
                  <p>{{ fichaMedica.observacion || 'Sin observaciones' }}</p>
                </div>
              </div>
              <div v-else class="empty-tab">
                <i class="el-icon-document" />
                <p>No hay ficha médica registrada</p>
                <p class="hint">Haz clic en "Editar" para crear la ficha médica</p>
              </div>
            </el-tab-pane>

            <!-- Tab 3: Medidas Antropométricas -->
            <el-tab-pane v-if="isTabVisible('medidas-antropometricas')" label="Medidas Antropométricas" name="anthropometric">
              <div v-if="medidas && medidas.length > 0" class="form-grid">
                <div class="form-item">
                  <label>Peso (kg)</label>
                  <p>{{ medidas[0].peso || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Altura (cm)</label>
                  <p>{{ medidas[0].altura || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Índice de Masa Corporal</label>
                  <p>{{ medidas[0].indice_de_masa || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Envergadura (cm)</label>
                  <p>{{ medidas[0].envergadura || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Largo de Pierna (cm)</label>
                  <p>{{ medidas[0].largo_de_pierna || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Largo de Torso (cm)</label>
                  <p>{{ medidas[0].largo_de_torso || '-' }}</p>
                </div>
                <div class="form-item">
                  <label>Fecha de Medición</label>
                  <p>{{ formatDate(medidas[0].fecha_medicion) }}</p>
                </div>
              </div>
              <div v-else class="empty-tab">
                <i class="el-icon-data-line" />
                <p>No hay medidas antropométricas registradas</p>
                <p class="hint">Haz clic en "Editar" para agregar medidas</p>
              </div>
            </el-tab-pane>

            <!-- Tab 4: Rendimiento -->
            <el-tab-pane v-if="isTabVisible('rendimiento')" label="Rendimiento" name="performance">
              <div v-if="tests && tests.length > 0">
                <div class="performance-grid">
                  <div class="performance-item">
                    <h4>Test de Fuerza</h4>
                    <p>{{ tests[0].test_de_fuerza || '-' }}</p>
                  </div>
                  <div class="performance-item">
                    <h4>Test de Resistencia</h4>
                    <p>{{ tests[0].test_resistencia || '-' }}</p>
                  </div>
                  <div class="performance-item">
                    <h4>Test de Velocidad</h4>
                    <p>{{ tests[0].test_velocidad || '-' }}</p>
                  </div>
                  <div class="performance-item">
                    <h4>Test de Coordinación</h4>
                    <p>{{ tests[0].test_coordinacion || '-' }}</p>
                  </div>
                  <div class="performance-item">
                    <h4>Test de Reacción</h4>
                    <p>{{ tests[0].test_de_reaccion || '-' }}</p>
                  </div>
                </div>
                <div class="form-item" style="margin-top: 20px;">
                  <label>Fecha del Test</label>
                  <p>{{ formatDate(tests[0].fecha_test) }}</p>
                </div>
              </div>
              <div v-else class="empty-tab">
                <i class="el-icon-trophy" />
                <p>No hay tests de rendimiento registrados</p>
                <p class="hint">Haz clic en "Editar" para agregar test</p>
              </div>
            </el-tab-pane>

            <!-- Tab 5: Tutor -->
            <el-tab-pane v-if="isTabVisible('tutor')" label="Tutor" name="tutor">
              <div v-if="tutor" class="form-grid">
                <div class="form-item">
                  <label>Nombre Completo</label>
                  <p>{{ tutor.nombre_completo }}</p>
                </div>
                <div class="form-item">
                  <label>Tipo de Relación</label>
                  <el-tag>{{ tutor.tipo_relacion }}</el-tag>
                </div>
                <div class="form-item">
                  <label>Teléfono</label>
                  <p>{{ tutor.telefono || 'No especificado' }}</p>
                </div>
                <div class="form-item">
                  <label>Correo</label>
                  <p>{{ tutor.correo || 'No especificado' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Dirección</label>
                  <p>{{ tutor.direccion || 'No especificada' }}</p>
                </div>
              </div>
              <div v-else class="empty-tab">
                <i class="el-icon-user-solid" />
                <p>No hay tutor asignado</p>
                <p class="hint">Haz clic en "Editar" para asignar un tutor</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </main>
    </div>

    <!-- Modal Atleta -->
    <el-dialog
      :title="isEditingAtleta ? 'Editar Atleta' : 'Agregar Nuevo Atleta'"
      :visible.sync="showAtletaModal"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="atletaForm" :model="atletaForm" :rules="atletaRules" label-position="top">
        <div class="photo-upload-container">
          <el-upload
            class="avatar-uploader"
            :action="backendUrl + '/api/atletas/upload'"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeAvatarUpload"
            name="foto"
          >
            <img v-if="atletaForm.foto" :src="getFotoUrl(atletaForm.foto)" class="avatar-preview">
            <div v-else class="avatar-uploader-icon">
              <i class="el-icon-plus" />
              <span>Subir Foto</span>
            </div>
          </el-upload>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nombre" prop="nombre">
              <el-input v-model="atletaForm.nombre" placeholder="Nombre del atleta" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Apellido" prop="apellido">
              <el-input v-model="atletaForm.apellido" placeholder="Apellido del atleta" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Fecha de Nacimiento" prop="fecha_nacimiento">
              <el-date-picker
                v-model="atletaForm.fecha_nacimiento"
                type="date"
                placeholder="Seleccionar"
                style="width: 100%"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Posición de Juego">
              <el-select v-model="atletaForm.posicion_de_juego" placeholder="Seleccionar" style="width: 100%">
                <el-option label="Sin definir" value="" />
                <el-option label="Portero" value="Portero" />
                <el-option label="Defensa Central" value="Defensa Central" />
                <el-option label="Lateral Derecho" value="Lateral Derecho" />
                <el-option label="Lateral Izquierdo" value="Lateral Izquierdo" />
                <el-option label="Mediocampista Central" value="Mediocampista Central" />
                <el-option label="Mediocampista Ofensivo" value="Mediocampista Ofensivo" />
                <el-option label="Extremo Derecho" value="Extremo Derecho" />
                <el-option label="Extremo Izquierdo" value="Extremo Izquierdo" />
                <el-option label="Delantero Centro" value="Delantero Centro" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Categoría" prop="categoria_id">
              <el-select v-model="atletaForm.categoria_id" placeholder="Seleccionar" style="width: 100%">
                <el-option
                  v-for="cat in categorias"
                  :key="cat.categoria_id"
                  :label="cat.nombre_categoria"
                  :value="cat.categoria_id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Entrenador a Cargo">
              <el-input
                :value="getEntrenadorNombre(atletaForm.categoria_id)"
                disabled
                placeholder="Seleccione una categoría"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Teléfono">
              <el-input
                v-model="atletaForm.telefono"
                placeholder="Ej: 04141234567"
                maxlength="11"
                @input="v => atletaForm.telefono = v.replace(/\D/g, '')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Estatus">
              <el-select v-model="atletaForm.estatus" placeholder="Seleccionar" style="width: 100%">
                <el-option label="ACTIVO" value="ACTIVO" />
                <el-option label="INACTIVO" value="INACTIVO" />
                <el-option label="LESIONADO" value="LESIONADO" />
                <el-option label="SUSPENDIDO" value="SUSPENDIDO" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Pierna Dominante">
              <el-select v-model="atletaForm.pierna_dominante" placeholder="Seleccionar" style="width: 100%">
                <el-option label="Derecha" value="Derecha" />
                <el-option label="Izquierda" value="Izquierda" />
                <el-option label="Ambidiestro" value="Ambidiestro" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="País">
              <el-select v-model="atletaForm.direccion.pais" placeholder="Seleccionar" style="width: 100%" filterable @change="handlePaisChangeAtleta">
                <el-option v-for="pais in paises" :key="pais" :label="formatEnum(pais)" :value="pais" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Estado">
              <el-select v-if="atletaForm.direccion.pais === 'venezuela'" v-model="atletaForm.direccion.estado" placeholder="Seleccionar" style="width: 100%" filterable>
                <el-option v-for="estado in estadosVenezuela" :key="estado" :label="formatEnum(estado)" :value="estado" />
              </el-select>
              <el-input v-else v-model="atletaForm.direccion.estado" placeholder="Estado / Provincia" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Municipio">
              <el-input v-model="atletaForm.direccion.municipio" placeholder="Municipio" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Localidad">
              <el-input v-model="atletaForm.direccion.localidad" placeholder="Localidad / Sector" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer">
        <el-button @click="showAtletaModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveAtleta">
          {{ isEditingAtleta ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- Modal Ficha Médica -->
    <el-dialog
      title="Ficha Médica"
      :visible.sync="showMedicalModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="medicalForm" :model="medicalForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tipo Sanguíneo">
              <el-select v-model="medicalForm.tipo_sanguineo" placeholder="Seleccionar" style="width: 100%">
                <el-option label="A+" value="A+" />
                <el-option label="A-" value="A-" />
                <el-option label="B+" value="B+" />
                <el-option label="B-" value="B-" />
                <el-option label="O+" value="O+" />
                <el-option label="O-" value="O-" />
                <el-option label="AB+" value="AB+" />
                <el-option label="AB-" value="AB-" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Alergias">
              <el-input v-model="medicalForm.alergias" placeholder="Ej: Polen, maní" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Lesiones">
          <el-input v-model="medicalForm.lesion" type="textarea" :rows="2" placeholder="Lesiones previas" />
        </el-form-item>
        <el-form-item label="Condición Médica">
          <el-input v-model="medicalForm.condicion_medica" type="textarea" :rows="2" placeholder="Condiciones médicas actuales" />
        </el-form-item>
        <el-form-item label="Observaciones">
          <el-input v-model="medicalForm.observacion" type="textarea" :rows="3" placeholder="Observaciones adicionales" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showMedicalModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveMedical">Guardar</el-button>
      </span>
    </el-dialog>

    <!-- Modal Medidas Antropométricas -->
    <el-dialog
      title="Agregar Medidas Antropométricas"
      :visible.sync="showAnthropometricModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="anthropometricForm" :model="anthropometricForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Peso (kg)">
              <el-input-number v-model="anthropometricForm.peso" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Altura (cm)">
              <el-input-number v-model="anthropometricForm.altura" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Índice de Masa Corporal">
              <el-input-number v-model="anthropometricForm.indice_de_masa" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Envergadura (cm)">
              <el-input-number v-model="anthropometricForm.envergadura" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Largo de Pierna (cm)">
              <el-input-number v-model="anthropometricForm.largo_de_pierna" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Largo de Torso (cm)">
              <el-input-number v-model="anthropometricForm.largo_de_torso" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Fecha de Medición">
          <el-date-picker
            v-model="anthropometricForm.fecha_medicion"
            type="date"
            placeholder="Seleccionar fecha"
            style="width: 100%"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showAnthropometricModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveAnthropometric">Guardar</el-button>
      </span>
    </el-dialog>

    <!-- Modal Tests de Rendimiento -->
    <el-dialog
      title="Agregar Test de Rendimiento"
      :visible.sync="showPerformanceModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="performanceForm" :model="performanceForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Test de Fuerza">
              <el-input-number v-model="performanceForm.test_de_fuerza" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Test de Resistencia">
              <el-input-number v-model="performanceForm.test_resistencia" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Test de Velocidad">
              <el-input-number v-model="performanceForm.test_velocidad" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Test de Coordinación">
              <el-input-number v-model="performanceForm.test_coordinacion" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Test de Reacción">
              <el-input-number v-model="performanceForm.test_de_reaccion" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Fecha del Test">
              <el-date-picker
                v-model="performanceForm.fecha_test"
                type="date"
                placeholder="Seleccionar fecha"
                style="width: 100%"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer">
        <el-button @click="showPerformanceModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="savePerformance">Guardar</el-button>
      </span>
    </el-dialog>

    <!-- Modal Tutor -->
    <el-dialog
      :title="isEditingTutor ? 'Editar Tutor' : 'Agregar Tutor'"
      :visible.sync="showTutorModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="tutorForm" :model="tutorForm" :rules="tutorRules" label-position="top">
        <el-form-item label="Nombre Completo" prop="nombre_completo">
          <el-input v-model="tutorForm.nombre_completo" placeholder="Nombre completo del tutor" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Teléfono">
              <el-input
                v-model="tutorForm.telefono"
                placeholder="Ej: 04141234567"
                maxlength="11"
                @input="v => tutorForm.telefono = v.replace(/\D/g, '')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Correo">
              <el-input v-model="tutorForm.correo" placeholder="correo@ejemplo.com" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Tipo de Relación" prop="tipo_relacion">
          <el-select v-model="tutorForm.tipo_relacion" placeholder="Seleccionar" style="width: 100%">
            <el-option label="PADRE" value="PADRE" />
            <el-option label="MADRE" value="MADRE" />
            <el-option label="TUTOR_LEGAL" value="TUTOR_LEGAL" />
            <el-option label="OTRO" value="OTRO" />
          </el-select>
        </el-form-item>
        <el-form-item label="Dirección">
          <el-input v-model="tutorForm.direccion" type="textarea" :rows="2" placeholder="Dirección completa" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showTutorModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveTutor">
          {{ isEditingTutor ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
import { canEdit, isMedico, getVisibleAtletasTabs } from '@/utils/permission'
import { mapGetters } from 'vuex'

export default {
  name: 'Atletas',
  data() {
    return {
      atletas: [],
      categorias: [],
      tutores: [],
      currentAtletaId: null,
      currentAtleta: {},
      fichaMedica: null,
      medidas: [],
      tests: [],
      tutor: null,
      activeTab: 'personal',
      loading: false,
      loadingAtletas: false,
      backendUrl: 'http://localhost:3000',

      // Modales
      showAtletaModal: false,
      showMedicalModal: false,
      showAnthropometricModal: false,
      showPerformanceModal: false,
      showTutorModal: false,

      // Estados de edición
      isEditingAtleta: false,
      isEditingTutor: false,

      // Filtros y búsqueda
      searchQuery: '',
      filterCategoria: '',
      filterEstatus: '', // "" significa por defecto (Activos/Lesionados)
      searchTimeout: null,

      // Listas para dirección
      paises: ['venezuela', 'colombia', 'peru', 'argentina', 'bolivia', 'chile', 'uruguay', 'paraguay', 'brazil', 'panama', 'ecuador', 'guatemala', 'el salvador', 'mexico', 'cuba', 'honduras', 'nicaragua', 'costa rica', 'belice'],
      estadosVenezuela: ['amazonas', 'anzoategui', 'apure', 'aragua', 'barinas', 'bolivia', 'carabobo', 'cojedes', 'delta amacuro', 'distrito capital', 'falcon', 'guarico', 'lara', 'merida', 'miranda', 'monagas', 'nueva esparta', 'portuguesa', 'sucre', 'tachira', 'trujillo', 'vargas', 'yaracuy', 'zulia'],

      // Formularios
      atletaForm: {
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        posicion_de_juego: '',
        categoria_id: '',
        tutor_id: null,
        telefono: '',
        direccion: {
          pais: 'venezuela',
          estado: '',
          municipio: '',
          localidad: ''
        },
        estatus: 'ACTIVO',
        foto: null,
        pierna_dominante: 'Derecha'
      },
      medicalForm: {
        tipo_sanguineo: '',
        alergias: '',
        lesion: '',
        condicion_medica: '',
        observacion: ''
      },
      anthropometricForm: {
        peso: null,
        altura: null,
        indice_de_masa: null,
        envergadura: null,
        largo_de_pierna: null,
        largo_de_torso: null,
        fecha_medicion: ''
      },
      performanceForm: {
        test_de_fuerza: null,
        test_resistencia: null,
        test_velocidad: null,
        test_coordinacion: null,
        test_de_reaccion: null,
        fecha_test: ''
      },
      tutorForm: {
        nombre_completo: '',
        telefono: '',
        correo: '',
        direccion: '',
        tipo_relacion: ''
      },

      // Reglas de validación
      atletaRules: {
        nombre: [{ required: true, message: 'El nombre es requerido', trigger: 'blur' }],
        apellido: [{ required: true, message: 'El apellido es requerido', trigger: 'blur' }],
        fecha_nacimiento: [{ required: true, message: 'La fecha de nacimiento es requerida', trigger: 'change' }],
        categoria_id: [{ required: true, message: 'La categoría es requerida', trigger: 'change' }]
      },
      tutorRules: {
        nombre_completo: [{ required: true, message: 'El nombre es requerido', trigger: 'blur' }],
        tipo_relacion: [{ required: true, message: 'El tipo de relación es requerido', trigger: 'change' }]
      }
    }
  },
  computed: {
    ...mapGetters(['roles']),

    // Verificar si el usuario puede editar
    canUserEdit() {
      return canEdit()
    },

    // Verificar si el usuario es médico
    isUserMedico() {
      return isMedico()
    },

    // Obtener pestañas visibles según el rol
    visibleTabs() {
      return getVisibleAtletasTabs()
    },

    // Verificar si una pestaña específica es visible
    isTabVisible() {
      return (tabName) => {
        return this.visibleTabs.includes(tabName)
      }
    }
  },
  watch: {
    searchQuery() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.loadAtletas()
      }, 500)
    },
    filterCategoria() {
      this.loadAtletas()
    },
    filterEstatus() {
      this.loadAtletas()
    },
    currentAtletaId: {
      immediate: false,
      handler(newId) {
        if (newId && this.isUserMedico) {
          this.activeTab = 'medical'
        }
      }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      await this.loadCategorias()
      await Promise.all([
        this.loadAtletas(),
        this.loadTutores()
      ])
    },

    async loadAtletas() {
      this.loadingAtletas = true // Asumiendo que agregaremos un pequeño spinner si es necesario
      try {
        const params = {}
        if (this.searchQuery) params.search = this.searchQuery
        if (this.filterCategoria) params.categoria_id = this.filterCategoria
        if (this.filterEstatus) params.estatus = this.filterEstatus

        const response = await request({
          url: '/atletas',
          method: 'get',
          params
        })
        this.atletas = Array.isArray(response) ? response : []
      } catch (error) {
        console.error('Error cargando atletas:', error)
        this.$message.error('Error al cargar atletas')
      } finally {
        this.loadingAtletas = false
      }
    },

    async loadCategorias() {
      try {
        const response = await request({ url: '/categoria', method: 'get' })
        this.categorias = Array.isArray(response) ? response : []
      } catch (error) {
        console.error('Error cargando categorías:', error)
      }
    },

    async loadTutores() {
      try {
        const response = await request({ url: '/tutor', method: 'get' })
        this.tutores = Array.isArray(response) ? response : []
      } catch (error) {
        console.error('Error cargando tutores:', error)
      }
    },

    async selectAtleta(id, keepTab = false) {
      this.currentAtletaId = id
      this.currentAtleta = this.atletas.find(a => a.atleta_id === id) || {}

      if (!keepTab) {
        // Si es médico, ir a pestaña médica; si no, a personal
        this.activeTab = this.isUserMedico ? 'medical' : 'personal'
        this.fichaMedica = null
        this.medidas = []
        this.tests = []
        this.tutor = null
      }

      await Promise.all([
        this.loadFichaMedica(id),
        this.loadMedidas(id),
        this.loadTests(id),
        this.loadTutor(this.currentAtleta.tutor_id)
      ])
    },

    async loadFichaMedica(atleta_id) {
      try {
        const response = await request({ url: `/ficha-medica?atleta_id=${atleta_id}`, method: 'get' })
        this.fichaMedica = Array.isArray(response) && response.length > 0 ? response[0] : null
      } catch (error) {
        this.fichaMedica = null
      }
    },

    async loadMedidas(atleta_id) {
      try {
        const response = await request({ url: `/mediciones?atleta_id=${atleta_id}`, method: 'get' })
        this.medidas = Array.isArray(response) ? response : []
      } catch (error) {
        this.medidas = []
      }
    },

    async loadTests(atleta_id) {
      try {
        const response = await request({ url: `/tests?atleta_id=${atleta_id}`, method: 'get' })
        this.tests = Array.isArray(response) ? response : []
      } catch (error) {
        this.tests = []
      }
    },

    async loadTutor(tutor_id) {
      if (!tutor_id) {
        this.tutor = null
        return
      }
      try {
        const response = await request({ url: `/tutor/${tutor_id}`, method: 'get' })
        this.tutor = response
      } catch (error) {
        this.tutor = null
      }
    },

    handleEdit() {
      switch (this.activeTab) {
        case 'personal':
          this.openAtletaModal(true)
          break
        case 'medical':
          this.openMedicalModal()
          break
        case 'anthropometric':
          this.openAnthropometricModal()
          break
        case 'performance':
          this.openPerformanceModal()
          break
        case 'tutor':
          this.openTutorModal()
          break
      }
    },

    openAtletaModal(editing) {
      this.isEditingAtleta = editing
      if (editing && this.currentAtleta) {
        this.atletaForm = {
          nombre: this.currentAtleta.nombre,
          apellido: this.currentAtleta.apellido,
          fecha_nacimiento: this.currentAtleta.fecha_nacimiento,
          posicion_de_juego: this.currentAtleta.posicion_de_juego || '',
          categoria_id: this.currentAtleta.categoria_id,
          tutor_id: this.currentAtleta.tutor_id || null,
          telefono: this.currentAtleta.telefono || '',
          direccion: {
            pais: this.currentAtleta.pais || 'venezuela',
            estado: this.currentAtleta.estado || '',
            municipio: this.currentAtleta.municipio || '',
            localidad: this.currentAtleta.localidad || ''
          },
          estatus: this.currentAtleta.estatus || 'ACTIVO',
          foto: this.currentAtleta.foto || '',
          pierna_dominante: this.currentAtleta.pierna_dominante || 'Derecha'
        }
      } else {
        this.resetAtletaForm()
      }
      this.showAtletaModal = true
    },

    openMedicalModal() {
      if (this.fichaMedica) {
        this.medicalForm = {
          tipo_sanguineo: this.fichaMedica.tipo_sanguineo || '',
          alergias: this.fichaMedica.alergias || '',
          lesion: this.fichaMedica.lesion || '',
          condicion_medica: this.fichaMedica.condicion_medica || '',
          observacion: this.fichaMedica.observacion || ''
        }
      } else {
        this.resetMedicalForm()
      }
      this.showMedicalModal = true
    },

    openAnthropometricModal() {
      if (this.medidas && this.medidas.length > 0) {
        // Pre-llenar con la última medida registrada
        const ultimaMedida = this.medidas[0]
        this.anthropometricForm = {
          peso: ultimaMedida.peso,
          altura: ultimaMedida.altura,
          indice_de_masa: ultimaMedida.indice_de_masa,
          envergadura: ultimaMedida.envergadura,
          largo_de_pierna: ultimaMedida.largo_de_pierna,
          largo_de_torso: ultimaMedida.largo_de_torso,
          fecha_medicion: new Date().toISOString().split('T')[0]
        }
      } else {
        this.resetAnthropometricForm()
        this.anthropometricForm.fecha_medicion = new Date().toISOString().split('T')[0]
      }
      this.showAnthropometricModal = true
    },

    openPerformanceModal() {
      if (this.tests && this.tests.length > 0) {
        const ultimoTest = this.tests[0]
        this.performanceForm = {
          test_de_fuerza: ultimoTest.test_de_fuerza,
          test_resistencia: ultimoTest.test_resistencia,
          test_velocidad: ultimoTest.test_velocidad,
          test_coordinacion: ultimoTest.test_coordinacion,
          test_de_reaccion: ultimoTest.test_de_reaccion,
          fecha_test: new Date().toISOString().split('T')[0]
        }
      } else {
        this.resetPerformanceForm()
        this.performanceForm.fecha_test = new Date().toISOString().split('T')[0]
      }
      this.showPerformanceModal = true
    },

    openTutorModal() {
      if (this.tutor) {
        this.isEditingTutor = true
        this.tutorForm = {
          nombre_completo: this.tutor.nombre_completo,
          telefono: this.tutor.telefono || '',
          correo: this.tutor.correo || '',
          direccion: this.tutor.direccion || '',
          tipo_relacion: this.tutor.tipo_relacion
        }
      } else {
        this.isEditingTutor = false
        this.resetTutorForm()
      }
      this.showTutorModal = true
    },

    saveAtleta() {
      this.$refs.atletaForm.validate(async(valid) => {
        if (!valid) return

        this.loading = true
        try {
          if (this.isEditingAtleta) {
            await request({
              url: `/atletas/${this.currentAtletaId}`,
              method: 'put',
              data: this.atletaForm
            })
            this.$message.success('Atleta actualizado correctamente')
          } else {
            await request({
              url: '/atletas',
              method: 'post',
              data: this.atletaForm
            })
            this.$message.success('Atleta creado correctamente')
          }

          this.showAtletaModal = false
          await this.loadAtletas()

          if (this.isEditingAtleta) {
            await this.selectAtleta(this.currentAtletaId)
          }
        } catch (error) {
          console.error('Error guardando atleta:', error)
          this.$message.error('Error al guardar atleta')
        } finally {
          this.loading = false
        }
      })
    },

    async saveMedical() {
      this.loading = true
      try {
        const data = {
          ...this.medicalForm,
          atleta_id: this.currentAtletaId
        }

        if (this.fichaMedica) {
          await request({
            url: `/ficha-medica/${this.fichaMedica.ficha_id}`,
            method: 'put',
            data
          })
          this.$message.success('Ficha médica actualizada')
        } else {
          await request({
            url: '/ficha-medica',
            method: 'post',
            data
          })
          this.$message.success('Ficha médica creada')
        }

        this.showMedicalModal = false
        await this.loadFichaMedica(this.currentAtletaId)
      } catch (error) {
        console.error('Error guardando ficha médica:', error)
        this.$message.error('Error al guardar ficha médica')
      } finally {
        this.loading = false
      }
    },

    async saveAnthropometric() {
      this.loading = true
      try {
        const data = {
          ...this.anthropometricForm,
          atleta_id: this.currentAtletaId
        }

        await request({
          url: '/mediciones',
          method: 'post',
          data
        })

        this.$message.success('Medidas agregadas correctamente')
        this.showAnthropometricModal = false
        await this.loadMedidas(this.currentAtletaId)
      } catch (error) {
        console.error('Error guardando medidas:', error)
        this.$message.error('Error al guardar medidas')
      } finally {
        this.loading = false
      }
    },

    async savePerformance() {
      this.loading = true
      try {
        const data = {
          ...this.performanceForm,
          atleta_id: this.currentAtletaId
        }

        await request({
          url: '/tests',
          method: 'post',
          data
        })

        this.$message.success('Test agregado correctamente')
        this.showPerformanceModal = false
        await this.loadTests(this.currentAtletaId)
      } catch (error) {
        console.error('Error guardando test:', error)
        this.$message.error('Error al guardar test')
      } finally {
        this.loading = false
      }
    },

    saveTutor() {
      this.$refs.tutorForm.validate(async(valid) => {
        if (!valid) return

        this.loading = true
        try {
          if (this.isEditingTutor && this.tutor) {
            await request({
              url: `/tutor/${this.tutor.tutor_id}`,
              method: 'put',
              data: this.tutorForm
            })
            this.$message.success('Tutor actualizado correctamente')
          } else {
            const response = await request({
              url: '/tutor',
              method: 'post',
              data: this.tutorForm
            })

            const nuevoTutorId = response.id || response.tutor_id || response.insertId

            if (!nuevoTutorId) {
              console.error('Respuesta del servidor:', response)
              throw new Error('No se recibió el ID del tutor creado')
            }

            if (!this.currentAtleta || !this.currentAtletaId) {
              throw new Error('No hay atleta seleccionado para asignar tutor')
            }

            await request({
              url: `/atletas/${this.currentAtletaId}/tutor`,
              method: 'put',
              data: { tutor_id: nuevoTutorId }
            })

            this.$message.success('Tutor creado y asignado correctamente')
          }

          this.showTutorModal = false
          await this.loadAtletas()
          await this.selectAtleta(this.currentAtletaId, true)
        } catch (error) {
          console.error('Error guardando tutor:', error)
          this.$message.error('Error al guardar tutor')
        } finally {
          this.loading = false
        }
      })
    },

    deleteAtleta() {
      this.$confirm('¿Estás seguro de eliminar este atleta?', 'Advertencia', {
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }).then(async() => {
        try {
          await request({
            url: `/atletas/${this.currentAtletaId}`,
            method: 'delete'
          })
          this.$message.success('Atleta eliminado correctamente')
          this.currentAtletaId = null
          this.currentAtleta = {}
          await this.loadAtletas()
        } catch (error) {
          console.error('Error eliminando atleta:', error)
          this.$message.error('Error al eliminar atleta')
        }
      }).catch(() => {})
    },

    goToProgress() {
      this.$router.push({
        path: '/reportes/rendimiento',
        query: { atleta_id: this.currentAtletaId }
      })
    },

    resetAtletaForm() {
      this.atletaForm = {
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        posicion_de_juego: '',
        categoria_id: '',
        tutor_id: null,
        telefono: '',
        direccion: {
          pais: 'venezuela',
          estado: '',
          municipio: '',
          localidad: ''
        },
        estatus: 'ACTIVO',
        foto: null,
        pierna_dominante: 'Derecha'
      }
    },

    resetMedicalForm() {
      this.medicalForm = {
        tipo_sanguineo: '',
        alergias: '',
        lesion: '',
        condicion_medica: '',
        observacion: ''
      }
    },

    resetAnthropometricForm() {
      this.anthropometricForm = {
        peso: null,
        altura: null,
        indice_de_masa: null,
        envergadura: null,
        largo_de_pierna: null,
        largo_de_torso: null,
        fecha_medicion: ''
      }
    },

    resetPerformanceForm() {
      this.performanceForm = {
        test_de_fuerza: null,
        test_resistencia: null,
        test_velocidad: null,
        test_coordinacion: null,
        test_de_reaccion: null,
        fecha_test: ''
      }
    },

    resetTutorForm() {
      this.tutorForm = {
        nombre_completo: '',
        telefono: '',
        correo: '',
        direccion: '',
        tipo_relacion: ''
      }
    },

    calculateAge(birthdate) {
      if (!birthdate) return '-'
      const birthDate = new Date(birthdate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES')
    },

    getStatusType(estatus) {
      const types = {
        'ACTIVO': 'success',
        'INACTIVO': 'info',
        'LESIONADO': 'warning',
        'SUSPENDIDO': 'danger'
      }
      return types[estatus] || 'info'
    },

    getEntrenadorNombre(categoriaId) {
      if (!categoriaId || !this.categorias || this.categorias.length === 0) return 'No asignado'
      const categoria = this.categorias.find(c => c.categoria_id === categoriaId)
      return categoria ? (categoria.entrenador_nombre || categoria.nombre_entrenador || 'No asignado') : 'No asignado'
    },

    getFotoUrl(filename) {
      if (!filename) return null
      return `${this.backendUrl}/uploads/atletas/${filename}`
    },

    handleUploadSuccess(res) {
      this.atletaForm.foto = res.filename
      this.$message.success('Foto cargada exitosamente')
    },

    handlePaisChangeAtleta() {
      // Limpiar el campo estado al cambiar de país
      this.atletaForm.direccion.estado = ''
    },

    beforeAvatarUpload(file) {
      const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPGorPNG) {
        this.$message.error('La imagen debe estar en formato JPG o PNG')
      }
      if (!isLt2M) {
        this.$message.error('La imagen no puede exceder los 2MB')
      }
      if (!isLt2M) {
        this.$message.error('La imagen no puede exceder los 2MB')
      }
      return isJPGorPNG && isLt2M
    },

    // Helper para capitalizar textos de enum
    formatEnum(text) {
      if (!text) return ''
      return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }
}

</script>

<style scoped>
.atletas-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 5px 0;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Header Button - Modern Executive Style */
.header-content ::v-deep .el-button--primary {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-content ::v-deep .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.header-content ::v-deep .el-button--primary:active {
  transform: translateY(0);
}

.main-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 15px;
}

aside.sidebar {
  padding: 0;
  background: transparent;
  margin-bottom: 0;
}

.sidebar .el-card {
  height: calc(100vh - 200px);
  overflow: hidden;
}

.sidebar ::v-deep .el-card__body {
  padding: 0;
}

.athlete-list {
  max-height: calc(100vh - 340px);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  padding: 15px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 2px solid #e2e8f0;
}

.search-container ::v-deep .el-input__inner {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  padding: 10px 14px 10px 36px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.search-container ::v-deep .el-input__inner:hover {
  border-color: #E51D22 !important;
}

.search-container ::v-deep .el-input__inner:focus {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.12);
}

.search-container ::v-deep .el-input__inner::placeholder {
  color: #64748b !important;
  font-weight: 500;
}

.search-container ::v-deep .el-input__prefix {
  color: #64748b;
}

.filter-popover {
  padding: 5px;
}

.filter-popover h4 {
  margin: 0 0 18px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #E51D22;
  border-bottom: 2px solid #E51D22;
  padding-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-item {
  margin-bottom: 18px;
}

.filter-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.filter-item ::v-deep .el-select .el-input__inner {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
}

.filter-item ::v-deep .el-select .el-input__inner:hover {
  border-color: #E51D22 !important;
}

.filter-item ::v-deep .el-select .el-input.is-focus .el-input__inner {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.12);
}

.filter-btn {
  font-size: 1.3rem;
  color: #64748b;
  padding: 5px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  color: #E51D22;
  transform: rotate(90deg);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.photo-upload-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #E51D22;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 1.2;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.avatar-uploader-icon span {
  font-size: 12px;
  margin-top: 5px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.athlete-item {
  padding: 16px;
  margin: 8px 12px;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.athlete-item:hover {
  border-color: #E51D22;
  background: linear-gradient(135deg, #fff5f5, #fff);
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.12);
  transform: translateX(4px);
}

.athlete-item.active {
  background: linear-gradient(135deg, #fee2e2, #fff);
  border: 2px solid #E51D22;
  box-shadow: 0 4px 16px rgba(229, 29, 34, 0.2);
}

.athlete-photo {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(229, 29, 34, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.athlete-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.athlete-info h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.athlete-info p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 3px 0;
  font-weight: 500;
}

.athlete-details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.athlete-details-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #E51D22;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  flex-shrink: 0;
}

.athlete-details-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.athlete-details-info h2 {
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  color: #2c3e50;
  word-break: break-all;
}

.athlete-details-info p {
  color: #64748b;
  margin: 4px 0;
  font-size: 0.95rem;
}

.athlete-actions {
  display: flex;
  gap: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
  padding: 20px 0;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-item p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.form-item.full-width {
  grid-column: 1 / span 2;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.performance-item {
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #E51D22;
}

.performance-item h4 {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.performance-item p {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-tab {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-tab i {
  font-size: 4rem;
  margin-bottom: 15px;
  display: block;
}

.empty-tab p {
  font-size: 1.1rem;
  margin: 5px 0;
}

.empty-tab .hint {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin-top: 10px;
}

::v-deep .el-button--primary {
  background-color: #E51D22;
  border-color: #E51D22;
}

::v-deep .el-button--primary:hover,
::v-deep .el-button--primary:focus {
  background-color: #c41a1d;
  border-color: #c41a1d;
}

::v-deep .el-tabs__item.is-active {
  color: #E51D22;
}

::v-deep .el-tabs__active-bar {
  background-color: #E51D22;
}

::v-deep .el-tabs__item:hover {
  color: #E51D22;
}

::v-deep .el-tabs__content {
  height: calc(100vh - 350px);
  overflow-y: auto;
  padding-right: 10px;
}

::v-deep .el-tabs__content::-webkit-scrollbar {
  width: 8px;
}

::v-deep .el-tabs__content::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-item.full-width {
    grid-column: 1;
  }

  .performance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .athlete-details-header {
    flex-direction: column;
    text-align: center;
  }

  .athlete-actions {
    flex-direction: column;
    width: 100%;
  }

  .performance-grid {
    grid-template-columns: 1fr;
  }
}
</style>
