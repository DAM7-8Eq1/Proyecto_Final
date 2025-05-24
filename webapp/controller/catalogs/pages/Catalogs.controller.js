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
          fetch("http://localhost:3020/api/security/catalogs", {
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

    
        });
    
});