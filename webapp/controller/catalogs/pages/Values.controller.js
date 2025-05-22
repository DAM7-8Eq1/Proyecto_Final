sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "jquery"
], function (BaseController, JSONModel, MessageBox, MessageToast, Filter, Fragment, FilterOperator, $) {
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.catalogs.pages.Values", {
          onInit: function () {
            // Modelo para los valores
            this.getView().setModel(new JSONModel({
                values: [],
                selectedValue: null
            }), "values");
            this.getView().setModel(new JSONModel({
                values: [],       // Datos de la tabla
                selectedValueIn: null  //Para bloquear los botones
            }), "values");

            // Modelo para los datos del formulario
            this.getView().setModel(new JSONModel({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            }), "newValueModel");
        },
        // Método para cargar los valores en el modelo
        loadValues: function (aValues) {
            this.getView().getModel("values").setProperty("/values", aValues || []);
        },
        // Método para abrir el diálogo de selección de valores
        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oSelectedData = oItem.getBindingContext("values").getObject();
            // Actualiza el modelo newValueModel con los datos seleccionados
            this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: oSelectedData.VALUEID,
                VALUE: oSelectedData.VALUE,
                VALUEPAID: oSelectedData.VALUEPAID,
                ALIAS: oSelectedData.ALIAS,
                IMAGE: oSelectedData.IMAGE,
                DESCRIPTION: oSelectedData.DESCRIPTION
            });

            // Activa el modo de edición
            this.getView().getModel("values").setProperty("/selectedValueIn", true);
        },
        onAddValues:function (){
            
            if (!this._oAddDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.AddValueDialog",
                    controller: this,
                }).then(
                    (oDialog) => {
                        this._oAddDialog = oDialog;
                        this.getView().addDependent(oDialog);
                        oDialog.open();
                    }
                );
            } else {
                this._oAddDialog.open();
            }
        },
        onCancelValues: function () {
            //cerrar el dialog y limpiar el modelo
            this._oAddDialog.close();
            this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            });
            this.getView().getModel("values").setProperty("/selectedValueIn", false);

        },

    });

});