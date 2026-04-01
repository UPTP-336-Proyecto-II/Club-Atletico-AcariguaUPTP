<template>
  <div class="atletas-container">
    <!-- Header -->
    <div class="premium-header">
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
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de atletas -->
      <aside class="sidebar premium-sidebar">
        <el-card v-loading="loadingAtletas" shadow="hover">
          <div class="sidebar-header">
            <span class="sidebar-title">
              <el-icon class="sidebar-title-icon"><Collection /></el-icon>
              <span>Lista de Atletas</span>
            </span>
            <div class="sidebar-actions">
              <button v-if="canUserEdit" class="mini-add-btn" title="Agregar Atleta" @click="openAtletaModal(false)">
                <el-icon><Plus /></el-icon>
              </button>
              <el-popover placement="bottom-end" width="280" trigger="click" popper-class="athletes-filter-popper">
                <div class="filter-popover">
                  <div class="filter-popover-header">
                    <span class="filter-popover-kicker">Panel rápido</span>
                    <h4>Filtros avanzados</h4>
                    <p>Refina la lista por orden, categoría o estatus.</p>
                  </div>
                  <div class="filter-item">
                    <label>Ordenar por</label>
                    <el-select
                      v-model="filterOrder"
                      placeholder="Elige el orden"
                      class="modern-filter-select"
                      popper-class="athletes-filter-select-dropdown"
                      style="width: 100%"
                    >
                      <el-option label="Más Recientes" value="recent" />
                      <el-option label="Más Antiguos" value="oldest" />
                      <el-option label="Nombre (A-Z)" value="name_asc" />
                      <el-option label="Nombre (Z-A)" value="name_desc" />
                    </el-select>
                  </div>
                  <div class="filter-item">
                    <label>Categoría</label>
                    <el-select
                      v-model="filterCategoria"
                      placeholder="Todas las categorías"
                      clearable
                      class="modern-filter-select"
                      popper-class="athletes-filter-select-dropdown"
                      style="width: 100%"
                    >
                      <el-option v-for="cat in categorias" :key="cat.categoria_id" :label="cat.nombre_categoria" :value="cat.categoria_id" />
                    </el-select>
                  </div>
                  <div class="filter-item">
                    <label>Estatus</label>
                    <el-select
                      v-model="filterEstatus"
                      placeholder="Activos por defecto"
                      clearable
                      class="modern-filter-select"
                      popper-class="athletes-filter-select-dropdown"
                      style="width: 100%"
                    >
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
                  <button class="filter-toggle-btn" title="Abrir filtros avanzados">
                    <el-icon><Setting /></el-icon>
                  </button>
                </template>
              </el-popover>
            </div>
          </div>
          <div class="search-container">
            <div class="search-intro">
              <span class="search-intro-badge">Búsqueda rápida</span>
              <p>Encuentra atletas por nombre o filtra por cédula en segundos.</p>
            </div>
            <div class="search-field">
              <label class="premium-search-label">Buscar Atleta</label>
              <el-input v-model="searchQuery" placeholder="Busca por nombre o apellido" clearable class="modern-search-input modern-sidebar-control" />
            </div>
            <div class="cedula-filter">
              <label class="premium-search-label">Filtro de Cédula</label>
              <div class="modern-toggle-group">
                <button class="toggle-btn" :class="{ active: filterCedula === 'todos' }" @click="filterCedula = 'todos'">Todos</button>
                <button class="toggle-btn" :class="{ active: filterCedula === 'con_cedula' }" @click="filterCedula = 'con_cedula'">Con Cédula</button>
                <button class="toggle-btn" :class="{ active: filterCedula === 'sin_cedula' }" @click="filterCedula = 'sin_cedula'">Sin Cédula</button>
              </div>
              <el-input v-if="filterCedula === 'con_cedula'" v-model="searchCedula" placeholder="Escribe la cédula sin puntos" clearable maxlength="9" class="modern-cedula-input modern-sidebar-control" @input="v => searchCedula = v.replace(/\D/g, '')" />
              <p v-if="filterCedula === 'con_cedula'" class="field-caption">Usa solo números para encontrar coincidencias exactas.</p>
            </div>
          </div>
          <div class="athlete-list">
            <div v-for="atleta in atletas" :key="atleta.atleta_id" class="premium-list-item" :class="{ active: currentAtletaId === atleta.atleta_id }" @click="selectAtleta(atleta.atleta_id)">
              <div class="item-photo">
                <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="avatar-img">
                <span v-else class="avatar-initials">{{ (atleta.nombre || '?').charAt(0) }}{{ (atleta.apellido || '').charAt(0) }}</span>
              </div>
              <div class="item-info">
                <h3>{{ atleta.nombre }} {{ atleta.apellido }}</h3>
                <p>{{ formatEnum(atleta.posicion_de_juego_nombre) || 'Sin posición' }}</p>
                <p class="athlete-category">{{ atleta.categoria_nombre || 'Sin categoría' }}</p>
              </div>
              <span class="athlete-status-dot" :class="'status-' + (atleta.estatus || '').toLowerCase()" :title="atleta.estatus" />
            </div>
            <div v-if="atletas.length === 0" class="empty-list">
              <span class="empty-list-icon">
                <el-icon><Collection /></el-icon>
              </span>
              <p class="empty-list-title">Sin atletas</p>
              <p class="empty-list-hint">Agrega tu primer atleta con el botón de arriba</p>
            </div>
          </div>
        </el-card>
      </aside>

      <!-- Área de contenido -->
      <main class="content-area">
        <div v-if="!currentAtletaId" class="empty-main">
          <div class="empty-main-content">
            <span class="empty-main-icon">
              <el-icon><UserFilled /></el-icon>
            </span>
            <h3>No hay atleta seleccionado</h3>
            <p>Selecciona un atleta de la lista o agrega uno nuevo.</p>
          </div>
        </div>

        <el-card v-else v-loading="loading" shadow="hover" class="detail-card">
          <!-- Encabezado del atleta -->
          <div class="athlete-details-header">
            <div class="athlete-details-photo">
              <img v-if="currentAtleta.foto" :src="getFotoUrl(currentAtleta.foto)" class="avatar-img-large">
              <span v-else class="avatar-initials-large">{{ (currentAtleta.nombre || '?').charAt(0) }}{{ (currentAtleta.apellido || '').charAt(0) }}</span>
            </div>
            <div class="athlete-details-info">
              <h2>{{ currentAtleta.nombre }} {{ currentAtleta.apellido }}</h2>
              <div class="athlete-meta">
                <div class="athlete-meta-item">
                  <span class="athlete-meta-icon">
                    <el-icon><CollectionTag /></el-icon>
                  </span>
                  <span class="athlete-meta-copy">
                    <span class="athlete-meta-label">Categoría</span>
                    <span class="athlete-meta-value">{{ currentAtleta.categoria_nombre || 'No asignada' }}</span>
                  </span>
                </div>
                <div class="athlete-meta-item">
                  <span class="athlete-meta-icon">
                    <el-icon><Calendar /></el-icon>
                  </span>
                  <span class="athlete-meta-copy">
                    <span class="athlete-meta-label">Edad</span>
                    <span class="athlete-meta-value">{{ calculateAge(currentAtleta.fecha_nacimiento) }} años</span>
                  </span>
                </div>
              </div>
              <el-tag :type="getStatusType(currentAtleta.estatus)" size="small">{{ currentAtleta.estatus }}</el-tag>
            </div>
            <div class="athlete-actions">
              <button v-if="!isUserMedico" class="action-btn action-btn-info" @click="goToProgress" title="Análisis">
                <el-icon class="action-btn-icon"><DataAnalysis /></el-icon>
                <span>Análisis</span>
              </button>
              <button v-if="canUserEdit && !isUserMedico" class="action-btn action-btn-danger" @click="deleteAtleta" title="Eliminar">
                <el-icon class="action-btn-icon"><Delete /></el-icon>
                <span>Eliminar</span>
              </button>
              <button
                v-if="canUserEdit || (isUserEntrenador && (activeTab === 'anthropometric' || activeTab === 'performance'))"
                class="action-btn action-btn-primary"
                @click="handleEdit"
                title="Editar"
              >
                <el-icon class="action-btn-icon"><Edit /></el-icon>
                <span>Editar</span>
              </button>
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
      :title="isEditingAtleta ? 'Editar atleta' : 'Nuevo atleta'"
      v-model="showAtletaModal"
      width="700px"
      :close-on-click-modal="false"
      class="modern-athlete-dialog"
    >
      <el-form ref="atletaFormRef" :model="atletaForm" :rules="atletaRules" label-position="top" class="dialog-form">
        <div class="photo-upload-container">
          <div class="photo-upload-copy">
            <span class="photo-upload-badge">Foto del perfil</span>
            <p>Usa una imagen frontal en formato JPG o PNG. Tamaño máximo: 2 MB.</p>
          </div>
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
              <span>Subir foto</span>
            </div>
          </el-upload>
        </div>
        <section class="form-section-card">
          <div class="form-section-heading">
            <span class="form-section-kicker">Identidad</span>
            <h4>Datos personales</h4>
            <p>Información esencial para identificar al atleta dentro del club.</p>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Nombre" prop="nombre">
                <el-input
                  v-model="atletaForm.nombre"
                  placeholder="Ej. Luis"
                  @input="v => atletaForm.nombre = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Apellido" prop="apellido">
                <el-input
                  v-model="atletaForm.apellido"
                  placeholder="Ej. González"
                  @input="v => atletaForm.apellido = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Cédula (opcional)">
                <el-input
                  v-model="atletaForm.cedula"
                  placeholder="Solo números, sin puntos"
                  maxlength="9"
                  clearable
                  @input="v => atletaForm.cedula = v.replace(/\D/g, '')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Fecha de nacimiento" prop="fecha_nacimiento">
                <el-date-picker
                  v-model="atletaForm.fecha_nacimiento"
                  type="date"
                  placeholder="Selecciona la fecha"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disableFutureDates"
                  :editable="false"
                  :teleported="false"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>
        <section class="form-section-card">
          <div class="form-section-heading">
            <span class="form-section-kicker">Perfil deportivo</span>
            <h4>Rol dentro del equipo</h4>
            <p>Define la categoría, posición y estatus actual del atleta.</p>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Sexo" prop="sexo">
                <el-select v-model="atletaForm.sexo" placeholder="Elige una opción" style="width: 100%">
                  <el-option label="Masculino" value="M" />
                  <el-option label="Femenino" value="F" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Posición de juego">
                <el-select v-model="atletaForm.posicion_de_juego" placeholder="Selecciona la posición" style="width: 100%">
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
                <el-select v-model="atletaForm.categoria_id" placeholder="Selecciona la categoría" style="width: 100%">
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
              <el-form-item label="Entrenador a cargo">
                <el-input
                  :value="getEntrenadorNombre(atletaForm.categoria_id)"
                  disabled
                  placeholder="Se completa al elegir la categoría"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Teléfono">
                <el-input
                  v-model="atletaForm.telefono"
                  placeholder="Solo números, por ejemplo 04141234567"
                  maxlength="11"
                  clearable
                  @input="v => atletaForm.telefono = v.replace(/\D/g, '')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Estatus">
                <el-select v-model="atletaForm.estatus" placeholder="Selecciona el estatus" style="width: 100%">
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
              <el-form-item label="Pierna dominante">
                <el-select v-model="atletaForm.pierna_dominante" placeholder="Elige la pierna hábil" style="width: 100%">
                  <el-option label="Derecha" value="Derecha" />
                  <el-option label="Izquierda" value="Izquierda" />
                  <el-option label="Ambidiestro" value="Ambidiestro" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </section>
        <section class="form-section-card">
          <div class="form-section-heading">
            <span class="form-section-kicker">Ubicación</span>
            <h4>Dirección del atleta</h4>
            <p>Agrega una dirección clara para contacto y registro administrativo.</p>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="País">
                <el-select v-model="atletaForm.direccion.pais" placeholder="Selecciona el país" style="width: 100%" filterable @change="handlePaisChangeAtleta">
                  <el-option v-for="pais in paises" :key="pais" :label="formatEnum(pais)" :value="pais" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Estado">
                <el-select v-if="atletaForm.direccion.pais === 'venezuela'" v-model="atletaForm.direccion.estado" placeholder="Selecciona el estado" style="width: 100%" filterable>
                  <el-option v-for="estado in estadosVenezuela" :key="estado" :label="formatEnum(estado)" :value="estado" />
                </el-select>
                <el-input v-else v-model="atletaForm.direccion.estado" placeholder="Estado o provincia" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Municipio">
                <el-input
                  v-model="atletaForm.direccion.municipio"
                  placeholder="Ej. Páez"
                  @input="v => atletaForm.direccion.municipio = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Parroquia">
                <el-input
                  v-model="atletaForm.direccion.parroquia"
                  placeholder="Ej. Acarigua"
                  @input="v => atletaForm.direccion.parroquia = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Descripción de la dirección">
                <el-input v-model="atletaForm.direccion.descripcion_descriptiva" placeholder="Calle, casa, sector y punto de referencia" type="textarea" :rows="3" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>
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
      title="Ficha médica"
      v-model="showMedicalModal"
      width="600px"
      :close-on-click-modal="false"
      class="modern-athlete-dialog"
    >
      <el-form ref="medicalFormRef" :model="medicalForm" label-position="top" class="dialog-form">
        <div class="dialog-form-intro compact-intro">
          <div>
            <span class="dialog-form-kicker">Salud</span>
            <h3>Resumen médico</h3>
          </div>
          <p>Registra la información clave para atención rápida y seguimiento seguro.</p>
        </div>
        <section class="form-section-card">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Tipo sanguíneo">
                <el-select v-model="medicalForm.tipo_sanguineo" placeholder="Selecciona el tipo" style="width: 100%">
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
                <el-input v-model="medicalForm.alergias" placeholder="Ej. Penicilina, maní o polvo" clearable />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Lesiones">
            <el-input v-model="medicalForm.lesion" type="textarea" :rows="3" placeholder="Describe lesiones previas o actuales" />
          </el-form-item>
          <el-form-item label="Condición médica">
            <el-input v-model="medicalForm.condicion_medica" type="textarea" :rows="3" placeholder="Indica diagnósticos o condiciones relevantes" />
          </el-form-item>
          <el-form-item label="Observaciones">
            <el-input v-model="medicalForm.observacion" type="textarea" :rows="4" placeholder="Añade alertas, restricciones o notas médicas" />
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="showMedicalModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveMedical">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Medidas Antropométricas -->
    <el-dialog
      title="Medidas antropométricas"
      v-model="showAnthropometricModal"
      width="600px"
      :close-on-click-modal="false"
      class="modern-athlete-dialog"
    >
      <el-form ref="anthropometricFormRef" :model="anthropometricForm" label-position="top" class="dialog-form">
        <div class="dialog-form-intro compact-intro">
          <div>
            <span class="dialog-form-kicker">Control físico</span>
            <h3>Registro de medición</h3>
          </div>
          <p>Guarda los valores más recientes para seguir la evolución del atleta.</p>
        </div>
        <section class="form-section-card">
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
              <el-form-item label="Porcentaje de grasa">
                <el-input-number v-model="anthropometricForm.porcentaje_grasa" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Porcentaje de musculatura">
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
              <el-form-item label="Largo de pierna (cm)">
                <el-input-number v-model="anthropometricForm.largo_de_pierna" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Largo de torso (cm)">
                <el-input-number v-model="anthropometricForm.largo_de_torso" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Fecha de medición">
            <el-date-picker
              v-model="anthropometricForm.fecha_medicion"
              type="date"
              placeholder="Selecciona la fecha de medición"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :editable="false"
              :teleported="false"
            />
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="showAnthropometricModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveAnthropometric">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Tests de Rendimiento -->
    <el-dialog
      title="Test de rendimiento"
      v-model="showPerformanceModal"
      width="600px"
      :close-on-click-modal="false"
      class="modern-athlete-dialog"
    >
      <el-form ref="performanceFormRef" :model="performanceForm" label-position="top" class="dialog-form">
        <div class="dialog-form-intro compact-intro">
          <div>
            <span class="dialog-form-kicker">Rendimiento</span>
            <h3>Resultados del atleta</h3>
          </div>
          <p>Ingresa el resultado más reciente de cada prueba para mantener el historial al día.</p>
        </div>
        <section class="form-section-card">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Test de fuerza">
                <el-input-number v-model="performanceForm.test_de_fuerza" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Test de resistencia">
                <el-input-number v-model="performanceForm.test_resistencia" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Test de velocidad">
                <el-input-number v-model="performanceForm.test_velocidad" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Test de coordinación">
                <el-input-number v-model="performanceForm.test_coordinacion" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Test de reacción">
                <el-input-number v-model="performanceForm.test_de_reaccion" :min="0" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Fecha del test">
                <el-date-picker
                  v-model="performanceForm.fecha_test"
                  type="date"
                  placeholder="Selecciona la fecha del test"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :editable="false"
                  :teleported="false"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="showPerformanceModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="savePerformance">Guardar</el-button>
      </template>
    </el-dialog>

    <!-- Modal Tutor -->
    <el-dialog
      :title="isEditingTutor ? 'Editar tutor' : 'Nuevo tutor'"
      v-model="showTutorModal"
      width="600px"
      :close-on-click-modal="false"
      class="modern-athlete-dialog"
    >
      <el-form ref="tutorFormRef" :model="tutorForm" :rules="tutorRules" label-position="top" class="dialog-form">
        <div class="dialog-form-intro compact-intro">
          <div>
            <span class="dialog-form-kicker">Responsable</span>
            <h3>Datos del tutor</h3>
          </div>
          <p>Registra el contacto principal del atleta con información clara y fácil de consultar.</p>
        </div>
        <section class="form-section-card">
          <div class="form-section-heading">
            <span class="form-section-kicker">Contacto</span>
            <h4>Información principal</h4>
            <p>Estos datos se usan para comunicación y respaldo administrativo.</p>
          </div>
          <el-form-item label="Nombre completo" prop="nombre_completo">
            <el-input v-model="tutorForm.nombre_completo" placeholder="Ej. María Fernanda Pérez" />
          </el-form-item>
          <el-form-item label="Cédula" prop="cedula">
            <el-input v-model="tutorForm.cedula" placeholder="Solo números, sin puntos" maxlength="10" clearable @input="v => tutorForm.cedula = v.replace(/\D/g, '')" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Teléfono" prop="telefono">
                <el-input
                  v-model="tutorForm.telefono"
                  placeholder="Solo números, por ejemplo 04141234567"
                  maxlength="11"
                  clearable
                  @input="v => tutorForm.telefono = v.replace(/\D/g, '')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Correo" prop="correo">
                <el-input v-model="tutorForm.correo" placeholder="ejemplo@correo.com" clearable />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Tipo de relación" prop="tipo_relacion">
            <el-select v-model="tutorForm.tipo_relacion" placeholder="Selecciona la relación" style="width: 100%">
              <el-option label="Familiar (Padre/Madre)" value="Familiar" />
              <el-option label="Allegado a familia" value="adyegado a familia" />
              <el-option label="Representante Legal" value="Representante legal" />
              <el-option label="Otro" value="OTRO" />
            </el-select>
          </el-form-item>
        </section>
        <section class="form-section-card">
          <div class="form-section-heading">
            <span class="form-section-kicker">Ubicación</span>
            <h4>Dirección del tutor</h4>
            <p>Agrega una dirección detallada para tener un punto de contacto confiable.</p>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="País" prop="direccion.pais">
                <el-select v-model="tutorForm.direccion.pais" placeholder="Selecciona el país" style="width: 100%" filterable>
                  <el-option v-for="pais in paises" :key="pais" :label="formatEnum(pais)" :value="pais" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Estado" prop="direccion.estado">
                <el-select v-if="tutorForm.direccion.pais === 'venezuela'" v-model="tutorForm.direccion.estado" placeholder="Selecciona el estado" style="width: 100%" filterable>
                  <el-option v-for="estado in estadosVenezuela" :key="estado" :label="formatEnum(estado)" :value="estado" />
                </el-select>
                <el-input v-else v-model="tutorForm.direccion.estado" placeholder="Estado o provincia" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Municipio" prop="direccion.municipio">
                <el-input v-model="tutorForm.direccion.municipio" placeholder="Ej. Páez" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Parroquia" prop="direccion.parroquia">
                <el-input v-model="tutorForm.direccion.parroquia" placeholder="Ej. Acarigua" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Dirección detallada">
            <el-input v-model="tutorForm.direccion.descripcion_descriptiva" type="textarea" :rows="3" placeholder="Calle, casa, sector y punto de referencia" />
          </el-form-item>
        </section>
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Collection, CollectionTag, Plus, Setting, DataAnalysis, Delete, Edit, UserFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { canEdit, isMedico, isEntrenador, getVisibleAtletasTabs } from '@/utils/permission'
import { getPosiciones } from '@/api/posiciones'
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

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

const isValidExistingDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim())
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12) return false

  const maxDay = new Date(year, month, 0).getDate()
  return day >= 1 && day <= maxDay
}

const disableFutureDates = (date) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}

const validateExistingDate = (label, required = false) => (rule, value, callback) => {
  const normalized = String(value || '').trim()

  if (!normalized) {
    if (required) callback(new Error(`${label} es requerida`))
    else callback()
    return
  }

  if (!isValidExistingDate(normalized)) {
    callback(new Error(`${label} no existe. Usa una fecha valida`))
    return
  }

  if (normalized > getTodayLocalDate()) {
    callback(new Error(`${label} no puede ser futura`))
    return
  }

  callback()
}

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
  fecha_nacimiento: [{ validator: validateExistingDate('La fecha de nacimiento', true), trigger: ['change', 'blur'] }],
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
const hasOpenModal = computed(() => (
  showAtletaModal.value ||
  showMedicalModal.value ||
  showAnthropometricModal.value ||
  showPerformanceModal.value ||
  showTutorModal.value
))

// Methods
const loadCategorias = async () => {
  try {
    const response = await request({ url: '/categoria', method: 'get' })
    categorias.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
}

const loadAtletas = async ({ silent = false } = {}) => {
  if (!silent) loadingAtletas.value = true
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
    if (!silent) ElMessage.error('Error al cargar atletas')
  } finally {
    if (!silent) loadingAtletas.value = false
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

const clearCurrentAtletaSelection = () => {
  currentAtletaId.value = null
  currentAtleta.value = {}
  fichaMedica.value = null
  medidas.value = []
  tests.value = []
  tutor.value = null
}

const refreshCurrentAtletaData = async () => {
  if (!currentAtletaId.value) return

  const selectedAtleta = atletas.value.find(a => a.atleta_id === currentAtletaId.value)
  if (!selectedAtleta) {
    clearCurrentAtletaSelection()
    return
  }

  currentAtleta.value = selectedAtleta

  await Promise.all([
    loadFichaMedica(currentAtletaId.value),
    loadMedidas(currentAtletaId.value),
    loadTests(currentAtletaId.value),
    loadTutor(currentAtleta.value.tutor_id)
  ])
}

const selectAtleta = async (id, keepTab = false) => {
  currentAtletaId.value = id

  if (!keepTab) {
    activeTab.value = isUserMedico.value ? 'medical' : 'personal'
    fichaMedica.value = null
    medidas.value = []
    tests.value = []
    tutor.value = null
  }

  await refreshCurrentAtletaData()
}

const loadData = async () => {
  await loadCategorias()
  await Promise.all([
    loadAtletas(),
    loadTutores(),
    loadPosiciones()
  ])
}

const getTodayLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeDateValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  return ''
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
      fecha_nacimiento: normalizeDateValue(currentAtleta.value.fecha_nacimiento),
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
      fecha_medicion: getTodayLocalDate()
    })
  } else {
    resetAnthropometricForm()
    anthropometricForm.fecha_medicion = getTodayLocalDate()
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
      fecha_test: getTodayLocalDate()
    })
  } else {
    resetPerformanceForm()
    performanceForm.fecha_test = getTodayLocalDate()
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
    const payload = {
      ...atletaForm,
      fecha_nacimiento: normalizeDateValue(atletaForm.fecha_nacimiento)
    }
    try {
      if (isEditingAtleta.value) {
        await request({
          url: `/atletas/${currentAtletaId.value}`,
          method: 'put',
          data: payload
        })
        ElMessage.success('Atleta actualizado correctamente')
      } else {
        await request({
          url: '/atletas',
          method: 'post',
          data: payload
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
      const backendError = error?.response?.data?.error
      ElMessage.error(backendError || 'Error al guardar atleta')
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
      clearCurrentAtletaSelection()
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

useServerDataRefresh(async () => {
  await loadAtletas({ silent: true })
  await refreshCurrentAtletaData()
}, {
  isBusy: () => loading.value || loadingAtletas.value || hasOpenModal.value
})

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

onMounted(async () => {
  await loadData()
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (searchCedulaTimeout) clearTimeout(searchCedulaTimeout)
})
</script>

<style scoped>
.atletas-container {
  padding: 20px;
  min-height: 100vh;
}

.premium-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 24px 30px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px -5px var(--color-shadow);
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

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-add-btn {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border: 1px solid rgba(255, 255, 255, 0.28);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 10px rgba(0,0,0,0.15);
  }
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.2px;
}

.sidebar-title-icon {
  font-size: 1rem;
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
  width: 88px;
  height: 88px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  border-radius: 24px;
  font-size: 2.4rem;
  color: var(--color-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.42));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
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
  color: var(--color-text-main) !important;
  font-size: 0.8rem !important;
  font-weight: 600;
  opacity: 1;
}

/* Empty List */
.empty-list {
  text-align: center;
  padding: 50px 20px;
}

.empty-list-icon {
  width: 64px;
  height: 64px;
  font-size: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  border-radius: 18px;
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
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

.action-btn-icon {
  font-size: 0.95rem;
}

/* Search & Filters Inside Sidebar */
.search-container {
  padding: 18px 16px 16px;
  background: linear-gradient(180deg, rgba(255, 59, 48, 0.08), transparent 90px), var(--color-bg-card);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.search-intro {
  margin-bottom: 14px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.search-intro-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

[data-theme='dark'] .search-intro-badge {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-color: transparent;
}

.search-intro p {
  margin: 10px 0 0;
  color: var(--color-text-main);
  font-size: 0.82rem;
  line-height: 1.5;
}

.premium-search-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  margin-bottom: 8px;
  opacity: 0.95;
}

:deep(.athletes-filter-popper) {
  border-radius: 22px !important;
  padding: 0 !important;
  background: var(--color-bg-card) !important;
  border: 1px solid rgba(148, 163, 184, 0.16) !important;
  box-shadow: 0 28px 55px -35px rgba(15, 23, 42, 0.75) !important;
}

.filter-popover {
  padding: 18px;
}

.filter-popover-header {
  margin-bottom: 16px;
}

.filter-popover-kicker {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 59, 48, 0.12);
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-popover-header h4 {
  margin: 10px 0 6px;
  color: var(--color-text-main);
  font-size: 1rem;
  font-weight: 800;
}

.filter-popover-header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.83rem;
  line-height: 1.5;
}

.filter-item {
  margin-bottom: 14px;
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-item label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:deep(.modern-filter-select .el-select__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  background: var(--color-bg-body);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
  transition: box-shadow 0.25s ease, background 0.25s ease, transform 0.25s ease;
}

:deep(.modern-filter-select .el-select__wrapper:hover) {
  box-shadow: inset 0 0 0 1px rgba(255, 90, 79, 0.28);
}

:deep(.modern-filter-select .el-select__wrapper.is-focused) {
  background: var(--color-bg-card);
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.14), inset 0 0 0 1px var(--color-primary);
}

:deep(.athletes-filter-select-dropdown.el-popper) {
  border-radius: 14px !important;
  background: var(--color-bg-card) !important;
  border: 1px solid rgba(148, 163, 184, 0.18) !important;
  box-shadow: 0 22px 40px -28px rgba(15, 23, 42, 0.9) !important;
}

:deep(.athletes-filter-select-dropdown .el-popper__arrow::before) {
  background: var(--color-bg-card) !important;
  border-color: rgba(148, 163, 184, 0.18) !important;
}

:deep(.athletes-filter-select-dropdown .el-select-dropdown__wrap) {
  background: transparent !important;
}

:deep(.athletes-filter-select-dropdown .el-select-dropdown__item) {
  color: var(--color-text-main) !important;
  font-weight: 600;
}

:deep(.athletes-filter-select-dropdown .el-select-dropdown__item:hover),
:deep(.athletes-filter-select-dropdown .el-select-dropdown__item.hover) {
  background: rgba(255, 59, 48, 0.16) !important;
  color: var(--color-text-main) !important;
}

:deep(.athletes-filter-select-dropdown .el-select-dropdown__item.selected) {
  background: rgba(255, 59, 48, 0.22) !important;
  color: #bfdbfe !important;
  font-weight: 700;
}

:deep(.modern-sidebar-control .el-input__wrapper) {
  min-height: 46px;
  border-radius: 15px;
  background: var(--color-bg-body);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  padding: 0 14px;
  transition: box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

:deep(.modern-sidebar-control .el-input__wrapper:hover) {
  box-shadow: inset 0 0 0 1px rgba(255, 90, 79, 0.26);
}

:deep(.modern-sidebar-control .el-input__wrapper.is-focus) {
  background: var(--color-bg-card);
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.14), inset 0 0 0 1px var(--color-primary);
}

:deep(.modern-sidebar-control .el-input__inner) {
  font-size: 0.93rem;
  font-weight: 600;
  color: var(--color-text-main);
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.field-caption {
  margin: 8px 2px 0;
  color: var(--color-text-muted);
  font-size: 0.77rem;
  line-height: 1.45;
}

.modern-toggle-group {
  display: flex;
  gap: 6px;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.14), rgba(148, 163, 184, 0.08));
  padding: 6px;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.toggle-btn {
  flex: 1;
  border: 1px solid transparent;
  background: transparent;
  padding: 9px 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-muted);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: linear-gradient(135deg, rgba(255, 59, 48, 0.18), rgba(255, 59, 48, 0.08));
    color: var(--color-primary);
    border-color: rgba(255, 90, 79, 0.16);
    box-shadow: 0 18px 30px -28px rgba(255, 59, 48, 0.95);
    transform: translateY(-1px);
  }

  &:hover:not(.active) {
    color: var(--color-text-main);
    background: rgba(255, 255, 255, 0.05);
  }
}

.modern-cedula-input {
  margin-top: 8px;
}

/* Modern Dialog Forms */
:deep(.modern-athlete-dialog) {
  border-radius: 28px !important;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 59, 48, 0.06), transparent 140px), var(--color-bg-card);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 35px 70px -42px rgba(15, 23, 42, 0.8);
}

