<template>
  <div class="atletas-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1>Gestión de Atletas
            <el-tag v-if="!canUserEdit && !isUserMedico" type="info" size="small" style="margin-left: 10px;">
              Solo Lectura
            </el-tag>
            <el-tag v-if="isUserMedico" type="warning" size="small" style="margin-left: 10px;">
              Acceso Médico
            </el-tag>
          </h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
        <button v-if="canUserEdit" class="add-atleta-btn" @click="openAtletaModal(false)">
          <span class="add-icon">+</span>
          Agregar Atleta
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de atletas -->
      <aside class="sidebar">
        <div class="sidebar-card">
          <div class="sidebar-header">
            <span class="sidebar-title">📋 Lista de Atletas</span>
            <el-popover placement="bottom-end" width="260" trigger="click">
              <div class="filter-popover">
                <h4>⚙️ Filtros Avanzados</h4>
                <div class="filter-item">
                  <label>Ordenar por</label>
                  <el-select v-model="filterOrder" placeholder="Seleccionar" size="small" style="width: 100%">
                    <el-option label="Más Recientes" value="recent" />
                    <el-option label="Más Antiguos" value="oldest" />
                    <el-option label="Nombre (A-Z)" value="name_asc" />
                    <el-option label="Nombre (Z-A)" value="name_desc" />
                  </el-select>
                </div>
                <div class="filter-item">
                  <label>Categoría</label>
                  <el-select v-model="filterCategoria" placeholder="Todas" clearable size="small" style="width: 100%">
                    <el-option v-for="cat in categorias" :key="cat.categoria_id" :label="cat.nombre_categoria" :value="cat.categoria_id" />
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
              <template #reference>
                <button class="filter-toggle-btn" title="Filtros avanzados">⚙</button>
              </template>
            </el-popover>
          </div>
          <div class="search-container">
            <div class="search-field">
              <label class="search-label">Buscar por Nombre</label>
              <el-input v-model="searchQuery" placeholder="Nombre o apellido..." size="small" clearable />
            </div>
            <div class="cedula-filter">
              <label class="search-label">Filtro de Cédula</label>
              <div class="cedula-filter-buttons">
                <button class="cedula-btn" :class="{ active: filterCedula === 'todos' }" @click="filterCedula = 'todos'">Todos</button>
                <button class="cedula-btn" :class="{ active: filterCedula === 'con_cedula' }" @click="filterCedula = 'con_cedula'">Con Cédula</button>
                <button class="cedula-btn" :class="{ active: filterCedula === 'sin_cedula' }" @click="filterCedula = 'sin_cedula'">Sin Cédula</button>
              </div>
              <el-input v-if="filterCedula === 'con_cedula'" v-model="searchCedula" placeholder="🔎 Ingresar cédula..." size="small" clearable maxlength="9" class="cedula-search-input" @input="v => searchCedula = v.replace(/\D/g, '')" />
            </div>
          </div>
          <div class="athlete-list">
            <div v-for="atleta in atletas" :key="atleta.atleta_id" class="athlete-item" :class="{ active: currentAtletaId === atleta.atleta_id }" @click="selectAtleta(atleta.atleta_id)">
              <div class="athlete-photo">
                <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="avatar-img">
                <span v-else class="avatar-initials">{{ (atleta.nombre || '?').charAt(0) }}{{ (atleta.apellido || '').charAt(0) }}</span>
              </div>
              <div class="athlete-info">
                <h3>{{ atleta.nombre }} {{ atleta.apellido }}</h3>
                <p>{{ formatEnum(atleta.posicion_de_juego_nombre) || 'Sin posición' }}</p>
                <p class="athlete-category">{{ atleta.categoria_nombre || 'Sin categoría' }}</p>
              </div>
              <span class="athlete-status-dot" :class="'status-' + (atleta.estatus || '').toLowerCase()" :title="atleta.estatus" />
            </div>
            <div v-if="atletas.length === 0" class="empty-list">
              <span class="empty-list-icon">⚽</span>
              <p class="empty-list-title">Sin atletas</p>
              <p class="empty-list-hint">Agrega tu primer atleta con el botón de arriba</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Área de contenido -->
      <main class="content-area">
        <div v-if="!currentAtletaId" class="empty-main">
          <div class="empty-main-content">
            <span class="empty-main-icon">🏟️</span>
            <h3>No hay atleta seleccionado</h3>
            <p>Selecciona un atleta de la lista o agrega uno nuevo.</p>
          </div>
        </div>

        <el-card v-else shadow="hover" class="detail-card">
          <!-- Encabezado del atleta -->
          <div class="athlete-details-header">
            <div class="athlete-details-photo">
              <img v-if="currentAtleta.foto" :src="getFotoUrl(currentAtleta.foto)" class="avatar-img-large">
              <span v-else class="avatar-initials-large">{{ (currentAtleta.nombre || '?').charAt(0) }}{{ (currentAtleta.apellido || '').charAt(0) }}</span>
            </div>
            <div class="athlete-details-info">
              <h2>{{ currentAtleta.nombre }} {{ currentAtleta.apellido }}</h2>
              <p>📂 Categoría: {{ currentAtleta.categoria_nombre || 'No asignada' }}</p>
              <p>🎂 Edad: {{ calculateAge(currentAtleta.fecha_nacimiento) }} años</p>
              <el-tag :type="getStatusType(currentAtleta.estatus)" size="small">{{ currentAtleta.estatus }}</el-tag>
            </div>
            <div class="athlete-actions">
              <button v-if="!isUserMedico" class="action-btn action-btn-info" @click="goToProgress" title="Análisis">📊 Análisis</button>
              <button v-if="canUserEdit && !isUserMedico" class="action-btn action-btn-danger" @click="deleteAtleta" title="Eliminar">🗑️ Eliminar</button>
              <button v-if="canUserEdit || (isUserEntrenador && (activeTab === 'anthropometric' || activeTab === 'performance'))" class="action-btn action-btn-primary" @click="handleEdit" title="Editar">✏️ Editar</button>
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
                  <p>{{ formatEnum(currentAtleta.posicion_de_juego_nombre) || 'No especificada' }}</p>
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
                <div class="form-item">
                  <label>Cédula</label>
                  <p>{{ currentAtleta.cedula || 'No registrada' }}</p>
                </div>
                <div class="form-item full-width">
                  <label>Dirección</label>
                  <p>
                    {{ currentAtleta.pais ? formatEnum(currentAtleta.pais) : '' }}
                    {{ currentAtleta.estado ? ', ' + formatEnum(currentAtleta.estado) : '' }}
                    {{ currentAtleta.municipio ? ', ' + currentAtleta.municipio : '' }}
                    {{ currentAtleta.parroquia ? ', ' + currentAtleta.parroquia : '' }}
                    {{ currentAtleta.descripcion_descriptiva ? '. ' + currentAtleta.descripcion_descriptiva : '' }}
                  </p>
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab 2: Ficha Médica -->
            <el-tab-pane v-if="isTabVisible('ficha-medica')" label="Ficha Médica" name="medical">
              <div class="tab-header-actions">
                <el-button v-if="canUserEdit || isUserMedico" type="primary" size="small" icon="el-icon-edit" @click="openMedicalModal">
                  {{ fichaMedica ? 'Editar Ficha Médica' : 'Agregar Ficha Médica' }}
                </el-button>
              </div>
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
                <p v-if="canUserEdit || isUserMedico" class="hint">Haz clic en "Agregar Ficha Médica" para crear la ficha médica</p>
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
                  <label>Porcentaje de Grasa</label>
                  <p>{{ medidas[0].porcentaje_grasa || '-' }} %</p>
                </div>
                <div class="form-item">
                  <label>Porcentaje de Musculatura</label>
                  <p>{{ medidas[0].porcentaje_musculatura || '-' }} %</p>
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
                  <label>Cédula</label>
                  <p>{{ tutor.cedula || 'No registrada' }}</p>
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
                  <p>
                    {{ tutor.pais ? formatEnum(tutor.pais) : '' }}
                    {{ tutor.estado ? ', ' + formatEnum(tutor.estado) : '' }}
                    {{ tutor.municipio ? ', ' + tutor.municipio : '' }}
                    {{ tutor.parroquia ? ', ' + tutor.parroquia : '' }}
                    {{ tutor.descripcion_descriptiva ? '. ' + tutor.descripcion_descriptiva : '' }}
                  </p>
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
      v-model="showAtletaModal"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="atletaFormRef" :model="atletaForm" :rules="atletaRules" label-position="top">
        <div class="photo-upload-container">
          <el-upload
            class="avatar-uploader"
            :action="backendUrl + '/api/atletas/upload'"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeAvatarUpload"
            name="foto"
          >
            <div v-if="atletaForm.foto" class="photo-preview-wrapper">
              <img :src="getFotoUrl(atletaForm.foto)" class="avatar-preview">
              <div class="photo-overlay">
                <i class="el-icon-delete" @click.stop="removePhoto" />
              </div>
            </div>
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
            <el-form-item label="Cédula (Opcional)">
              <el-input
                v-model="atletaForm.cedula"
                placeholder="Ej: 123456789"
                maxlength="9"
                @input="v => atletaForm.cedula = v.replace(/\D/g, '')"
              />
            </el-form-item>
          </el-col>
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
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Sexo" prop="sexo">
              <el-select v-model="atletaForm.sexo" placeholder="Seleccionar" style="width: 100%">
                <el-option label="Masculino" value="M" />
                <el-option label="Femenino" value="F" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Posición de Juego">
              <el-select v-model="atletaForm.posicion_de_juego" placeholder="Seleccionar" style="width: 100%">
                <el-option label="Sin definir" :value="null" />
                <el-option
                  v-for="pos in posiciones"
                  :key="pos.posicion_id"
                  :label="formatEnum(pos.nombre_posicion)"
                  :value="pos.posicion_id"
                />
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
            <el-form-item label="Parroquia">
              <el-input v-model="atletaForm.direccion.parroquia" placeholder="Parroquia" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="Descripción de la Dirección">
              <el-input v-model="atletaForm.direccion.descripcion_descriptiva" placeholder="Calle, casa, edificio, referencias..." type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAtletaModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveAtleta">
          {{ isEditingAtleta ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Modal Ficha Médica -->
    <el-dialog
      title="Ficha Médica"
      v-model="showMedicalModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="medicalFormRef" :model="medicalForm" label-position="top">
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
      <template #footer>
        <el-button @click="showMedicalModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveMedical">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Medidas Antropométricas -->
    <el-dialog
      title="Agregar Medidas Antropométricas"
      v-model="showAnthropometricModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="anthropometricFormRef" :model="anthropometricForm" label-position="top">
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
            <el-form-item label="Porcentaje de Grasa">
              <el-input-number v-model="anthropometricForm.porcentaje_grasa" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Porcentaje de Musculatura">
              <el-input-number v-model="anthropometricForm.porcentaje_musculatura" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
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
      <template #footer>
        <el-button @click="showAnthropometricModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveAnthropometric">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Tests de Rendimiento -->
    <el-dialog
      title="Agregar Test de Rendimiento"
      v-model="showPerformanceModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="performanceFormRef" :model="performanceForm" label-position="top">
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
      <template #footer>
        <el-button @click="showPerformanceModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="savePerformance">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Tutor -->
    <el-dialog
      :title="isEditingTutor ? 'Editar Tutor' : 'Agregar Tutor'"
      v-model="showTutorModal"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="tutorFormRef" :model="tutorForm" :rules="tutorRules" label-position="top">
        <el-form-item label="Nombre Completo" prop="nombre_completo">
          <el-input v-model="tutorForm.nombre_completo" placeholder="Nombre completo del tutor" />
        </el-form-item>
        <el-form-item label="Cédula" prop="cedula">
          <el-input v-model="tutorForm.cedula" placeholder="Ej: 12345678" maxlength="10" @input="v => tutorForm.cedula = v.replace(/\D/g, '')" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Teléfono" prop="telefono">
              <el-input
                v-model="tutorForm.telefono"
                placeholder="Ej: 04141234567"
                maxlength="11"
                @input="v => tutorForm.telefono = v.replace(/\D/g, '')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Correo" prop="correo">
              <el-input v-model="tutorForm.correo" placeholder="correo@ejemplo.com" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Tipo de Relación" prop="tipo_relacion">
          <el-select v-model="tutorForm.tipo_relacion" placeholder="Seleccionar" style="width: 100%">
            <el-option label="Familiar (Padre/Madre)" value="Familiar" />
            <el-option label="Allegado a familia" value="adyegado a familia" />
            <el-option label="Representante Legal" value="Representante legal" />
            <el-option label="Otro" value="OTRO" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="País" prop="direccion.pais">
              <el-select v-model="tutorForm.direccion.pais" placeholder="Seleccionar" style="width: 100%" filterable>
                <el-option v-for="pais in paises" :key="pais" :label="formatEnum(pais)" :value="pais" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Estado" prop="direccion.estado">
              <el-select v-if="tutorForm.direccion.pais === 'venezuela'" v-model="tutorForm.direccion.estado" placeholder="Seleccionar" style="width: 100%" filterable>
                <el-option v-for="estado in estadosVenezuela" :key="estado" :label="formatEnum(estado)" :value="estado" />
              </el-select>
              <el-input v-else v-model="tutorForm.direccion.estado" placeholder="Estado / Provincia" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Municipio" prop="direccion.municipio">
              <el-input v-model="tutorForm.direccion.municipio" placeholder="Municipio" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Parroquia" prop="direccion.parroquia">
              <el-input v-model="tutorForm.direccion.parroquia" placeholder="Parroquia" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Dirección Detallada">
          <el-input v-model="tutorForm.direccion.descripcion_descriptiva" type="textarea" :rows="2" placeholder="Calle, casa, edificio..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTutorModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveTutor">
          {{ isEditingTutor ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { canEdit, isMedico, isEntrenador, getVisibleAtletasTabs } from '@/utils/permission'
import { getPosiciones } from '@/api/posiciones'

const router = useRouter()
const store = useStore()

// State
const atletas = ref([])
const categorias = ref([])
const tutores = ref([])
const posiciones = ref([])
const currentAtletaId = ref(null)
const currentAtleta = ref({})
const fichaMedica = ref(null)
const medidas = ref([])
const tests = ref([])
const tutor = ref(null)
const activeTab = ref('personal')
const loading = ref(false)
const loadingAtletas = ref(false)
const backendUrl = 'http://localhost:3000'

// Modals
const showAtletaModal = ref(false)
const showMedicalModal = ref(false)
const showAnthropometricModal = ref(false)
const showPerformanceModal = ref(false)
const showTutorModal = ref(false)

// Editing states
const isEditingAtleta = ref(false)
const isEditingTutor = ref(false)

// Filters
const searchQuery = ref('')
const searchCedula = ref('')
const filterCedula = ref('todos')
const filterCategoria = ref('')
const filterEstatus = ref('')
const filterOrder = ref('recent')
const filterOrden = ref('')
let searchTimeout = null
let searchCedulaTimeout = null

// Utils
const paises = ['venezuela', 'colombia', 'peru', 'argentina', 'bolivia', 'chile', 'uruguay', 'paraguay', 'brazil', 'panama', 'ecuador', 'guatemala', 'el salvador', 'mexico', 'cuba', 'honduras', 'nicaragua', 'costa rica', 'belice']
const estadosVenezuela = ['amazonas', 'anzoategui', 'apure', 'aragua', 'barinas', 'bolivar', 'carabobo', 'cojedes', 'delta amacuro', 'distrito capital', 'falcon', 'guarico', 'lara', 'merida', 'miranda', 'monagas', 'nueva esparta', 'portuguesa', 'sucre', 'tachira', 'trujillo', 'vargas', 'yaracuy', 'zulia']

// Forms
const atletaForm = reactive({
  nombre: '',
  apellido: '',
  cedula: '',
  fecha_nacimiento: '',
  sexo: 'M',
  posicion_de_juego: '',
  categoria_id: '',
  tutor_id: null,
  telefono: '',
  direccion: {
    pais: 'venezuela',
    estado: '',
    municipio: '',
    parroquia: '',
    descripcion_descriptiva: ''
  },
  estatus: 'ACTIVO',
  foto: null,
  pierna_dominante: 'Derecha'
})

const medicalForm = reactive({
  tipo_sanguineo: '',
  alergias: '',
  lesion: '',
  condicion_medica: '',
  observacion: ''
})

const anthropometricForm = reactive({
  peso: null,
  altura: null,
  porcentaje_grasa: null,
  porcentaje_musculatura: null,
  envergadura: null,
  largo_de_pierna: null,
  largo_de_torso: null,
  fecha_medicion: ''
})

const performanceForm = reactive({
  test_de_fuerza: null,
  test_resistencia: null,
  test_velocidad: null,
  test_coordinacion: null,
  test_de_reaccion: null,
  fecha_test: ''
})

const tutorForm = reactive({
  nombre_completo: '',
  cedula: '',
  telefono: '',
  correo: '',
  direccion: {
    pais: '',
    estado: '',
    municipio: '',
    parroquia: '',
    descripcion_descriptiva: ''
  },
  tipo_relacion: ''
})

// Validation Rules
const atletaRules = {
  nombre: [
    { required: true, message: 'El nombre es requerido', trigger: 'blur' },
    { pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo se permiten letras', trigger: 'blur' }
  ],
  apellido: [
    { required: true, message: 'El apellido es requerido', trigger: 'blur' },
    { pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo se permiten letras', trigger: 'blur' }
  ],
  fecha_nacimiento: [{ required: true, message: 'La fecha de nacimiento es requerida', trigger: 'change' }],
  sexo: [{ required: true, message: 'El sexo es requerido', trigger: 'change' }],
  categoria_id: [{ required: true, message: 'La categoría es requerida', trigger: 'change' }]
}

const tutorRules = {
  nombre_completo: [
    { required: true, message: 'El nombre es requerido', trigger: 'blur' },
    { pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo se permiten letras', trigger: 'blur' }
  ],
  cedula: [{ required: true, message: 'La cédula es requerida', trigger: 'blur' }],
  telefono: [
    { required: true, message: 'El teléfono es requerido', trigger: 'blur' },
    { pattern: /^[0-9]{11}$/, message: 'El teléfono debe tener 11 dígitos numéricos', trigger: 'blur' }
  ],
  correo: [
    { required: false },
    { pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, message: 'Formato de correo inválido (ej: usuario@dominio.com)', trigger: 'blur' }
  ],
  tipo_relacion: [{ required: true, message: 'El tipo de relación es requerido', trigger: 'change' }],
  'direccion.pais': [{ required: true, message: 'El país es requerido', trigger: 'change' }],
  'direccion.estado': [{ required: true, message: 'El estado es requerido', trigger: 'change' }],
  'direccion.municipio': [{ required: true, message: 'El municipio es requerido', trigger: 'blur' }],
  'direccion.parroquia': [{ required: true, message: 'La parroquia es requerida', trigger: 'blur' }]
}

// Computed
const canUserEdit = computed(() => canEdit())
const isUserMedico = computed(() => isMedico())
const isUserEntrenador = computed(() => isEntrenador())
const visibleTabs = computed(() => getVisibleAtletasTabs())
const isTabVisible = computed(() => (tabName) => visibleTabs.value.includes(tabName))

// Methods
const loadCategorias = async () => {
  try {
    const response = await request({ url: '/categoria', method: 'get' })
    categorias.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
}

const loadAtletas = async () => {
  loadingAtletas.value = true
  try {
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value

    if (filterCedula.value === 'con_cedula') {
      if (searchCedula.value) params.cedula = searchCedula.value
      params.con_cedula = 'true'
    } else if (filterCedula.value === 'sin_cedula') {
      params.sin_cedula = 'true'
    }

    if (filterCategoria.value) params.categoria_id = filterCategoria.value
    if (filterEstatus.value) params.estatus = filterEstatus.value
    if (filterOrder.value) params.order = filterOrder.value
    if (filterOrden.value) params.orderBy = filterOrden.value

    const response = await request({
      url: '/atletas',
      method: 'get',
      params
    })
    atletas.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando atletas:', error)
    ElMessage.error('Error al cargar atletas')
  } finally {
    loadingAtletas.value = false
  }
}

const loadTutores = async () => {
  try {
    const response = await request({ url: '/tutor', method: 'get' })
    tutores.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando tutores:', error)
  }
}

const loadPosiciones = async () => {
  try {
    const response = await getPosiciones()
    posiciones.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando posiciones:', error)
  }
}

const loadFichaMedica = async (atleta_id) => {
  try {
    const response = await request({ url: `/ficha-medica?atleta_id=${atleta_id}`, method: 'get' })
    fichaMedica.value = Array.isArray(response) && response.length > 0 ? response[0] : null
  } catch (error) {
    fichaMedica.value = null
  }
}

const loadMedidas = async (atleta_id) => {
  try {
    const response = await request({ url: `/mediciones?atleta_id=${atleta_id}`, method: 'get' })
    medidas.value = Array.isArray(response) ? response : []
  } catch (error) {
    medidas.value = []
  }
}

const loadTests = async (atleta_id) => {
  try {
    const response = await request({ url: `/tests?atleta_id=${atleta_id}`, method: 'get' })
    tests.value = Array.isArray(response) ? response : []
  } catch (error) {
    tests.value = []
  }
}

const loadTutor = async (tutor_id) => {
  if (!tutor_id) {
    tutor.value = null
    return
  }
  try {
    const response = await request({ url: `/tutor/${tutor_id}`, method: 'get' })
    tutor.value = response
  } catch (error) {
    tutor.value = null
  }
}

const selectAtleta = async (id, keepTab = false) => {
  currentAtletaId.value = id
  currentAtleta.value = atletas.value.find(a => a.atleta_id === id) || {}

  if (!keepTab) {
    activeTab.value = isUserMedico.value ? 'medical' : 'personal'
    fichaMedica.value = null
    medidas.value = []
    tests.value = []
    tutor.value = null
  }

  await Promise.all([
    loadFichaMedica(id),
    loadMedidas(id),
    loadTests(id),
    loadTutor(currentAtleta.value.tutor_id)
  ])
}

const loadData = async () => {
  await loadCategorias()
  await Promise.all([
    loadAtletas(),
    loadTutores(),
    loadPosiciones()
  ])
}

const resetAtletaForm = () => {
  Object.assign(atletaForm, {
    nombre: '',
    apellido: '',
    cedula: '',
    fecha_nacimiento: '',
    sexo: 'M',
    posicion_de_juego: '',
    categoria_id: '',
    tutor_id: null,
    telefono: '',
    direccion: {
      pais: 'venezuela',
      estado: '',
      municipio: '',
      parroquia: '',
      descripcion_descriptiva: ''
    },
    estatus: 'ACTIVO',
    foto: null,
    pierna_dominante: 'Derecha'
  })
}

const resetMedicalForm = () => {
  Object.assign(medicalForm, {
    tipo_sanguineo: '',
    alergias: '',
    lesion: '',
    condicion_medica: '',
    observacion: ''
  })
}

const resetAnthropometricForm = () => {
  Object.assign(anthropometricForm, {
    peso: null,
    altura: null,
    porcentaje_grasa: null,
    porcentaje_musculatura: null,
    envergadura: null,
    largo_de_pierna: null,
    largo_de_torso: null,
    fecha_medicion: ''
  })
}

const resetPerformanceForm = () => {
  Object.assign(performanceForm, {
    test_de_fuerza: null,
    test_resistencia: null,
    test_velocidad: null,
    test_coordinacion: null,
    test_de_reaccion: null,
    fecha_test: ''
  })
}

const resetTutorForm = () => {
  Object.assign(tutorForm, {
    nombre_completo: '',
    cedula: '',
    telefono: '',
    correo: '',
    direccion: {
      pais: '',
      estado: '',
      municipio: '',
      parroquia: '',
      descripcion_descriptiva: ''
    },
    tipo_relacion: ''
  })
}

const openAtletaModal = (editing) => {
  isEditingAtleta.value = editing
  if (editing && currentAtleta.value) {
    Object.assign(atletaForm, {
      nombre: currentAtleta.value.nombre,
      apellido: currentAtleta.value.apellido,
      cedula: currentAtleta.value.cedula,
      fecha_nacimiento: currentAtleta.value.fecha_nacimiento,
      sexo: currentAtleta.value.sexo || 'M',
      posicion_de_juego: currentAtleta.value.posicion_de_juego || '',
      categoria_id: currentAtleta.value.categoria_id,
      tutor_id: currentAtleta.value.tutor_id || null,
      telefono: currentAtleta.value.telefono || '',
      direccion: {
        pais: currentAtleta.value.pais || 'venezuela',
        estado: currentAtleta.value.estado || '',
        municipio: currentAtleta.value.municipio || '',
        parroquia: currentAtleta.value.parroquia || '',
        descripcion_descriptiva: currentAtleta.value.descripcion_descriptiva || ''
      },
      estatus: currentAtleta.value.estatus || 'ACTIVO',
      foto: currentAtleta.value.foto || '',
      pierna_dominante: currentAtleta.value.pierna_dominante || 'Derecha'
    })
  } else {
    resetAtletaForm()
  }
  showAtletaModal.value = true
}

const openMedicalModal = () => {
  if (fichaMedica.value) {
    Object.assign(medicalForm, {
      tipo_sanguineo: fichaMedica.value.tipo_sanguineo || '',
      alergias: fichaMedica.value.alergias || '',
      lesion: fichaMedica.value.lesion || '',
      condicion_medica: fichaMedica.value.condicion_medica || '',
      observacion: fichaMedica.value.observacion || ''
    })
  } else {
    resetMedicalForm()
  }
  showMedicalModal.value = true
}

const openAnthropometricModal = () => {
  if (medidas.value && medidas.value.length > 0) {
    const ultimaMedida = medidas.value[0]
    Object.assign(anthropometricForm, {
      peso: ultimaMedida.peso,
      altura: ultimaMedida.altura,
      porcentaje_grasa: ultimaMedida.porcentaje_grasa,
      porcentaje_musculatura: ultimaMedida.porcentaje_musculatura,
      envergadura: ultimaMedida.envergadura,
      largo_de_pierna: ultimaMedida.largo_de_pierna,
      largo_de_torso: ultimaMedida.largo_de_torso,
      fecha_medicion: new Date().toISOString().split('T')[0]
    })
  } else {
    resetAnthropometricForm()
    anthropometricForm.fecha_medicion = new Date().toISOString().split('T')[0]
  }
  showAnthropometricModal.value = true
}

const openPerformanceModal = () => {
  if (tests.value && tests.value.length > 0) {
    const ultimoTest = tests.value[0]
    Object.assign(performanceForm, {
      test_de_fuerza: ultimoTest.test_de_fuerza,
      test_resistencia: ultimoTest.test_resistencia,
      test_velocidad: ultimoTest.test_velocidad,
      test_coordinacion: ultimoTest.test_coordinacion,
      test_de_reaccion: ultimoTest.test_de_reaccion,
      fecha_test: new Date().toISOString().split('T')[0]
    })
  } else {
    resetPerformanceForm()
    performanceForm.fecha_test = new Date().toISOString().split('T')[0]
  }
  showPerformanceModal.value = true
}

const openTutorModal = () => {
  if (tutor.value) {
    isEditingTutor.value = true
    Object.assign(tutorForm, {
      nombre_completo: tutor.value.nombre_completo,
      cedula: tutor.value.cedula,
      telefono: tutor.value.telefono || '',
      correo: tutor.value.correo || '',
      direccion: {
        pais: tutor.value.pais || '',
        estado: tutor.value.estado || '',
        municipio: tutor.value.municipio || '',
        parroquia: tutor.value.parroquia || '',
        descripcion_descriptiva: tutor.value.descripcion_descriptiva || ''
      },
      tipo_relacion: tutor.value.tipo_relacion
    })
  } else {
    isEditingTutor.value = false
    resetTutorForm()
    if (currentAtleta.value) {
      Object.assign(tutorForm.direccion, {
        pais: currentAtleta.value.pais || 'venezuela',
        estado: currentAtleta.value.estado || '',
        municipio: currentAtleta.value.municipio || '',
        parroquia: currentAtleta.value.parroquia || '',
        descripcion_descriptiva: currentAtleta.value.descripcion_descriptiva || ''
      })
    }
  }
  showTutorModal.value = true
}

const atletaFormRef = ref(null)
const tutorFormRef = ref(null)

const saveAtleta = () => {
  atletaFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (isEditingAtleta.value) {
        await request({
          url: `/atletas/${currentAtletaId.value}`,
          method: 'put',
          data: atletaForm
        })
        ElMessage.success('Atleta actualizado correctamente')
      } else {
        await request({
          url: '/atletas',
          method: 'post',
          data: atletaForm
        })
        ElMessage.success('Atleta creado correctamente')
      }
      showAtletaModal.value = false
      await loadAtletas()
      if (isEditingAtleta.value) {
        await selectAtleta(currentAtletaId.value, true)
      }
    } catch (error) {
      console.error('Error guardando atleta:', error)
      ElMessage.error('Error al guardar atleta')
    } finally {
      loading.value = false
    }
  })
}

const saveMedical = async () => {
  loading.value = true
  try {
    const data = { ...medicalForm, atleta_id: currentAtletaId.value }
    if (fichaMedica.value) {
      await request({
        url: `/ficha-medica/${fichaMedica.value.ficha_id}`,
        method: 'put',
        data
      })
      ElMessage.success('Ficha médica actualizada')
    } else {
      await request({
        url: '/ficha-medica',
        method: 'post',
        data
      })
      ElMessage.success('Ficha médica creada')
    }
    showMedicalModal.value = false
    await loadFichaMedica(currentAtletaId.value)
  } catch (error) {
    console.error('Error guardando ficha médica:', error)
    ElMessage.error('Error al guardar ficha médica')
  } finally {
    loading.value = false
  }
}

const saveAnthropometric = async () => {
  loading.value = true
  try {
    const data = { ...anthropometricForm, atleta_id: currentAtletaId.value }
    await request({ url: '/mediciones', method: 'post', data })
    ElMessage.success('Medidas agregadas correctamente')
    showAnthropometricModal.value = false
    await loadMedidas(currentAtletaId.value)
  } catch (error) {
    console.error('Error guardando medidas:', error)
    ElMessage.error('Error al guardar medidas')
  } finally {
    loading.value = false
  }
}

const savePerformance = async () => {
  loading.value = true
  try {
    const data = { ...performanceForm, atleta_id: currentAtletaId.value }
    await request({ url: '/tests', method: 'post', data })
    ElMessage.success('Test agregado correctamente')
    showPerformanceModal.value = false
    await loadTests(currentAtletaId.value)
  } catch (error) {
    console.error('Error guardando test:', error)
    ElMessage.error('Error al guardar test')
  } finally {
    loading.value = false
  }
}

const saveTutor = () => {
  tutorFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (isEditingTutor.value && tutor.value) {
        await request({
          url: `/tutor/${tutor.value.tutor_id}`,
          method: 'put',
          data: tutorForm
        })
        ElMessage.success('Tutor actualizado correctamente')
      } else {
        const response = await request({
          url: '/tutor',
          method: 'post',
          data: tutorForm
        })
        const nuevoTutorId = response.id || response.tutor_id || response.insertId
        if (!nuevoTutorId) throw new Error('No se recibió el ID del tutor creado')
        await request({
          url: `/atletas/${currentAtletaId.value}/tutor`,
          method: 'put',
          data: { tutor_id: nuevoTutorId }
        })
        ElMessage.success('Tutor creado y asignado correctamente')
      }
      showTutorModal.value = false
      await loadAtletas()
      await selectAtleta(currentAtletaId.value, true)
    } catch (error) {
      console.error('Error guardando tutor:', error)
      ElMessage.error('Error al guardar tutor')
    } finally {
      loading.value = false
    }
  })
}

const handleEdit = () => {
  switch (activeTab.value) {
    case 'personal': openAtletaModal(true); break
    case 'medical': openMedicalModal(); break
    case 'anthropometric': openAnthropometricModal(); break
    case 'performance': openPerformanceModal(); break
    case 'tutor': openTutorModal(); break
  }
}

const deleteAtleta = () => {
  ElMessageBox.confirm('¿Estás seguro de eliminar este atleta?', 'Advertencia', {
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    type: 'warning'
  }).then(async () => {
    try {
      await request({ url: `/atletas/${currentAtletaId.value}`, method: 'delete' })
      ElMessage.success('Atleta eliminado correctamente')
      currentAtletaId.value = null
      currentAtleta.value = {}
      await loadAtletas()
    } catch (error) {
      console.error('Error eliminando atleta:', error)
      ElMessage.error('Error al eliminar atleta')
    }
  }).catch(() => {})
}

const formatEnum = (value) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const calculateAge = (birthdate) => {
  if (!birthdate) return '-'
  const birthDate = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES')
}

const getStatusType = (estatus) => {
  const types = { 'ACTIVO': 'success', 'INACTIVO': 'info', 'LESIONADO': 'warning', 'SUSPENDIDO': 'danger' }
  return types[estatus] || 'info'
}

const getEntrenadorNombre = (categoriaId) => {
  if (!categoriaId || !categorias.value.length) return 'No asignado'
  const categoria = categorias.value.find(c => c.categoria_id === categoriaId)
  return categoria ? (categoria.entrenador_nombre || categoria.nombre_entrenador || 'No asignado') : 'No asignado'
}

const getFotoUrl = (filename) => {
  if (!filename) return null
  return `${backendUrl}/uploads/atletas/${filename}`
}

const handleUploadSuccess = (res) => {
  atletaForm.foto = res.filename
  ElMessage.success('Foto cargada exitosamente')
}

const handlePaisChangeAtleta = () => {
  atletaForm.direccion.estado = ''
}

const removePhoto = () => {
  atletaForm.foto = ''
}

const beforeAvatarUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPGorPNG) ElMessage.error('La imagen debe estar en formato JPG o PNG')
  if (!isLt2M) ElMessage.error('La imagen no puede exceder los 2MB')
  return isJPGorPNG && isLt2M
}

