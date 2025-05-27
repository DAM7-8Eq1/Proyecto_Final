sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery",
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend("com.inv.sapfiroriwebinversion.controller.catalogs.pages.Catalogs",
      {
/*
        Al iniciar se ejecuta la sikgueinte funcion que coloca los datos de catalogos
*/
        onInit: function () {


            // Carga los catalogos
            this.loadCatalogs();


        
      },
      /*
      Funcion para cargar los del catalogo en la tabla 
      */
      loadCatalogs: function (){
        //Creacion de un modelo de Json dond se guardaran los datos
          var oModel = new JSONModel();
          var that = this;

        //Realizacion del FETCH con un GET para traer los catalogos
          fetch("http://localhost:3020/api/security/allCatalogs", {
              method: "GET",
              headers: { "Content-Type": "application/json" }
          })
          .then(response => {
            //En caso de erros
              if (!response.ok) throw new Error("Error al obtener catálogos");
              return response.json();
          })
          .then(data => {
            //Colocar la data obtenida en el modelo de la tabla
            oModel.setData({ value: data.value });
            that.getView().setModel(oModel);
            // Mandar todos los LABELID al modelo "values" (si la vista lateral está cargada)
            var aLabelIds = (data.value || []).map(function(item) {
                return { LABELIDC: item.LABELID, LABEL: item.LABEL };
            });
            var oValuesView = that.byId("XMLViewValues");
            if (oValuesView) {
                oValuesView.loaded().then(function () {
                    var oValuesModel = oValuesView.getModel("values");
                    if (oValuesModel) {
                        oValuesModel.setProperty("/AllLabels", aLabelIds);
                    }
                });
            } 
          })
          .catch(error => {
            console.log(error.message)
              MessageToast.show("Error: " + error.message);
          });
        },

        /*
        Funcion al presionar la tabla de ctalogos despliegue la vista lateral para obeseravar los valres que este tiene

        */
        onItemPress: function (oEvent){
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;

          // Fetch para obtener los valores del catálogo seleccionado
          fetch("http://localhost:3020/api/security/catalogs?labelid=" + encodeURIComponent(sLabelID), {
              method: "GET",
              headers: { "Content-Type": "application/json" }
          })
          .then(response => {
              if (!response.ok) throw new Error("Error al obtener valores");
              return response.json();
          })
          .then(data => {

                    // Cambiar LABELID a LABELIDM en cada objeto de VALUES
            if (data.value && data.value[0] && Array.isArray(data.value[0].VALUES)) {
                data.value[0].VALUES = data.value[0].VALUES.map(function(item) {
                    item.LABELIDM = item.LABELID; // Copia el valor
                    delete item.LABELID;           // Opcional: elimina el original
                    return item;
                });
            }


            //Inicializar la ventan lateral 
            var oValuesView = this.byId("XMLViewValues");
            //Verificaion de que se encuentra
            if (oValuesView) {
              //Mandar a llmar la funcion de a values 
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  
                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues( data.value[0].VALUES );

                    // Actualiza el selectedValue en el modelo values
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            
          })
          .catch(error => {
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

        onAddCatalog: function () {
           var oView = this.getView();
            var oDialog = oView.byId("addCatalogDialog");

            // Crear y asignar el modelo si no existe
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
                    DETAIL_ROW: { ACTIVED: true }
                });
                oView.setModel(oAddCatalogModel, "addCatalogModel");
            }
          if (!oDialog) {
            oDialog = Fragment.load({
              id: oView.getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.addCatalogDialog",
              controller: this
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            oDialog.open();
          }
        }, 

        onCancelAddCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("addCatalogDialog");
          if (oDialog) {
            // Vacía los campos del modelo
          oView.getModel("addCatalogModel").setData({
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "",
            SEQUENCE: "",
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: { ACTIVED: true }
          });

            oDialog.close();
          } else {
            MessageBox.error("No se encontró el diálogo de agregar catálogo.");
          }   
        },

        onSaveCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("addCatalogDialog");
          var oCatalogData = oView.getModel("addCatalogModel").getData();
          if (!oCatalogData.LABELID || !oCatalogData.DESCRIPTION) {
            MessageBox.error("Por favor, complete todos los campos.");
            return;
          }
              var oPayload = {
            CEDIID:"1",
            COMPANYID:"0",
            LABELID: oCatalogData.LABELID,
            LABEL: oCatalogData.LABEL,
            INDEX: oCatalogData.INDEX,
            COLLECTION: oCatalogData.COLLECTION,
            SECTION: oCatalogData.SECTION,
            SEQUENCE: oCatalogData.SEQUENCE,
            IMAGE: oCatalogData.IMAGE,
            DESCRIPTION: oCatalogData.DESCRIPTION,
           
        };
          
        //Verificar que el LABELID no exista
        var oModel = oView.getModel();  
        var aData = oModel.getData().value || [];
        var bExists = aData.some(function (item) {
            return item.LABELID === oPayload.LABELID;
        }
        );
        if (bExists) {
          MessageBox.error("El LABELID ya existe. Por favor, elija otro.");
          return;
        }

          // Realizar el POST para agregar el catálogo
          fetch("http://localhost:3020/api/security/CreateCatalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({catalogs:oPayload})
          })
          .then(response => {
            if (!response.ok) throw new Error("Error al agregar catálogo");
            return response.json();
          })
          .then(data => {
            MessageToast.show("Catálogo agregado exitosamente.");
            //Insertar el nuevo catalogo en el modelo de la tabla
            var oModel = oView.getModel();
            var aData = oModel.getData().value || [];
            aData.push(data[0]); // Asumiendo que el nuevo catálogo se devuelve en data.value
            oModel.setData({ value: aData });
            oModel.refresh(true); // Refrescar el modelo para actualizar la vista
            // Actualizar el modelo de la tabla
            oView.getModel().setProperty("/value", aData);
            
            // Limpiar el modelo después de agregar
            oView.getModel("addCatalogModel").setData({
              LABELID: "",
              LABEL: "",
              INDEX: "",
              COLLECTION: "",
              SECTION: "",
              SEQUENCE: "",
              IMAGE: "",
              DESCRIPTION: "",
              DETAIL_ROW: { ACTIVED: true }
            });

            oDialog.close();

           
          })
          .catch(error => {
            MessageBox.error("Error: " + error.message);
          });
          
           
        },
        onDeactivatePressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para desactivar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;

          // Verificar si el catálogo ya está desactivado
          if (!oData.DETAIL_ROW.ACTIVED) {
            MessageBox.error("El catálogo ya está desactivado.");
            return;
          }

          // Realizar el PUT para desactivar el catálogo
          fetch("http://localhost:3020/api/security/deletecatalogs?labelid="+labelid, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify()
          })
          .then(response => {
            if (!response.ok) throw new Error("Error al desactivar catálogo");
            return response.json();
          })
          .then(data => {
            MessageToast.show("Catálogo desactivado exitosamente.");
            // Actualizar el modelo de la tabla
            var oModel = this.getView().getModel();
            var aData = oModel.getProperty("/value") || [];
            var idx = aData.findIndex(item => item.LABELID === labelid);
            if (idx !== -1) {
                aData[idx].DETAIL_ROW.ACTIVED = false;
                oModel.setProperty("/value", aData);
                oModel.refresh(true);
            }
          })
          .catch(error => {
            MessageBox.error("Error: " + error.message);
          });
        },

        onActivatePressed: function () {
            var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para activar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;

          // Verificar si el catálogo ya está desactivado
          if (oData.DETAIL_ROW.ACTIVED) {
            MessageBox.error("El catálogo ya está activado.");
            return;
          }

          // Realizar el PUT para desactivar el catálogo
          fetch("http://localhost:3020/api/security/activatecatalogs?labelid="+labelid, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify()
          })
          .then(response => {
            if (!response.ok) throw new Error("Error al activar catálogo");
            return response.json();
          })
          .then(data => {
            MessageToast.show("Catálogo activado exitosamente.");
            //cambiar el estado en la tabla
            var oModel = this.getView().getModel();
            var aData = oModel.getProperty("/value") || [];
            var idx = aData.findIndex(item => item.LABELID === labelid);
            if (idx !== -1) {
                aData[idx].DETAIL_ROW.ACTIVED = true;
                oModel.setProperty("/value", aData);
                oModel.refresh(true);
            }
            
          })
          .catch(error => {
            MessageBox.error("Error: " + error.message);
          });
        },
        onDeletePressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para eliminar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var labelid = oData.LABELID;

          // Confirmación antes de eliminar
          MessageBox.confirm("¿Está seguro de que desea eliminar el catálogo "+labelid+"?", {
            title: "Confirmar eliminación",
            icon: MessageBox.Icon.WARNING,
            onClose: function (sAction) {
              if (sAction === "OK") {
                // Realizar el DELETE para eliminar el catálogo
                fetch("http://localhost:3020/api/security/removecatalog?labelid="+labelid, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }
                })
                .then(response => {
                  if (!response.ok) throw new Error("Error al eliminar catálogo");
                  return response.json();
                })
                .then(data => {
                  MessageToast.show("Catálogo eliminado exitosamente.");
                  // Actualizar el modelo de la tabla
                  var oModel = this.getView().getModel();
                  var aData = oModel.getProperty("/value") || [];
                  aData = aData.filter(item => item.LABELID !== labelid);
                  oModel.setProperty("/value", aData);
                  oModel.refresh(true);
                })
                .catch(error => {
                  MessageBox.error("Error: " + error.message);
                });
              }
            }.bind(this)
          });
          
        },

        onEditPressed: function () {
          var oSelectedItem = this._oSelectedItem;
          if (!oSelectedItem) {
            MessageBox.error("Por favor, seleccione un catálogo para editar.");
            return;
          }

          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          this.glabelid = oData.LABELID;
          // Crear un modelo temporal para el diálogo de edición
          var oEditModel = new JSONModel(oData);
          this.getView().setModel(oEditModel, "editModel");

          // Abrir el diálogo de edición
          var oDialog = this.byId("editDialog");
          if (!oDialog) {
            oDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.editCatalogDialog",
              controller: this
            }).then(function (oDialog) {
              this.getView().addDependent(oDialog);
              //Cargar los datos del catálogo seleccionado
              var oCatalogData = this.getView().getModel("editModel").getData();  
              oCatalogData.LABELID = oData.LABELID;
              oCatalogData.LABEL = oData.LABEL;
              oCatalogData.INDEX = oData.INDEX;
              oCatalogData.COLLECTION = oData.COLLECTION;
              oCatalogData.SECTION = oData.SECTION;
              oCatalogData.SEQUENCE = oData.SEQUENCE;
              oCatalogData.IMAGE = oData.IMAGE; 
              oCatalogData.DESCRIPTION = oData.DESCRIPTION;
              oCatalogData.DETAIL_ROW = { ACTIVED: oData.DETAIL_ROW.ACTIVED };
              // Actualizar el modelo de edición con los datos del catálogo seleccionado
          
              oEditModel.setData(oCatalogData);
              // Asignar el modelo de edición al diálogo
              oDialog.setModel(oEditModel, "editCatalogModel");


              // Abrir el diálogo
              oDialog.open();
            }.bind(this));
          } else {
            oDialog.open();
          }
        },
        onSaveEditCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("editDialog");
          var oEditData = oView.getModel("editModel").getData();
          if (!oEditData.LABELID || !oEditData.DESCRIPTION) {
            MessageBox.error("Por favor, complete todos los campos.");
            return;
          }
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
          // Realizar el PUT para actualizar el catálogo
          fetch("http://localhost:3020/api/security/updatecatalogs?labelid="+this.glabelid, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({catalogs:oPayload})
          })
          .then(response => {
            if (!response.ok) throw new Error("Error al actualizar catálogo");
            return response.json();
          })
          .then(data => {
            MessageToast.show("Catálogo actualizado exitosamente.");
            // Actualizar el modelo de la tabla
            var oModel = oView.getModel();
            var aData = oModel.getProperty("/value") || [];
            var idx = aData.findIndex(item => item.LABELID === oPayload.LABELID);
            if (idx !== -1) {
              aData[idx] = oPayload; // Actualizar el catálogo modificado
              oModel.setProperty("/value", aData);
              oModel.refresh(true);
            }
            // Cerrar el diálogo
            oDialog.close();
          })
          .catch(error => {
            MessageBox.error("Error: " + error.message);
          });
        },

        onCancelEditCatalog: function () {
          var oView = this.getView();
          var oDialog = oView.byId("editDialog");
          if (oDialog) {
            oDialog.close();
          } else {
            MessageBox.error("No se encontró el diálogo de editar catálogo.");
          }
        },

       onFilterChange: function(oEvent) {
          var sQuery = oEvent.getParameter("value") || "";
          var oTable = this.byId("catalogTable"); // Asegúrate que tu tabla tenga este ID
          var oBinding = oTable.getBinding("items"); // O "rows" si usas sap.ui.table.Table

          if (!oBinding) return;

          var aFilters = [];
          if (sQuery) {
              aFilters.push(
                  new sap.ui.model.Filter({
                      filters: [
                          new sap.ui.model.Filter("LABELID", sap.ui.model.FilterOperator.Contains, sQuery),
                          new sap.ui.model.Filter("LABEL", sap.ui.model.FilterOperator.Contains, sQuery),
                          new sap.ui.model.Filter("DESCRIPTION", sap.ui.model.FilterOperator.Contains, sQuery)
                      ],
                      and: false
                  })
              );
          }
          oBinding.filter(aFilters);
        },

        onSearchUser: function () {
            var oTable = this.byId("catalogTable");
            var oModel = oTable.getModel();
            var acatalgos = oModel.getProperty("/value") || [];
            var oSearchField = this.byId("searchField"); // Asegúrate de tener un SearchField con este ID en tu vista
            var sQuery = oSearchField ? oSearchField.getValue().toLowerCase() : "";

            if (!sQuery) {
                // Si no hay búsqueda, muestra todos los usuarios
                oModel.setProperty("/filtered", acatalgos);
                oTable.bindRows("/filtered");
                return;
            }

            // Filtra usuarios por cualquier campo (string)
            var aFiltered = acatalgos.filter(function(user) {
                return Object.values(user).some(function(value) {
                    if (typeof value === "object" && value !== null) {
                        // Si el valor es un objeto, busca en sus propiedades también
                        return Object.values(value).some(function(subValue) {
                            return String(subValue).toLowerCase().includes(sQuery);
                        });
                    }
                    return String(value).toLowerCase().includes(sQuery);
                });
            });

            oModel.setProperty("/filtered", aFiltered);
            var oBindingInfo = oTable.getBindingInfo("items");
            oTable.bindItems({
                path: "/filtered",
                template: oBindingInfo.template,
                templateShareable: true
            });
        },
        });
    
});