:deep(.modern-athlete-dialog .el-dialog__header) {
  padding: 24px 24px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

:deep(.modern-athlete-dialog .el-dialog__title) {
  color: var(--color-text-main);
  font-size: 1.14rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

:deep(.modern-athlete-dialog .el-dialog__body) {
  padding: 20px 24px 8px;
}

:deep(.modern-athlete-dialog .el-dialog__footer) {
  padding: 0 24px 24px;
}

:deep(.modern-athlete-dialog .el-button) {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
}

:deep(.modern-athlete-dialog .el-button--default) {
  background: var(--color-bg-body);
  border-color: transparent;
  color: var(--color-text-main);
}

:deep(.modern-athlete-dialog .el-button--default:hover) {
  background: var(--color-bg-hover);
  border-color: rgba(148, 163, 184, 0.16);
  color: var(--color-text-main);
}

.photo-upload-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.14), rgba(255, 122, 102, 0.05));
  border: 1px dashed rgba(96, 165, 250, 0.28);
  box-shadow: 0 24px 36px -34px rgba(255, 59, 48, 0.95);
}

.photo-upload-copy {
  flex: 1;
}

.photo-upload-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.photo-upload-copy p {
  margin: 10px 0 0;
  color: var(--color-text-main);
  font-size: 0.86rem;
  line-height: 1.5;
}