const goToProgress = () => {
  router.push({ path: '/reportes/rendimiento', query: { atleta_id: currentAtletaId.value } })
}

// Watchers
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadAtletas(), 500)
})

watch(searchCedula, () => {
  if (searchCedulaTimeout) clearTimeout(searchCedulaTimeout)
  searchCedulaTimeout = setTimeout(() => loadAtletas(), 500)
})

watch([filterCedula, filterCategoria, filterEstatus, filterOrder, filterOrden], () => {
  if (filterCedula.value !== 'con_cedula') searchCedula.value = ''
  loadAtletas()
})

watch(currentAtletaId, (newId) => {
  if (newId && isUserMedico.value) activeTab.value = 'medical'
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.atletas-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
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

/* Header Button - Custom Style */
.add-atleta-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 10px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
}

.add-atleta-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px);
}

.add-atleta-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.main-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

aside.sidebar {
  padding: 0;
  background: transparent;
}

.sidebar-card {
  background: var(--color-bg-card);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--color-border);
  overflow: hidden;
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
}

.sidebar-title {
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.2px;
}

.filter-toggle-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 1.1rem;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-toggle-btn:hover {
  background: rgba(255,255,255,0.3);
}

/* Empty Main Content */
.empty-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--color-bg-card);
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.empty-main-content {
  text-align: center;
  padding: 40px;
}

