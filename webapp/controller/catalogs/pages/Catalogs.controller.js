sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery"
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    const API_BASE_URL = "http://localhost:3020";

    return Controller.extend(
      "com.inv.sapfiroriwebinversion.controller.catalogs.pages.Catalogs",
      {
        /*
        Al iniciar se ejecuta la sikgueinte funcion que coloca los datos de catalogos
*/
        onInit: function () {
          // Carga los catalogos
          this.loadCatalogs();
        },
        /*

        

      Funcion para cargar los catalogo en la tabla 
      */
        loadCatalogs: function () {
          //Creacion de un modelo de Json dond se guardaran los datos
          var oModel = new JSONModel();
          var that = this;

          //Realizacion del FETCH con un GET para traer los catalogos
          fetch(`${API_BASE_URL}/api/security/allCatalogs`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          })
            .then((response) => {
              //En caso de erros
              if (!response.ok) {
                throw new Error("Error al obtener catálogos");
              }
              return response.json();
            })
            .then((data) => {
              //Colocar la data obtenida en el modelo de la tabla
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });
        },

        /*
        Funcion al presionar la tabla de ctalogos despliegue la vista lateral para obeseravar los valres que este tiene

        */
        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;

          // Fetch para obtener los valores del catálogo seleccionado
          fetch(
            `${API_BASE_URL}/api/security/catalogs?labelid=` +
              encodeURIComponent(sLabelID),
            {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error("Error al obtener valores");
              }
              return response.json();
            })
            .then((data) => {
              //Inicializar la ventan lateral
              var oValuesView = this.byId("XMLViewValues");
              //Verificaion de que se encuentra
              if (oValuesView) {
                //Mandar a llmar la funcion de a values
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();

                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues(data.value[0].VALUES);

                    // Actualiza el selectedValue en el modelo values
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

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        // ---------------------------------------------------- PARA BOTONES DE ACCIONES LOGICAS
        onSelectionChange: function (oEvent) {
          // Obtener el item seleccionado
          var oTable = this.byId("catalogTable");
          var oSelectedItem = oTable.getSelectedItem();

          if (!oSelectedItem) {
            this._disableAllActions();
            return;
          }

          // Habilitar todos los botones de acción
          this.byId("editButton").setEnabled(true);
          this.byId("deleteButton").setEnabled(true);

          // Determinar estado para activar/desactivar
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Actualizar visibilidad de botones según estado
          this.byId("activateButton").setVisible(!oData.DETAIL_ROW.ACTIVED);
          this.byId("activateButton").setEnabled(!oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setVisible(oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setEnabled(oData.DETAIL_ROW.ACTIVED);

          // Guardar referencia al item seleccionado
          this._oSelectedItem = oSelectedItem;
        },

        _disableAllActions: function () {
          this.byId("editButton").setEnabled(false);
          this.byId("activateButton").setEnabled(false);
          this.byId("deactivateButton").setEnabled(false);
          this.byId("deleteButton").setEnabled(false);
        },
        // ---------------------------------------------------- FIN PARA BOTONES DE ACCIONES LOGICAS

        // ------------------------------------------------ BOTONES DE ACCIÓN
        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },

        onCenterDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%");
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
            oLayoutData.setSize("100%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0px");
          }
        },

        // ------------------------------------------------ FIN BOTONES DE ACCIÓN

        // ---------------------------------------------------- PARA AGREGAR UN NUEVO LABEL
        onAddCatalog: function () {
          // Definicion del Modelo
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "seguridad",
            SEQUENCE: 10,
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC"
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC"
                }
              ]
            }
          });

          this.getView().setModel(oModel, "addCatalogModel");

          // En caso de no existir se envia un Dialogo al usuario
          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.AddCatalogDialog",
              controller: this
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: function () {
          // Obtener los datos del modelo vinculado al fragmento
          var oData = this.getView().getModel("addCatalogModel").getData();

          // Construir el objeto a enviar (puedes ajustar según tu backend)
          var catalogData = {
            CEDIID: oData.CEDIID,
            COMPANYID: oData.COMPANYID,
            LABELID: oData.LABELID,
            LABEL: oData.LABEL,
            INDEX: oData.INDEX,
            COLLECTION: oData.COLLECTION,
            SECTION: oData.SECTION,
            SEQUENCE: oData.SEQUENCE,
            IMAGE: oData.IMAGE,
            DESCRIPTION: oData.DESCRIPTION,
          };

          console.log(catalogData);
          // Realizar el fetch para insertar el catálogo
          fetch("http://localhost:3020/api/security/createcatalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ catalogs: catalogData })
          })
            .then((response) => {
              if (!response.ok) throw new Error("Error al crear catálogo");
              return response.json();
            })
            .then((data) => {
              sap.m.MessageToast.show("¡Catálogo creado con éxito!");
              this._oAddDialog.close();
              // Opcional: refrescar la tabla de catálogos
              this.loadCatalogs();
            })
            .catch((error) => {
              sap.m.MessageToast.show("Error: " + error.message);
            });
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        /* onSaveCatalog: function() {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          //Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Validación básica
          if (!oData.LABELID || !oData.LABEL || !oData.DESCRIPTION) {
            MessageToast.show(
              "LABELID, LABEL Y DESCRIPTION son campos requeridos"
            );
            return;
          }

          // Verificar si el LABELID ya existe
          var bLabelIdExists = aData.some(function (item) {
            return item.LABELID === oData.LABELID;
          });

          if (bLabelIdExists) {
            MessageToast.show(
              "El LABELID ya existe, por favor ingrese uno diferente"
            );
            return;
          }

          // Preparar datos para enviar
          var payload = {
            values: oData
          };

          fetch(`${API_BASE_URL}/api/security/createcatalog`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          })
          .then((response) =>{
            if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(text);
                });
              }
              return response.json();
          })
          .then((response) => {
              MessageToast.show("¡Catálogo creado con éxito!");
              this._oAddDialog.close();

              // Agregar el nuevo registro
              aData.push(oData);
              // Actualizar el modelo
              oTableModel.setProperty("/value", aData);
            })
            .catch((error) => {
              MessageToast.show("Error al crear: " + error.message);
            });
        }, */
        // ---------------------------------------------------- FIN PARA AGREGAR UN NUEVO LABEL

        // ---------------------------------------------------- PARA EDITAR UN LABEL

        onEditPressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Crear modelo para edición (clonando para evitar referencias)
          var oEditModel = new JSONModel($.extend(true, {}, oData));
          this.getView().setModel(oEditModel, "editModel");

          // Cargar diálogo de edición
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.EditCatalogDialog",
              controller: this,
            }).then((oDialog) => {
              this._oEditDialog = oDialog;
              this.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          // Filtra solo los campos válidos para Catalog
          var allowedFields = [
            "CEDIID",
            "COMPANYID",
            "LABELID",
            "LABEL",
            "INDEX",
            "COLLECTION",
            "SECTION",
            "SEQUENCE",
            "IMAGE",
            "DESCRIPTION",
          ];
          var cleanCatalog = {};
          allowedFields.forEach(function (field) {
            if (oEditedData.hasOwnProperty(field)) {
              cleanCatalog[field] = oEditedData[field];
            }
          });

          var sLabelId = cleanCatalog.LABELID;

          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          console.log("sLabelID: ", sLabelId);

          $.ajax({
            url:
              `${API_BASE_URL}/api/security/updatecatalogs?labelid=` +
              encodeURIComponent(sLabelId),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              catalogs: cleanCatalog // solo el objeto limpio aquí
            }),
            success: function (response) {
              MessageToast.show("Registro actualizado correctamente");
              this._oEditDialog.close();

              // Actualizar el modelo local con los nuevos datos
              var updatedIndex = aData.findIndex(
                (item) => item.LABELID === sLabelId
              );
              if (updatedIndex !== -1) {
                aData[updatedIndex] = {
                  ...aData[updatedIndex],
                  ...cleanCatalog
                };
                oTableModel.setProperty("/value", aData);
              }
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al actualizar: " + error.responseText);
            }
          });
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        // ---------------------------------------------------- FIN PARA EDITAR UN LABEL

        // ---------------------------------------------------- PARA ELIMINAR UN LABEL
        onDeletePressed: function () {
          if (!this._oSelectedItem) return;

          const oContext = this._oSelectedItem.getBindingContext();
          const oData = oContext.getObject();

          MessageBox.confirm("¿Está seguro de eliminar este registro?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                $.ajax({
                  url:
                    `${API_BASE_URL}/api/security/removecatalog?labelid=` +
                    encodeURIComponent(oData.LABELID),
                  method: "POST",
                  contentType: "application/json",
                  data: JSON.stringify({ labelid: oData.LABELID }),
                  success: function () {
                    MessageToast.show("Registro eliminado");

                    // Actualizar modelo local
                    const oTableModel = this.getView().getModel();
                    const aData = oTableModel.getProperty("/value") || [];

                    const index = aData.findIndex(
                      (item) => item.LABELID === oData.LABELID
                    );
                    if (index !== -1) {
                      aData.splice(index, 1);
                      oTableModel.setProperty("/value", aData);
                    }
                  }.bind(this),
                  error: function (error) {
                    MessageToast.show(
                      "Error al eliminar: " + error.responseText
                    );
                  }.bind(this),
                });
              }
            }.bind(this),
          });
        },
        // ---------------------------------------------------- FIN PARA ELIMINAR UN LABEL

        // ---------------------------------------------------- ELIMINADO/ACTIVADO LOGICO

        onActivatePressed: function () {
          this._changeStatus(true);
        },

        onDeactivatePressed: function () {
          this._changeStatus(false);
        },

        _changeStatus: function (bActivate) {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          var sLabelID = oData.LABELID;

          // Define la URL según la acción (rutas definidas en CDS)
            var sUrl = bActivate
            ? `${API_BASE_URL}/api/security/activatecatalogs?labelid=` + encodeURIComponent(sLabelID)
            : `${API_BASE_URL}/api/security/deletecatalogs?labelid=` + encodeURIComponent(sLabelID);

          var sStatusMessage = bActivate ? "activado" : "desactivado";

          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          $.ajax({
            url: sUrl,
            method: "POST",
            contentType: "application/json",
            // Envía labelid en el body, según lo que espera CAP
            data: JSON.stringify({ labelid: oData.LABELID }),
            success: function () {
              var index = aData.findIndex(
                (item) => item.LABELID === oData.LABELID
              );
              if (index !== -1) {
                aData[index].DETAIL_ROW.ACTIVED = bActivate;
                oTableModel.setProperty("/value", aData);
              }

              this.byId("activateButton").setVisible(!bActivate);
              this.byId("activateButton").setEnabled(!bActivate);
              this.byId("deactivateButton").setVisible(bActivate);
              this.byId("deactivateButton").setEnabled(bActivate);

              MessageToast.show(`Registro ${oData.LABELID}: ${sStatusMessage}`);
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error: " + error.responseText);
            }.bind(this),
          });
        },

        // ---------------------------------------------------- FIN ELIMINADO/ACTIVADO LOGICO

        _refreshCatalogTable: function () {
          var oModel = this.getView().getModel();

          $.ajax({
            url: `${API_BASE_URL}/security/catalogs`,
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
            },
            error: function (error) {
              MessageToast.show("Error al cargar datos: " + error.responseText);
            },
          });
        },
      }
    );
  }
);