.avatar-uploader {
  flex-shrink: 0;
}

.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  border-radius: 18px;
  border: 1px dashed rgba(255, 90, 79, 0.38);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-primary);
  font-weight: 700;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.avatar-uploader-icon:hover {
  transform: translateY(-2px);
  background: rgba(255, 59, 48, 0.08);
  box-shadow: 0 22px 34px -30px rgba(255, 59, 48, 0.95);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dialog-form-intro {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.14), rgba(255, 122, 102, 0.05));
  border: 1px solid rgba(96, 165, 250, 0.18);
  box-shadow: 0 20px 34px -30px rgba(255, 59, 48, 0.95);
}

.compact-intro {
  padding: 16px 18px;
}

.dialog-form-kicker {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dialog-form-intro h3 {
  margin: 10px 0 0;
  color: var(--color-text-main);
  font-size: 1.18rem;
  font-weight: 800;
}

.dialog-form-intro p {
  margin: 0;
  max-width: 260px;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.form-section-card {
  padding: 18px 18px 6px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 59, 48, 0.05), transparent 48px), var(--color-bg-card);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 24px 42px -38px rgba(15, 23, 42, 0.95);
}

.form-section-heading {
  margin-bottom: 16px;
}

.form-section-kicker {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 59, 48, 0.12);
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.form-section-heading h4 {
  margin: 10px 0 6px;
  color: var(--color-text-main);
  font-size: 1rem;
  font-weight: 800;
}