.empty-main-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

.empty-main-content h3 {
  color: #475569;
  font-size: 1.3rem;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.empty-main-content p {
  color: var(--color-border);
  margin: 0;
  font-size: 0.95rem;
}

/* Detail Card */
.detail-card {
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--color-border);
  overflow: hidden;
}

/* Avatar Initials */
.avatar-initials {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
}

.avatar-initials-large {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
}

/* Athlete Status Dot */
.athlete-status-dot {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  align-self: center;
}
.athlete-status-dot.status-activo { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
.athlete-status-dot.status-inactivo { background: var(--color-border); }
.athlete-status-dot.status-lesionado { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }
.athlete-status-dot.status-suspendido { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.4); }

/* Athlete Category badge in list */
.athlete-category {
  color: var(--color-border) !important;
  font-size: 0.78rem !important;
}

/* Empty List */
.empty-list {
  text-align: center;
  padding: 50px 20px;
}

.empty-list-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.empty-list-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 6px 0;
}

.empty-list-hint {
  font-size: 0.82rem;
  color: var(--color-border);
  margin: 0;
}

/* Action Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.action-btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.action-btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);
}

.action-btn-danger {
  background: var(--color-bg-card);
  color: #ef4444;
  border-color: #fecaca;
}
.action-btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
  transform: translateY(-1px);
}

.action-btn-info {
  background: var(--color-bg-card);
  color: #3b82f6;
  border-color: #bfdbfe;
}
.action-btn-info:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.search-container {
  padding: 15px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.search-container :deep(.el-input__wrapper) {
  background: var(--color-bg-body) !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 10px;
  padding: 4px 14px;
  transition: all 0.2s ease;
}

.search-container :deep(.el-input__wrapper.is-focus) {
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1) !important;
  outline: none !important;
}

.search-container :deep(.el-input__inner) {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.search-container :deep(.el-input__prefix) {
  color: var(--color-border);
}

/* Athlete list scrollable area */
.athlete-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.athlete-list::-webkit-scrollbar {
  width: 6px;
}

