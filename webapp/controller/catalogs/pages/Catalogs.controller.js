// Definición del módulo SAP UI5 con todas las dependencias necesarias
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller", // Controlador base de SAP UI5
    "sap/ui/model/json/JSONModel", // Modelo JSON para manejo de datos
    "sap/m/MessageBox", // Cajas de mensaje para alertas y confirmaciones
    "sap/ui/core/Fragment", // Para cargar fragmentos XML (diálogos)
    "sap/m/MessageToast", // Mensajes toast (notificaciones temporales)
    "jquery", // Librería jQuery para manipulación DOM
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    // Extensión del controlador base para crear el controlador de catálogos
    return Controller.extend(
      "com.inv.sapfiroriwebinversion.controller.catalogs.pages.Catalogs",
      {
        /**
         * FUNCIÓN DE INICIALIZACIÓN
         * Se ejecuta automáticamente cuando se carga la vista
         * Es el punto de entrada principal del controlador
         */
        onInit: function () {
          // Cargar los catálogos al inicializar la aplicación
          this.loadCatalogs();
        },

        /**
         * FUNCIÓN PARA CARGAR CATÁLOGOS
         * Realiza una petición HTTP GET al servidor para obtener todos los catálogos
         * y los coloca en el modelo de datos de la tabla
         */
        loadCatalogs: function () {
          // Crear un nuevo modelo JSON vacío para almacenar los datos
          var oModel = new JSONModel();
          var that = this; // Guardar referencia del contexto para usar en callbacks

          // Realizar petición HTTP GET al endpoint de catálogos
          fetch("http://localhost:3020/api/security/allCatalogs", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              // Verificar si la respuesta fue exitosa
              if (!response.ok) throw new Error("Error al obtener catálogos");
              return response.json(); // Convertir respuesta a JSON
            })
            .then((data) => {
              // Establecer los datos obtenidos en el modelo de la tabla principal
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);

              // Preparar datos para la vista lateral (panel de valores)
              // Extraer solo LABELID y LABEL de cada catálogo
              var aLabelIds = (data.value || []).map(function (item) {
                return { LABELIDC: item.LABELID, LABEL: item.LABEL };
              });

              // Buscar la vista lateral (XMLViewValues) y cargar los labels
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                // Esperar a que la vista se cargue completamente
                oValuesView.loaded().then(function () {
                  var oValuesModel = oValuesView.getModel("values");
                  if (oValuesModel) {
                    // Establecer todos los labels disponibles en el modelo
                    oValuesModel.setProperty("/AllLabels", aLabelIds);
                  }
                });
              }
            })
            .catch((error) => {
              // Manejo de errores: mostrar en consola y al usuario
              console.log(error.message);
              MessageToast.show("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA MANEJAR CLIC EN TABLA DE CATÁLOGOS
         * Se ejecuta cuando el usuario hace clic en un elemento de la tabla
         * Abre el panel lateral con los valores del catálogo seleccionado
         */
        onItemPress: function (oEvent) {
          // Obtener el elemento seleccionado de la tabla
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Datos completos del ítem

          var sLabelID = oSelectedData.LABELID; // ID del catálogo seleccionado

          // Petición HTTP para obtener los valores específicos del catálogo
          fetch(
            "http://localhost:3020/api/security/catalogs?labelid=" +
              encodeURIComponent(sLabelID),
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
              // Transformar datos: cambiar LABELID a LABELIDM en los valores
              // (Posiblemente para evitar conflictos de nombres en la vista)
              if (
                data.value &&
                data.value[0] &&
                Array.isArray(data.value[0].VALUES)
              ) {
                data.value[0].VALUES = data.value[0].VALUES.map(function (
                  item
                ) {
                  item.LABELIDM = item.LABELID; // Crear nueva propiedad
                  delete item.LABELID; // Eliminar la original
                  return item;
                });
              }

              // Cargar los valores en la vista lateral
              var oValuesView = this.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();

                  if (oController && oController.loadValues) {
                    // Llamar función loadValues del controlador de la vista lateral
                    oController.loadValues(data.value[0].VALUES);

                    // Actualizar el modelo con el catálogo seleccionado
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });

          // CONFIGURACIÓN DEL LAYOUT: Expandir panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // Panel derecho ocupa 50% del ancho
          }

          // Reducir panel izquierdo al 50%
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        /**
         * FUNCIÓN PARA MANEJAR CAMBIOS DE SELECCIÓN EN LA TABLA
         * Habilita/deshabilita botones según el estado del catálogo seleccionado
         */
        onSelectionChange: function (oEvent) {
          var oTable = this.byId("catalogTable");
          var oSelectedItem = oTable.getSelectedItem();

          // Si no hay selección, deshabilitar todas las acciones
          if (!oSelectedItem) {
            this._disableAllActions();
            return;
          }

          // Habilitar botones básicos de edición y eliminación
          this.byId("editButton").setEnabled(true);
          this.byId("deleteButton").setEnabled(true);

          // Obtener datos del elemento seleccionado
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Configurar visibilidad de botones según el estado ACTIVO/INACTIVO
          this.byId("activateButton").setVisible(!oData.DETAIL_ROW.ACTIVED);
          this.byId("activateButton").setEnabled(!oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setVisible(oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setEnabled(oData.DETAIL_ROW.ACTIVED);

          // Guardar referencia del elemento seleccionado para otras funciones
          this._oSelectedItem = oSelectedItem;
        },

        /**
         * FUNCIÓN AUXILIAR PARA DESHABILITAR TODAS LAS ACCIONES
         * Se usa cuando no hay ningún elemento seleccionado
         */
        _disableAllActions: function () {
          this.byId("editButton").setEnabled(false);
          this.byId("activateButton").setEnabled(false);
          this.byId("deactivateButton").setEnabled(false);
          this.byId("deleteButton").setEnabled(false);
        },

        /**
         * FUNCIONES DE CONTROL DEL PANEL LATERAL
         * Permiten cerrar, centrar o expandir completamente el panel de detalles
         */
        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px"); // Ocultar panel derecho
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%"); // Panel izquierdo ocupa todo
          }
        },

        onCenterDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // 50% para cada panel
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        onExpandDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%"); // Panel derecho ocupa todo
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0px"); // Ocultar panel izquierdo
          }
        },

        /**
         * FUNCIÓN PARA ABRIR DIÁLOGO DE AGREGAR CATÁLOGO
         * Crea y configura el modelo de datos para un nuevo catálogo
         */
        onAddCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("addCatalogDialog");

          // Crear modelo para el formulario de nuevo catálogo si no existe
          if (!oView.getModel("addCatalogModel")) {
            var oAddCatalogModel = new sap.ui.model.json.JSONModel({
              LABELID: "",
              LABEL: "",
              INDEX: "",
              COLLECTION: "",
              SECTION: "",
              SEQUENCE: "",
              IMAGE: "",
              DESCRIPTION: "",
              DETAIL_ROW: { ACTIVED: true }, // Por defecto, nuevo catálogo activo
            });
            oView.setModel(oAddCatalogModel, "addCatalogModel");
          }

          // Cargar y abrir el diálogo si no existe
          if (!oDialog) {
            oDialog = Fragment.load({
              id: oView.getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.addCatalogDialog",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            oDialog.open();
          }
        },

        /**
         * FUNCIÓN PARA CANCELAR AGREGAR CATÁLOGO
         * Cierra el diálogo y limpia los campos del formulario
         */
        onCancelAddCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("addCatalogDialog");
          if (oDialog) {
            // Limpiar todos los campos del modelo
            oView.getModel("addCatalogModel").setData({
              LABELID: "",
              LABEL: "",
              INDEX: "",
              COLLECTION: "",
              SECTION: "",
              SEQUENCE: "",
              IMAGE: "",
              DESCRIPTION: "",
              DETAIL_ROW: { ACTIVED: true },
            });
            oDialog.close();
          } else {
            MessageBox.error("No se encontró el diálogo de agregar catálogo.");
          }
        },

        /**
         * FUNCIÓN PARA GUARDAR NUEVO CATÁLOGO
         * Valida los datos, verifica que no exista el LABELID y envía al servidor
         */
        onSaveCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("addCatalogDialog");
          var oCatalogData = oView.getModel("addCatalogModel").getData();

          // Validación básica de campos requeridos
          if (!oCatalogData.LABELID || !oCatalogData.DESCRIPTION) {
            MessageBox.error("Por favor, complete todos los campos.");
            return;
          }

          // Preparar payload para enviar al servidor
          var oPayload = {
            CEDIID: "1", // ID de centro de distribución (hardcoded)
            COMPANYID: "0", // ID de compañía (hardcoded)
            LABELID: oCatalogData.LABELID,
            LABEL: oCatalogData.LABEL,
            INDEX: oCatalogData.INDEX,
            COLLECTION: oCatalogData.COLLECTION,
            SECTION: oCatalogData.SECTION,
            SEQUENCE: oCatalogData.SEQUENCE,
            IMAGE: oCatalogData.IMAGE,
            DESCRIPTION: oCatalogData.DESCRIPTION,
          };

          // Verificar que el LABELID no exista ya en la tabla
          var oModel = oView.getModel();
          var aData = oModel.getData().value || [];
          var bExists = aData.some(function (item) {
            return item.LABELID === oPayload.LABELID;
          });
          if (bExists) {
            MessageBox.error("El LABELID ya existe. Por favor, elija otro.");
            return;
          }

          // Enviar petición POST para crear el catálogo
          fetch("http://localhost:3020/api/security/CreateCatalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ catalogs: oPayload }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("Error al agregar catálogo");
              return response.json();
            })
            .then((data) => {
              MessageToast.show("Catálogo agregado exitosamente.");

              // Limpiar formulario después de agregar
              oView.getModel("addCatalogModel").setData({
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "",
            SEQUENCE: "",
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: { ACTIVED: true },
              });

              oDialog.close();

              // Refrescar la tabla de catálogos automáticamente
              this.loadCatalogs();
            })
            .catch((error) => {
              MessageBox.error("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA DESACTIVAR CATÁLOGO
         * Cambia el estado del catálogo seleccionado a inactivo
         */
        onDeactivatePressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error(
              "Por favor, seleccione un catálogo para desactivar."
            );
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;

          // Verificar si ya está desactivado
          if (!oData.DETAIL_ROW.ACTIVED) {
            MessageBox.error("El catálogo ya está desactivado.");
            return;
          }

          // Enviar petición para desactivar
          fetch(
            "http://localhost:3020/api/security/deletecatalogs?labelid=" +
              labelid,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(),
            }
          )
            .then((response) => {
              if (!response.ok) throw new Error("Error al desactivar catálogo");
              return response.json();
            })
            .then((data) => {
              MessageToast.show("Catálogo desactivado exitosamente.");

              // Actualizar estado local en el modelo
              var oModel = this.getView().getModel();
              var aData = oModel.getProperty("/value") || [];
              var idx = aData.findIndex((item) => item.LABELID === labelid);
              if (idx !== -1) {
                aData[idx].DETAIL_ROW.ACTIVED = false;
                oModel.setProperty("/value", aData);
                oModel.refresh(true);
              }
            })
            .catch((error) => {
              MessageBox.error("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA ACTIVAR CATÁLOGO
         * Cambia el estado del catálogo seleccionado a activo
         */
        onActivatePressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para activar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;

          // Verificar si ya está activado
          if (oData.DETAIL_ROW.ACTIVED) {
            MessageBox.error("El catálogo ya está activado.");
            return;
          }

          // Enviar petición para activar
          fetch(
            "http://localhost:3020/api/security/activatecatalogs?labelid=" +
              labelid,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(),
            }
          )
            .then((response) => {
              if (!response.ok) throw new Error("Error al activar catálogo");
              return response.json();
            })
            .then((data) => {
              MessageToast.show("Catálogo activado exitosamente.");

              // Actualizar estado local en el modelo
              var oModel = this.getView().getModel();
              var aData = oModel.getProperty("/value") || [];
              var idx = aData.findIndex((item) => item.LABELID === labelid);
              if (idx !== -1) {
                aData[idx].DETAIL_ROW.ACTIVED = true;
                oModel.setProperty("/value", aData);
                oModel.refresh(true);
              }
            })
            .catch((error) => {
              MessageBox.error("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA ELIMINAR CATÁLOGO
         * Solicita confirmación y elimina permanentemente el catálogo
         */
        onDeletePressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error(
              "Por favor, seleccione un catálogo para eliminar."
            );
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;
          var that = this;

          // Obtener los valores asociados al catálogo antes de mostrar el MessageBox
          fetch(
            "http://localhost:3020/api/security/catalogs?labelid=" +
              encodeURIComponent(labelid),
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          )
            .then(function (response) {
              if (!response.ok)
                throw new Error("Error al obtener valores asociados");
              return response.json();
            })
            .then(function (data) {
              var valuesTable = "";
              if (
                data.value &&
                data.value[0] &&
                Array.isArray(data.value[0].VALUES) &&
                data.value[0].VALUES.length > 0
              ) {
                // Solo mostrar los campos VALUE y DESCRIPTION
                var fieldsToShow = ["VALUE", "DESCRIPTION"];

                // Construir cabecera de la tabla con color personalizado
                valuesTable +=
                  "<table border='1' style='border-collapse:collapse;width:100%;font-size:12px;'>";
                valuesTable += "<tr style='background:#1976d2;color:#fff;'>";
                fieldsToShow.forEach(function (field) {
                  valuesTable +=
                    "<th style='padding:2px 4px;'>" + field + "</th>";
                });
                valuesTable += "</tr>";

                // Construir filas de la tabla
                data.value[0].VALUES.forEach(function (val) {
                  valuesTable += "<tr>";
                  fieldsToShow.forEach(function (field) {
                    valuesTable +=
                      "<td style='padding:2px 4px;'>" +
                      (val[field] !== undefined ? String(val[field]) : "") +
                      "</td>";
                  });
                  valuesTable += "</tr>";
                });
                valuesTable += "</table>";
              } else {
                valuesTable = "(Sin valores asociados)";
              }

              var sMessage =
                "¿Está seguro de que desea eliminar el catálogo " +
                labelid +
                "?<br><br>También se eliminarán los siguientes valores asociados:<br>" +
                valuesTable +
                "<br>Esta acción no podrá deshacerse una vez confirmada";

              MessageBox.confirm(sMessage, {
                title: "Confirmar eliminación",
                icon: MessageBox.Icon.WARNING,
                onClose: function (sAction) {
                  if (sAction === "OK") {
                    // Encapsular el flujo de borrado en una función async
                    (async function () {
                      try {
                        // Obtener todos los VALUEID asociados al catálogo
                        const response = await fetch(
                          "http://localhost:3020/api/security/catalogs?labelid=" +
                            encodeURIComponent(labelid),
                          {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                          }
                        );
                        if (!response.ok)
                          throw new Error("Error al obtener valores asociados");
                        const data = await response.json();
                        var values =
                          data.value &&
                          data.value[0] &&
                          Array.isArray(data.value[0].VALUES)
                            ? data.value[0].VALUES
                            : [];
                        // Ejecutar borrado físico para cada VALUEID
                        await Promise.all(
                          values.map(function (val) {
                            return fetch(
                              `http://localhost:3020/api/security/physicalDeleteValue?valueid=${val.VALUEID}`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                              }
                            ).then(function (resp) {
                              if (!resp.ok)
                                throw new Error(
                                  "Error al eliminar value " + val.VALUEID
                                );
                              return resp.json();
                            });
                          })
                        );
                        // Luego eliminar el catálogo
                        const removeResponse = await fetch(
                          "http://localhost:3020/api/security/removecatalog?labelid=" +
                            labelid,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          }
                        );
                        if (!removeResponse.ok)
                          throw new Error("Error al eliminar catálogo");
                        await removeResponse.json();

                        MessageToast.show(
                          "Catálogo y valores eliminados exitosamente."
                        );

                        // Remover del modelo local
                        var oModel = that.getView().getModel();
                        var aData = oModel.getProperty("/value") || [];
                        aData = aData.filter(function (item) {
                          return item.LABELID !== labelid;
                        });
                        oModel.setProperty("/value", aData);
                        oModel.refresh(true);
                      } catch (error) {
                        MessageBox.error("Error: " + error.message);
                      }
                    })();
                  }
                },
                details: "",
                emphasizedAction: MessageBox.Action.OK,
              });

              // Forzar que el MessageBox muestre HTML (hack, ya que MessageBox no soporta HTML nativamente)
              setTimeout(function () {
                var oPopup = $(".sapMDialogScrollCont:visible").last();
                if (oPopup.length) {
                  oPopup.html(sMessage);
                }
              }, 100);
            })
            .catch(function (error) {
              MessageBox.error("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA ABRIR DIÁLOGO DE EDICIÓN
         * Carga los datos del catálogo seleccionado en un formulario de edición
         */
        onEditPressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para editar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          this.glabelid = oData.LABELID; // Guardar LABELID original

          // Crear modelo temporal para edición
          var oEditModel = new JSONModel(oData);
          this.getView().setModel(oEditModel, "editModel");

          // Cargar y abrir diálogo de edición
          var oDialog = this.byId("editDialog");
          if (!oDialog) {
            oDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.editCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);

                // Cargar datos del catálogo en el formulario
                var oCatalogData = this.getView()
                  .getModel("editModel")
                  .getData();
                oCatalogData.LABELID = oData.LABELID;
                oCatalogData.LABEL = oData.LABEL;
                oCatalogData.INDEX = oData.INDEX;
                oCatalogData.COLLECTION = oData.COLLECTION;
                oCatalogData.SECTION = oData.SECTION;
                oCatalogData.SEQUENCE = oData.SEQUENCE;
                oCatalogData.IMAGE = oData.IMAGE;
                oCatalogData.DESCRIPTION = oData.DESCRIPTION;
                oCatalogData.DETAIL_ROW = { ACTIVED: oData.DETAIL_ROW.ACTIVED };

                oEditModel.setData(oCatalogData);
                oDialog.setModel(oEditModel, "editCatalogModel");
                oDialog.open();
              }.bind(this)
            );
          } else {
            oDialog.open();
          }
        },

        /**
         * FUNCIÓN PARA GUARDAR CAMBIOS EN EDICIÓN
         * Valida y envía los datos modificados al servidor
         */
        onSaveEditCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("editDialog");
          var oEditData = oView.getModel("editModel").getData();

          // Validación de campos requeridos
          if (!oEditData.LABELID || !oEditData.DESCRIPTION) {
            MessageBox.error("Por favor, complete todos los campos.");
            return;
          }

          // Preparar payload para actualización
          var oPayload = {
            CEDIID: "1",
            COMPANYID: "0",
            LABELID: oEditData.LABELID,
            LABEL: oEditData.LABEL,
            INDEX: oEditData.INDEX,
            COLLECTION: oEditData.COLLECTION,
            SECTION: oEditData.SECTION,
            SEQUENCE: oEditData.SEQUENCE,
            IMAGE: oEditData.IMAGE,
            DESCRIPTION: oEditData.DESCRIPTION,
          };

          // Enviar petición de actualización
          fetch(
            "http://localhost:3020/api/security/updatecatalogs?labelid=" +
              this.glabelid,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ catalogs: oPayload }),
            }
          )
            .then((response) => {
              if (!response.ok) throw new Error("Error al actualizar catálogo");
              return response.json();
            })
            .then((data) => {
              MessageToast.show("Catálogo actualizado exitosamente.");

              // Actualizar modelo local
              var oModel = oView.getModel();
              var aData = oModel.getProperty("/value") || [];
              var idx = aData.findIndex(
                (item) => item.LABELID === oPayload.LABELID
              );
              if (idx !== -1) {
                aData[idx] = oPayload;
                oModel.setProperty("/value", aData);
                oModel.refresh(true);
              }
              oDialog.close();
            })
            .catch((error) => {
              MessageBox.error("Error: " + error.message);
            });
        },

        /**
         * FUNCIÓN PARA CANCELAR EDICIÓN
         * Cierra el diálogo de edición sin guardar cambios
         */
        onCancelEditCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("editDialog");
          if (oDialog) {
            oDialog.close();
          } else {
            MessageBox.error("No se encontró el diálogo de editar catálogo.");
          }
        },

        /**
         * FUNCIÓN DE FILTRADO POR CAMPO DE BÚSQUEDA
         * Filtra la tabla en tiempo real mientras el usuario escribe
         */
        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getParameter("value") || "";
          var oTable = this.byId("catalogTable");
          var oBinding = oTable.getBinding("items");

          if (!oBinding) return;

          var aFilters = [];
          if (sQuery) {
            // Crear filtros para buscar en múltiples campos
            aFilters.push(
              new sap.ui.model.Filter({
                filters: [
                  new sap.ui.model.Filter(
                    "LABELID",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                  ),
                  new sap.ui.model.Filter(
                    "LABEL",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                  ),
                  new sap.ui.model.Filter(
                    "DESCRIPTION",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                  ),
                ],
                and: false, // OR lógico entre los campos
              })
            );
          }
          oBinding.filter(aFilters);
        },

        /**
         * FUNCIÓN DE BÚSQUEDA ALTERNATIVA
         * Implementación manual de búsqueda que filtra por cualquier campo
         * Nota: Esta función parece duplicar funcionalidad con onFilterChange
         */
        onSearchUser: function () {
          var oTable = this.byId("catalogTable");
          var oModel = oTable.getModel();
          var acatalgos = oModel.getProperty("/value") || [];
          var oSearchField = this.byId("searchField");
          var sQuery = oSearchField
            ? oSearchField.getValue().toLowerCase()
            : "";

          if (!sQuery) {
            // Sin búsqueda, mostrar todos los catálogos
            oModel.setProperty("/filtered", acatalgos);
            oTable.bindRows("/filtered");
            return;
          }

          // Filtrar catálogos por cualquier campo string
          var aFiltered = acatalgos.filter(function (user) {
            return Object.values(user).some(function (value) {
              if (typeof value === "object" && value !== null) {
                // Buscar también en objetos anidados
                return Object.values(value).some(function (subValue) {
                  return String(subValue).toLowerCase().includes(sQuery);
                });
              }
              return String(value).toLowerCase().includes(sQuery);
            });
          });

          // Actualizar tabla con resultados filtrados
          oModel.setProperty("/filtered", aFiltered);
          var oBindingInfo = oTable.getBindingInfo("items");
          oTable.bindItems({
            path: "/filtered",
            template: oBindingInfo.template,
            templateShareable: true,
          });
        },
      }
    );
  }
);