.form-section-heading p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

:deep(.dialog-form .el-form-item) {
  margin-bottom: 18px;
}

:deep(.dialog-form .el-form-item__label) {
  padding-bottom: 8px;
  color: var(--color-text-main);
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

:deep(.dialog-form .el-input__wrapper),
:deep(.dialog-form .el-select__wrapper),
:deep(.dialog-form .el-date-editor .el-input__wrapper),
:deep(.dialog-form .el-input-number .el-input__wrapper) {
  min-height: 48px;
  border-radius: 16px;
  background: transparent !important;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  padding: 0 14px;
  transition: box-shadow 0.25s ease, background 0.25s ease, transform 0.25s ease;
}

:deep(.dialog-form .el-input__wrapper:hover),
:deep(.dialog-form .el-select__wrapper:hover),
:deep(.dialog-form .el-date-editor .el-input__wrapper:hover),
:deep(.dialog-form .el-input-number:hover .el-input__wrapper) {
  box-shadow: inset 0 0 0 1px rgba(255, 90, 79, 0.28);
}

:deep(.dialog-form .el-input__wrapper.is-focus),
:deep(.dialog-form .el-select__wrapper.is-focused),
:deep(.dialog-form .el-date-editor .el-input__wrapper.is-focus),
:deep(.dialog-form .el-input-number .el-input__wrapper.is-focus) {
  background: transparent !important;
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.12), inset 0 0 0 1px var(--color-primary);
}