.athlete-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.athlete-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-border);
}

/* Cedula Filter Styles */
.cedula-filter {
  margin-top: 10px;
}

.cedula-filter-buttons {
  display: flex;
  gap: 4px;
  border-radius: 10px;
  padding: 4px;
  background: var(--color-bg-body);
}

.cedula-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cedula-btn:hover {
  color: var(--color-primary);
  background: rgba(229, 29, 34, 0.05);
}

.cedula-btn.active {
  background: var(--color-bg-card);
  color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cedula-search-input {
  margin-top: 8px;
}

.cedula-search-input :deep(.el-input__wrapper) {
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 2px #64748b inset !important;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cedula-search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-primary) inset, 0 0 0 4px rgba(30, 41, 59, 0.12) !important;
}

.cedula-search-input :deep(.el-input__inner) {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.cedula-search-input :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
}

.filter-popover {
  padding: 5px;
}

.filter-popover h4 {
  margin: 0 0 18px 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
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
  color: var(--color-text-main);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.filter-item :deep(.el-select .el-input__wrapper) {
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 2px #64748b inset !important;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.filter-item :deep(.el-select .el-input__wrapper.is-hover) {
  box-shadow: 0 0 0 2px var(--color-primary) inset !important;
}

.filter-item :deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-primary) inset, 0 0 0 4px rgba(30, 41, 59, 0.12) !important;
}

