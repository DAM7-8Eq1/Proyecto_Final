sap.ui.define(
  [
    // Importación de dependencias necesarias para el controlador
    "com/inv/sapfiroriwebinversion/controller/BaseController", // Controlador base personalizado
    "sap/ui/model/json/JSONModel", // Modelo JSON para manejar datos
    "sap/m/MessageBox", // Para mostrar mensajes de confirmación/error
    "sap/m/MessageToast", // Para mostrar notificaciones tipo toast
    "sap/ui/model/Filter", // Para filtrar datos en las tablas
    "sap/ui/core/Fragment", // Para cargar fragmentos XML (diálogos)
    "sap/ui/model/FilterOperator", // Operadores de filtrado (Contains, Equals, etc.)
    "jquery", // Librería jQuery
  ],
  function (
    BaseController,
    JSONModel,
    MessageBox,
    MessageToast,
    Filter,
    Fragment,
    FilterOperator,
    $
  ) {
    "use strict";

    return BaseController.extend(
      "com.inv.sapfiroriwebinversion.controller.catalogs.pages.Values",
      {
        // ========================================
        // VARIABLES GLOBALES DEL CONTROLADOR
        // ========================================

        // Variable para almacenar el ID del label actual seleccionado
        currentLabelId: null,

        // ========================================
        // INICIALIZACIÓN DEL CONTROLADOR
        // ========================================

        /**
         * Método que se ejecuta al inicializar la vista
         * Configura los modelos de datos necesarios
         */
        onInit: function () {
          // Modelo principal "values" - contiene los datos de la tabla de valores
          this.getView().setModel(
            new JSONModel({
              values: [], // Array que almacena todos los valores mostrados en la tabla
              selectedValueIn: null, // Bandera para controlar el estado de los botones (editar/eliminar)
            }),
            "values"
          );

          // Modelo "newValueModel" - contiene los datos del formulario para crear/editar valores
          this.getView().setModel(
            new JSONModel({
              VALUEID: "", // ID único del valor
              VALUE: "", // Nombre del valor
              VALUEPAID: "", // ID compuesto del valor
              ALIAS: "", // Alias o nombre corto
              IMAGE: "", // URL de imagen asociada
              DESCRIPTION: "", // Descripción del valor
            }),
            "newValueModel"
          );

          // Verificación de seguridad - asegura que el modelo "values" existe
          if (!this.getView().getModel("values")) {
            this.getView().setModel(
              new sap.ui.model.json.JSONModel(),
              "values"
            );
          }

          // Cargar los datos iniciales del ComboBox de Labels
          this.loadCombboLabelId();
        },

        // ========================================
        // MÉTODOS DE CARGA DE DATOS
        // ========================================

        /**
         * Prepara los datos para el ComboBox de selección de Labels
         * Toma los labels del modelo y los formatea para el ComboBox
         */
        loadCombboLabelId: function () {
          var oValuesModel = this.getView().getModel("values");
          var aLabels = oValuesModel.getProperty("/AllLabels") || [];

          // Mapea los labels para asegurar compatibilidad con diferentes estructuras de datos
          var aComboItems = aLabels.map(function (label) {
            return {
              LABELIDC: label.LABELIDC || label.LABELID, // Soporte para ambos nombres de campo
              LABEL: label.LABEL,
            };
          });

          // Guarda los items formateados en el modelo para usar en el ComboBox
          oValuesModel.setProperty("/ComboLabels", aComboItems);
        },

        /**
         * Carga un array de valores en el modelo principal
         * @param {Array} aValues - Array de objetos valor
         */
        loadValues: function (aValues) {
          this.getView()
            .getModel("values")
            .setProperty("/values", aValues || []);
        },

        /**
         * Extrae y almacena los IDs de labels de un array de labels
         * @param {Array} aLabels - Array de objetos label
         */
        loadlabels: function (aLabels) {
          // Mapea el array para extraer solo los LABELID
          var aLabelIds = aLabels.map(function (label) {
            return label.LABELID;
          });

          // Almacena los IDs en el modelo
          this.getView().getModel("values").setProperty("/labelIds", aLabelIds);
        },

        /**
         * Filtra los valores mostrados basándose en el labelID seleccionado
         * Solo muestra valores que pertenecen al label seleccionado
         */
        loadValuesId: function () {
          var oModel = this.getView().getModel("values");
          var labelIdEscogido = oModel.getProperty("/labelIdEscogido");

          // Filtra los valores para mostrar solo los del label seleccionado
          var aValues = oModel.getProperty("/values").filter(function (value) {
            return value.LABELID === labelIdEscogido;
          });

          this.getView().getModel("values").setProperty("/values", aValues);
        },

        // ========================================
        // MANEJO DE SELECCIÓN EN LA TABLA
        // ========================================

        /**
         * Maneja la selección de un item en la tabla de valores
         * Carga los datos del item seleccionado en el formulario de edición
         * @param {Event} oEvent - Evento de selección
         */
        onItemSelect: function (oEvent) {
          // Obtiene el item seleccionado de la tabla
          var oItem = oEvent.getParameter("listItem");
          var oSelectedData = oItem.getBindingContext("values").getObject();

          // Carga los datos del item seleccionado en el modelo del formulario
          this.getView().getModel("newValueModel").setProperty("/", {
            VALUEID: oSelectedData.VALUEID,
            VALUE: oSelectedData.VALUE,
            VALUEPAID: oSelectedData.VALUEPAID,
            ALIAS: oSelectedData.ALIAS,
            IMAGE: oSelectedData.IMAGE,
            DESCRIPTION: oSelectedData.DESCRIPTION,
          });

          // Habilita los botones de edición/eliminación
          this.getView()
            .getModel("values")
            .setProperty("/selectedValueIn", true);
        },

        // ========================================
        // FUNCIONALIDAD CREAR NUEVO VALOR
        // ========================================

        /**
         * Abre el diálogo para agregar un nuevo valor
         * Carga el fragmento XML del diálogo si no existe
         */
        onAddValues: function () {
          if (!this._oAddDialog) {
            // Carga el fragmento XML del diálogo de manera asíncrona
            Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.AddValueDialog",
              controller: this,
            }).then((oDialog) => {
              this._oAddDialog = oDialog;
              this.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            // Si el diálogo ya existe, simplemente lo abre
            this._oAddDialog.open();
          }
        },

        /**
         * Guarda un nuevo valor en la base de datos
         * Valida los datos y hace una petición POST al API
         */
        onSaveValues: function () {
          // Obtiene el texto del label seleccionado (elemento UI con ID específico)
          var oText = this.byId("_IDGenText8");
          var sText = oText ? oText.getText() : "";

          // Obtiene los datos del formulario
          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");

          // Construye el VALUEPAID combinando LABELIDC y VALUEIDC
          var sValuePaid =
            (oNewValueData.LABELIDC || "") +
            "-" +
            (oNewValueData.VALUEIDC || "");

          // Validación de campos requeridos
          if (!oNewValueData.VALUE || !sText) {
            MessageBox.error(
              "Por favor, complete todos los campos requeridos."
            );
            return;
          }

          // Prepara el objeto de datos para enviar al API
          var oData = {
            COMPANYID: "1", // ID de compañía fijo
            CEDIID: "1", // ID de centro fijo
            VALUEID: oNewValueData.VALUEID,
            VALUE: oNewValueData.VALUE,
            VALUEPAID: sValuePaid,
            SEQUENCE: "10", // Secuencia fija
            ALIAS: oNewValueData.ALIAS,
            IMAGE: oNewValueData.IMAGE,
            DESCRIPTION: oNewValueData.DESCRIPTION,
            LABELID: sText,
            ROUTE: "https://investments/pages/portfolio.html", // Ruta fija
          };

          // Petición HTTP POST para crear el nuevo valor
          fetch("http://localhost:3020/api/security/CreateValue", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ value: oData }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("Error al agregar el valor");
              return response.json();
            })
            .then((data) => {
              // ÉXITO: Actualiza el modelo local con el nuevo valor
              var oNewValueModel = this.getView().getModel("newValueModel");
              var oNewValueData = oNewValueModel.getProperty("/");

              var oValuesModel = this.getView().getModel("values");
              var aValues = oValuesModel.getProperty("/values") || [];

              // Agrega el nuevo valor al array local
              aValues.push({
                VALUEID: oNewValueData.VALUEID,
                VALUE: oNewValueData.VALUE,
                VALUEPAID: oNewValueData.VALUEPAID,
                ALIAS: oNewValueData.ALIAS,
                IMAGE: oNewValueData.IMAGE,
                DESCRIPTION: oNewValueData.DESCRIPTION,
                LABELID: oNewValueData.LABELID,
              });

              console.log("Nuevo valor agregado:", aValues);
              oValuesModel.setProperty("/values", aValues);

              // Limpia el formulario
              this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: "",
              });

              // Cierra el diálogo y muestra mensaje de éxito
              this._oAddDialog.close();
              MessageToast.show("Valor agregado exitosamente.");
            })
            .catch((error) => {
              // ERROR: Maneja errores y muestra mensaje al usuario
              console.error("Error al agregar el valor:", error);
              MessageBox.error("Error al agregar el valor: " + error.message);
            });
        },

        /**
         * Cancela la creación de un nuevo valor
         * Limpia el formulario y cierra el diálogo
         */
        onCancelValues: function () {
          // Cierra el diálogo
          this._oAddDialog.close();

          // Limpia el modelo del formulario
          this.getView().getModel("newValueModel").setProperty("/", {
            VALUEID: "",
            VALUE: "",
            VALUEPAID: "",
            ALIAS: "",
            IMAGE: "",
            DESCRIPTION: "",
          });

          // Deshabilita los botones de edición
          this.getView()
            .getModel("values")
            .setProperty("/selectedValueIn", false);
        },

        // ========================================
        // FUNCIONALIDAD EDITAR VALOR EXISTENTE
        // ========================================

        /**
         * Abre el diálogo para editar un valor existente
         * Similar a onAddValues pero para el diálogo de edición
         */
        onEditValues: function () {
          var that = this;
          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");
          var sLabelId = "";

          // Obtiene el LABELID de VALUEPAID si existe
          if (oNewValueData.VALUEPAID) {
            var aParts = oNewValueData.VALUEPAID.split("-");
            sLabelId = aParts[0] || "";
          }

          // Carga los valores filtrados por LABELID antes de abrir el diálogo
          if (sLabelId) {
            this.loadValuesByLabelId(sLabelId);
          }

          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.EditValueDialog",
              controller: this,
            }).then(function (oDialog) {
              that._oEditDialog = oDialog;
              that.getView().addDependent(oDialog);

              // Preselecciona los ComboBox según VALUEPAID
              var oNewValueData = that
                .getView()
                .getModel("newValueModel")
                .getProperty("/");
              if (oNewValueData.VALUEPAID) {
                var aParts = oNewValueData.VALUEPAID.split("-");
                that
                  .getView()
                  .getModel("newValueModel")
                  .setProperty("/ValuePaid1", aParts[0] || "");
                that
                  .getView()
                  .getModel("newValueModel")
                  .setProperty("/ValuePaid2", aParts[1] || "");
                that
                  .getView()
                  .getModel("newValueModel")
                  .setProperty("/VALUEIDC", aParts[1] || "");
              }
              // Asegura que LABELID esté sincronizado con ValuePaid1
              that
                .getView()
                .getModel("newValueModel")
                .setProperty(
                  "/LABELID",
                  oNewValueData.ValuePaid1 || aParts?.[0] || ""
                );
              oDialog.open();
            });
          } else {
            // Si el diálogo ya existe, solo preselecciona los ComboBox y abre el diálogo
            var oNewValueData = this.getView()
              .getModel("newValueModel")
              .getProperty("/");
            if (oNewValueData.VALUEPAID) {
              var aParts = oNewValueData.VALUEPAID.split("-");
              this.getView()
                .getModel("newValueModel")
                .setProperty("/ValuePaid1", aParts[0] || "");
              this.getView()
                .getModel("newValueModel")
                .setProperty("/ValuePaid2", aParts[1] || "");
              this.getView()
                .getModel("newValueModel")
                .setProperty("/VALUEIDC", aParts[1] || "");
              this.getView()
                .getModel("newValueModel")
                .setProperty(
                  "/LABELID",
                  oNewValueData.ValuePaid1 || aParts[0] || ""
                );
            }
            this._oEditDialog.open();
          }
        },

        /**
         * Actualiza un valor existente en la base de datos
         * Similar a onSaveValues pero hace PUT/POST para actualizar
         */
        onUpdateValues: function () {
          // Obtiene el texto del label (diferente ID que en crear)
          var oText = this.byId("_IDGenText9");
          var sText = oText ? oText.getText() : "";

          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");

          // --- SINCRONIZA LOS CAMPOS DEL MODELO ---
          // Si tienes ValuePaid1 y ValuePaid2, úsalos para LABELIDC y VALUEIDC
          if (oNewValueData.ValuePaid1) {
            oNewValueData.LABELIDC = oNewValueData.ValuePaid1;
          }
          if (oNewValueData.ValuePaid2) {
            oNewValueData.VALUEIDC = oNewValueData.ValuePaid2;
          }

          var sValuePaid =
            (oNewValueData.LABELIDC || "") +
            "-" +
            (oNewValueData.VALUEIDC || "");

          // Validación más estricta para edición (incluye VALUEID)
          if (!oNewValueData.VALUEID || !oNewValueData.VALUE || !sText) {
            MessageBox.error(
              "Por favor, complete todos los campos requeridos."
            );
            return;
          }

          // Prepara los datos para actualización
          var oData = {
            COMPANYID: "1",
            CEDIID: "1",
            VALUEID: oNewValueData.VALUEID,
            VALUE: oNewValueData.VALUE,
            VALUEPAID: sValuePaid,
            SEQUENCE: "10",
            ALIAS: oNewValueData.ALIAS,
            IMAGE: oNewValueData.IMAGE,
            DESCRIPTION: oNewValueData.DESCRIPTION,
            LABELID: sText,
            ROUTE: "https://investments/pages/portfolio.html",
          };

          // Petición HTTP POST para actualizar (nota: incluye VALUEID en la URL)
          fetch(
            "http://localhost:3020/api/security/updateValue?valueid=" +
              oNewValueData.VALUEID,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: oData }),
            }
          )
            .then((response) => {
              if (!response.ok) throw new Error("Error al actualizar el valor");
              return response.json();
            })
            .then((data) => {
              // ÉXITO: Actualiza el modelo local
              var oValuesModel = this.getView().getModel("values");
              var aValues = oValuesModel.getProperty("/values") || [];

              // Busca el índice del valor a actualizar
              var iIndex = aValues.findIndex(function (item) {
                return item.VALUEID === oNewValueData.VALUEID;
              });

              // Si lo encuentra, actualiza los datos localmente
              if (iIndex !== -1) {
                aValues[iIndex] = Object.assign({}, aValues[iIndex], oData);
                oValuesModel.setProperty("/values", aValues);
              }

              // Limpia el formulario y cierra el diálogo
              this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: "",
              });

              if (this._oEditDialog) {
                this._oEditDialog.close();
              }

              MessageToast.show("Valor actualizado exitosamente.");
            })
            .catch((error) => {
              console.error("Error al actualizar el valor:", error);
              MessageBox.error(
                "Error al actualizar el valor: " + error.message
              );
            });
        },

        /**
         * Cancela la edición de un valor
         * Similar a onCancelValues pero para el diálogo de edición
         */
        onEditCancelValues: function () {
          this._oEditDialog.close();

          this.getView().getModel("newValueModel").setProperty("/", {
            VALUEID: "",
            VALUE: "",
            VALUEPAID: "",
            ALIAS: "",
            IMAGE: "",
            DESCRIPTION: "",
          });

          this.getView()
            .getModel("values")
            .setProperty("/selectedValueIn", false);
        },

        // ========================================
        // FUNCIONALIDAD DE FILTRADO POR LABEL
        // ========================================

        /**
         * Maneja el cambio de selección en el ComboBox de Labels
         * Carga los valores correspondientes al label seleccionado
         * @param {Event} oEvent - Evento de cambio del ComboBox
         */
        onLabelIdChange: function (oEvent) {
          // Obtiene el key seleccionado del ComboBox
          var sLabelIdc = oEvent.getSource().getSelectedKey();

          // Encuentra el objeto completo del label seleccionado
          var aLabels =
            this.getView().getModel("values").getProperty("/ComboLabels") || [];

          var oSelectedLabel = aLabels.find(function (label) {
            return label.LABELIDC === sLabelIdc;
          });

          // Guarda el LABELIDC en el modelo del formulario
          this.getView()
            .getModel("newValueModel")
            .setProperty("/LABELIDC", sLabelIdc);

          // Carga los valores filtrados por este LABELID
          this.loadValuesByLabelId(sLabelIdc);
        },

        /**
         * Carga valores desde el API filtrados por LABELID
         * @param {String} sLabelId - ID del label para filtrar
         */
        loadValuesByLabelId: function (sLabelId) {
          var oModel = this.getView().getModel("values");

          // Petición GET al API para obtener valores por LABELID
          fetch(
            `http://localhost:3020/api/security/catalogs?labelid=${sLabelId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          )
            .then((response) => {
              if (!response.ok) throw new Error("Error al obtener valores");
              return response.json();
            })
            .then((data) => {
              // Procesa la respuesta y mapea los valores
              var aValues = (data.value[0].VALUES || []).map(function (item) {
                return {
                  VALUEIDC: item.VALUEID, // Cambia el nombre del campo
                  VALUE: item.VALUE,
                  // Se pueden agregar más propiedades según necesidad
                };
              });

              // Guarda los valores filtrados en una propiedad separada
              oModel.setProperty("/filteredValues", aValues);
            })
            .catch((error) => {
              console.log(error.message);
              MessageToast.show("Error: " + error.message);
            });
        },

        // ========================================
        // FUNCIONALIDAD DE ELIMINACIÓN
        // ========================================

        /**
         * Elimina físicamente un valor de la base de datos
         * Muestra confirmación antes de proceder
         */
        deleteValueById: function () {
          var that = this;

          // Obtiene el VALUEID del valor seleccionado
          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");
          var sValueId = oNewValueData.VALUEID;

          // Validación: debe haber un valor seleccionado
          if (!sValueId) {
            MessageBox.error("No hay valor seleccionado para eliminar.");
            return;
          }

          // Muestra diálogo de confirmación
          MessageBox.confirm("¿Seguro que deseas eliminar este valor?", {
            onClose: function (oAction) {
              if (oAction === MessageBox.Action.OK) {
                // Petición POST para eliminación física
                fetch(
                  `http://localhost:3020/api/security/physicalDeleteValue?valueid=${oNewValueData.VALUEID}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  }
                )
                  .then((response) => {
                    if (!response.ok)
                      throw new Error("Error al eliminar el valor");
                    return response.json();
                  })
                  .then((data) => {
                    // ÉXITO: Elimina el valor del modelo local
                    var oValuesModel = that.getView().getModel("values");
                    var aValues = oValuesModel.getProperty("/values") || [];

                    // Filtra el array para remover el valor eliminado
                    var aFiltered = aValues.filter(function (item) {
                      return item.VALUEID !== sValueId;
                    });

                    oValuesModel.setProperty("/values", aFiltered);
                    MessageToast.show("Valor eliminado exitosamente.");
                  })
                  .catch((error) => {
                    console.error("Error al eliminar el valor:", error);
                    MessageBox.error(
                      "Error al eliminar el valor: " + error.message
                    );
                  });
              }
            },
          });
        },

        /**
         * Desactiva lógicamente un valor (soft delete)
         * El valor permanece en la BD pero se marca como inactivo
         */
        deactivateValueById: function () {
          var that = this;
          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");
          var sValueId = oNewValueData.VALUEID;

          if (!sValueId) {
            MessageBox.error("No hay valor seleccionado para desactivar.");
            return;
          }

          MessageBox.confirm("¿Seguro que deseas desactivar este valor?", {
            onClose: function (oAction) {
              if (oAction === MessageBox.Action.OK) {
                // Petición POST para desactivación lógica
                fetch(
                  `http://localhost:3020/api/security/logicalDeleteValue?valueid=${encodeURIComponent(
                    sValueId
                  )}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  }
                )
                  .then((response) => {
                    if (!response.ok)
                      throw new Error("Error al desactivar el valor");
                    return response.json();
                  })
                  .then((data) => {
                    // ÉXITO: Actualiza el estado local a inactivo
                    var oValuesModel = that.getView().getModel("values");
                    var aValues = oValuesModel.getProperty("/values") || [];

                    var iIndex = aValues.findIndex(function (item) {
                      return item.VALUEID === sValueId;
                    });

                    if (iIndex !== -1) {
                      // Actualiza la propiedad ACTIVED a false
                      aValues[iIndex].DETAIL_ROW =
                        aValues[iIndex].DETAIL_ROW || {};
                      aValues[iIndex].DETAIL_ROW.ACTIVED = false;
                      oValuesModel.setProperty("/values", aValues);
                      oValuesModel.refresh(true);
                    }

                    MessageToast.show("Valor desactivado exitosamente.");
                  })
                  .catch((error) => {
                    console.error("Error al desactivar el valor:", error);
                    MessageBox.error(
                      "Error al desactivar el valor: " + error.message
                    );
                  });
              }
            },
          });
        },

        /**
         * Activa lógicamente un valor previamente desactivado
         * Opuesto a deactivateValueById
         */
        activateValueById: function () {
          var that = this;
          var oNewValueData = this.getView()
            .getModel("newValueModel")
            .getProperty("/");
          var sValueId = oNewValueData.VALUEID;

          if (!sValueId) {
            MessageBox.error("No hay valor seleccionado para activar.");
            return;
          }

          MessageBox.confirm("¿Seguro que deseas activar este valor?", {
            onClose: function (oAction) {
              if (oAction === MessageBox.Action.OK) {
                // Petición POST para activación lógica
                fetch(
                  `http://localhost:3020/api/security/logicalActivateValue?valueid=${encodeURIComponent(
                    sValueId
                  )}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  }
                )
                  .then((response) => {
                    if (!response.ok)
                      throw new Error("Error al activar el valor");
                    return response.json();
                  })
                  .then((data) => {
                    // ÉXITO: Actualiza el estado local a activo
                    var oValuesModel = that.getView().getModel("values");
                    var aValues = oValuesModel.getProperty("/values") || [];

                    var iIndex = aValues.findIndex(function (item) {
                      return item.VALUEID === sValueId;
                    });

                    if (iIndex !== -1) {
                      // Actualiza la propiedad ACTIVED a true
                      aValues[iIndex].DETAIL_ROW =
                        aValues[iIndex].DETAIL_ROW || {};
                      aValues[iIndex].DETAIL_ROW.ACTIVED = true;
                      oValuesModel.setProperty("/values", aValues);
                      oValuesModel.refresh(true);
                    }

                    MessageToast.show("Valor activado exitosamente.");
                  })
                  .catch((error) => {
                    console.error("Error al activar el valor:", error);
                    MessageBox.error(
                      "Error al activar el valor: " + error.message
                    );
                  });
              }
            },
          });
        },

        // ========================================
        // FUNCIONALIDAD DE BÚSQUEDA/FILTRADO
        // ========================================

        /**
         * Implementa funcionalidad de búsqueda en tiempo real
         * Filtra la tabla basándose en el texto ingresado
         * @param {Event} oEvent - Evento de cambio en el campo de búsqueda
         */
        onFilterChange: function (oEvent) {
          // Obtiene el texto de búsqueda (soporta diferentes tipos de eventos)
          var sQuery =
            oEvent.getParameter("query") || oEvent.getParameter("newValue");

          // Obtiene referencia a la tabla
          var oTable = this.byId("valuesTable");
          var oBinding = oTable.getBinding("items");

          // Verificación de seguridad
          if (!oBinding) {
            return;
          }

          // Si no hay texto de búsqueda, limpia todos los filtros
          if (!sQuery) {
            oBinding.filter([]);
            return;
          }

          // Define los campos en los que se puede buscar
          var aFields = [
            "VALUEID",
            "VALUE",
            "VALUEPAID",
            "ALIAS",
            "IMAGE",
            "DESCRIPTION",
            "LABELID",
          ];

          // Crea un filtro para cada campo usando el operador "Contains"
          var aFilters = aFields.map(function (sField) {
            return new sap.ui.model.Filter(
              sField,
              sap.ui.model.FilterOperator.Contains,
              sQuery
            );
          });

          // Combina todos los filtros con operador OR
          // (busca en cualquiera de los campos)
          var oMultiFilter = new sap.ui.model.Filter(aFilters, false);
          oBinding.filter([oMultiFilter]);
        },
      }
    );
  }
);