:deep(.dialog-form .el-input__inner),
:deep(.dialog-form .el-select__selected-item),
:deep(.dialog-form .el-select__placeholder),
:deep(.dialog-form .el-textarea__inner),
:deep(.dialog-form .el-input-number .el-input__inner) {
  color: var(--color-text-main);
  font-size: 0.95rem;
  font-weight: 500;
}

:deep(.dialog-form .el-textarea__inner) {
  min-height: 104px;
  border-radius: 16px;
  background: transparent !important;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  padding: 14px 16px;
  line-height: 1.55;
  resize: vertical;
  transition: box-shadow 0.25s ease, background 0.25s ease;
}

:deep(.dialog-form .el-textarea__inner:hover) {
  box-shadow: inset 0 0 0 1px rgba(255, 90, 79, 0.28);
}

:deep(.dialog-form .el-textarea__inner:focus) {
  background: transparent !important;
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.12), inset 0 0 0 1px var(--color-primary);
}

:deep(.dialog-form .el-input-number) {
  width: 100%;
}

:deep(.dialog-form .el-input-number__increase),
:deep(.dialog-form .el-input-number__decrease) {
  width: 34px;
  border: none;
  background: transparent;
  color: var(--color-primary);
}

:deep(.dialog-form .el-input-number__increase:hover),
:deep(.dialog-form .el-input-number__decrease:hover) {
  background: rgba(255, 59, 48, 0.08);
}