.filter-item :deep(.el-select .el-input__inner) {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
}

/* Placeholder styling for select dropdowns in filter popover */
.filter-item :deep(.el-select .el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
  opacity: 1;
}

/* Estilos para el input de cédula - igual que los selectores */
.filter-item :deep(> .el-input .el-input__wrapper) {
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 2px #64748b inset !important;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.filter-item :deep(> .el-input .el-input__wrapper.is-hover) {
  box-shadow: 0 0 0 2px var(--color-primary) inset !important;
}

.filter-item :deep(> .el-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-primary) inset, 0 0 0 4px rgba(30, 41, 59, 0.12) !important;
}

.filter-item :deep(> .el-input .el-input__inner) {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.filter-item :deep(> .el-input .el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
  opacity: 1;
}

/* Estilos modernos para el switch */
.filter-item :deep(.el-switch) {
  height: 28px;
}

.filter-item :deep(.el-switch__core) {
  width: 50px !important;
  height: 26px !important;
  border-radius: 13px;
  border: 2px solid #cbd5e1;
  background-color: var(--color-border);
  transition: all 0.3s ease;
}

.filter-item :deep(.el-switch__core::after) {
  width: 20px;
  height: 20px;
  top: 1px;
  left: 1px;
  border-radius: 50%;
  background-color: var(--color-bg-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.filter-item :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

.filter-item :deep(.el-switch.is-checked .el-switch__core::after) {
  left: 100%;
  margin-left: -23px;
}

.filter-item :deep(.el-switch__label) {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.filter-item :deep(.el-switch__label.is-active) {
  color: var(--color-text-main);
}

.filter-item :deep(.el-switch__label--left) {
  margin-right: 8px;
}

.filter-item :deep(.el-switch__label--right) {
  margin-left: 8px;
}

.filter-btn {
  font-size: 1.3rem;
  color: var(--color-text-muted);
  padding: 5px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  color: var(--color-primary);
  transform: rotate(90deg);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
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
  border-color: var(--color-primary);
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
  padding: 14px;
  margin: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-card);
}

.athlete-item:hover {
  border-color: #cbd5e1;
  background: var(--color-bg-card);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.athlete-item.active {
  background: var(--color-bg-card);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary), 0 4px 12px rgba(30, 41, 59, 0.1);
}

.athlete-photo {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.3);
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
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.athlete-info p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 3px 0;
  font-weight: 500;
}

.athlete-details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--color-border);
}