/* Athlete List */
.athlete-list {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 450px);
}

.athlete-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: auto;
}

.status-activo { background-color: #10b981; }
.status-lesionado { background-color: #f59e0b; }
.status-suspendido { background-color: #ef4444; }
.status-inactivo { background-color: #64748b; }

/* Detail Card */
.detail-card {
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.athlete-details-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 24px;
}

.athlete-details-photo {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.8rem;
}

.item-photo {
  overflow: hidden;
}

.avatar-img,
.avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.athlete-details-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.athlete-details-info h2 {
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  color: var(--color-text-main);
  word-break: break-all;
}

.athlete-details-info p {
  color: var(--color-text-muted);
  margin: 4px 0;
  font-size: 0.95rem;
}

.athlete-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 14px;
}

.athlete-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, var(--color-bg-card), var(--color-bg-body));
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 26px rgba(2, 6, 23, 0.18);
}

.athlete-meta-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--color-primary);
  background: linear-gradient(180deg, var(--color-bg-body), var(--color-bg-card));
  font-size: 1rem;
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.athlete-meta-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.athlete-meta-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.athlete-meta-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-main);
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
  color: var(--color-text-main);
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
  color: var(--color-text-main);
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

  .athlete-meta {
    justify-content: center;
  }

  .athlete-meta-item {
    width: 100%;
    justify-content: center;
  }

  .athlete-meta-copy {
    align-items: center;
  }

  .athlete-meta-value {
    font-size: 0.9rem;
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

  .dialog-form-intro,
  .photo-upload-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-form-intro p {
    max-width: none;
  }

  .form-section-card {
    padding: 16px 16px 4px;
  }

  :deep(.modern-athlete-dialog) {
    width: calc(100vw - 24px) !important;
  }

  :deep(.modern-athlete-dialog .el-dialog__header) {
    padding: 20px 18px 12px;
  }

  :deep(.modern-athlete-dialog .el-dialog__body) {
    padding: 16px 18px 8px;
  }

  :deep(.modern-athlete-dialog .el-dialog__footer) {
    padding: 0 18px 18px;
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

  .dialog-form-intro h3 {
    font-size: 1.02rem;
  }

  .photo-upload-container {
    padding: 16px;
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