.athlete-details-photo {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  background-color: var(--color-primary);
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
  color: var(--color-text-muted);
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

.tab-header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-item p {
  color: var(--color-text-muted);
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
  background-color: var(--color-bg-card);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.performance-item h4 {
  font-size: 0.9rem;
  color: var(--color-text-muted);
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
  color: var(--color-border);
}

.empty-tab {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-border);
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

:deep(.el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

:deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--color-primary);
}

:deep(.el-tabs__item:hover) {
  color: var(--color-primary);
}

:deep(.el-tabs__content) {
  height: calc(100vh - 350px);
  overflow-y: auto;
  padding-right: 10px;
}

:deep(.el-tabs__content::-webkit-scrollbar) {
  width: 8px;
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb) {
  background-color: #cbd5e1;
  border-radius: 4px;
}

/* Responsive - Tablets y Laptops pequeños */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .content-area {
    min-height: auto;
  }

  .athlete-details-header {
    flex-wrap: wrap;
    gap: 15px;
  }

  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-item.full-width {
    grid-column: 1 / span 2;
  }

  .performance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive - Tablets */
@media (max-width: 992px) {
  .atletas-container {
    padding: 15px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 15px;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .athlete-details-photo {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
  }

  .athlete-details-info h2 {
    font-size: 1.3rem;
  }

  .athlete-actions {
    flex-wrap: wrap;
  }
}

/* Responsive - Móviles */
@media (max-width: 768px) {
  .atletas-container {
    padding: 10px;
  }

  .page-header {
    padding: 12px;
    border-radius: 8px;
  }

  .header-content h1 {
    font-size: 1.3rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .athlete-details-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .athlete-details-photo {
    width: 70px;
    height: 70px;
    font-size: 2rem;
  }

  .athlete-details-info {
    text-align: center;
  }

  .athlete-details-info h2 {
    font-size: 1.2rem;
  }

  .athlete-details-info p {
    font-size: 0.85rem;
  }

  .athlete-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .athlete-actions .el-button {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .form-item.full-width {
    grid-column: 1;
  }

  .performance-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .performance-item {
    padding: 15px;
  }

  .performance-item p {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .empty-tab {
    padding: 50px 15px;
  }

  .tab-header-actions {
    justify-content: center;
  }

  /* Tabs scrollable */
  :deep(.el-tabs__nav-wrap) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-tabs__content) {
    height: auto;
    max-height: none;
  }
}

/* Responsive - Móviles pequeños */
@media (max-width: 480px) {
  .atletas-container {
    padding: 8px;
  }

  .page-header {
    padding: 10px;
  }

  .header-content h1 {
    font-size: 1.15rem;
  }

  .athlete-details-photo {
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
  }

  .athlete-details-info h2 {
    font-size: 1.1rem;
  }

  .form-item label {
    font-size: 0.85rem;
  }

  .form-item p {
    font-size: 0.9rem;
  }

  .performance-item h4 {
    font-size: 0.8rem;
  }

  .performance-item p {
    font-size: 1.3rem;
  }
}

.photo-preview-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  z-index: 10;
}

.photo-overlay:hover {
  opacity: 1;
}

.photo-overlay i {
  color: white;
  font-size: 24px;
}

.search-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding-left: 2px;
}

.search-field {
  margin-bottom: 12px;
}
</style>
