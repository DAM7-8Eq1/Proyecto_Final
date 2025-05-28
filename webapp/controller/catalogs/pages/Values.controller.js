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
            currentLabelId: null, // <--- variable global para LABELID
     
             onInit: function () {
            // Modelo para los valores
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
            if (!this.getView().getModel("values")) {
                this.getView().setModel(new sap.ui.model.json.JSONModel(), "values");
            }
            // Cargar los valores iniciales
            this.loadCombboLabelId();
        },
        loadCombboLabelId: function () {
            var oValuesModel = this.getView().getModel("values");
            var aLabels = oValuesModel.getProperty("/AllLabels") || [];
            // Asegúrate de que cada objeto tenga LABELIDC y LABEL
            var aComboItems = aLabels.map(function(label) {
                return {
                    LABELIDC: label.LABELIDC || label.LABELID, // Soporta ambos nombres
                    LABEL: label.LABEL
                };
            });
            oValuesModel.setProperty("/ComboLabels", aComboItems);
        },
        // Método para cargar los valores en el modelo
        loadValues: function (aValues) {
            this.getView().getModel("values").setProperty("/values", aValues || []);
        },
        loadlabels: function (aLabels) {
           //Obtner los labelID de la tabla
            var aLabelIds = aLabels.map(function (label) {
                return label.LABELID;
            });
            // Establecer los labelID en el modelo
            this.getView().getModel("values").setProperty("/labelIds", aLabelIds);
        },
        loadValuesId: function () {
            // Establecer los valores en el modelo dependiendo de labelidEscogido
            var oModel = this.getView().getModel("values");
            var labelIdEscogido = oModel.getProperty("/labelIdEscogido");
            var aValues = oModel.getProperty("/values").filter(function (value) {
                return value.LABELID === labelIdEscogido;
            });
            this.getView().getModel("values").setProperty("/values", aValues);

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
        onSaveValues: function () {
            // Obtener los datos del modelo newValueModel
            var oText = this.byId("_IDGenText8");
            var sText = oText ? oText.getText() : "";
            var oNewValueData = this.getView().getModel("newValueModel").getProperty("/");
            var sValuePaid = ( (oNewValueData.LABELIDC || "") +"-"+ (oNewValueData.VALUEIDC || ""));

            // Validar que los campos requeridos no estén vacíos
            var oData ={
                COMPANYID:"1",
                CEDIID:"1", 
                VALUEID: oNewValueData.VALUEID,
                VALUE: oNewValueData.VALUE,
                VALUEPAID: sValuePaid,
                SEQUENCE:"10",
                ALIAS: oNewValueData.ALIAS,
                IMAGE: oNewValueData.IMAGE,
                DESCRIPTION: oNewValueData.DESCRIPTION,
                LABELID: sText,
                ROUTE: "https://investments/pages/portfolio.html" 
            };
            
            if (!oNewValueData.VALUE || !sText) {
                MessageBox.error("Por favor, complete todos los campos requeridos.");
                return;
            }
            // Realizar la petición POST para agregar el nuevo valor
            fetch("http://localhost:3020/api/security/CreateValue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body:  JSON.stringify({value:oData})
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al agregar el valor");
                return response.json();
            })
            .then(data => {
                // Actualizar el modelo de valores con el nuevo valor
                var oNewValueModel = this.getView().getModel("newValueModel");
                var oNewValueData = oNewValueModel.getProperty("/");

                var oValuesModel = this.getView().getModel("values");
                var aValues = oValuesModel.getProperty("/values") || [];
                aValues.push({
                    VALUEID: oNewValueData.VALUEID,

                    VALUE: oNewValueData.VALUE,
                    VALUEPAID: oNewValueData.VALUEPAID,
                    ALIAS: oNewValueData.ALIAS,
                    IMAGE: oNewValueData.IMAGE,
                    DESCRIPTION: oNewValueData.DESCRIPTION,
                    LABELID:oNewValueData.LABELID, 
                });
                console.log("Nuevo valor agregado:", aValues);
                oValuesModel.setProperty("/values", aValues);
                // Limpiar el modelo newValueModel
                this.getView().getModel("newValueModel").setProperty("/", {
                    VALUEID: "",
                    VALUE: "",
                    VALUEPAID: "",
                    ALIAS: "",
                    IMAGE: "",
                    DESCRIPTION: ""
                });
                // Cerrar el diálogo
                this._oAddDialog.close();
                // Mostrar mensaje de éxito
                MessageToast.show("Valor agregado exitosamente.");
            })
            .catch(error => {
                console.error("Error al agregar el valor:", error);
                MessageBox.error("Error al agregar el valor: " + error.message);
            });
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
      onEditValues:function (){
            
            if (!this._oEditDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.EditValueDialog",
                    controller: this,
                }).then(
                    (oDialog) => {
                        this._oEditDialog = oDialog;
                        this.getView().addDependent(oDialog);
                        oDialog.open();
                    }
                );
            } else {
                this._oEditDialog.open();
            }
        },

        onUpdateValues: function () {
            var oText = this.byId("_IDGenText9");
            var sText = oText ? oText.getText() : "";
            var oNewValueData = this.getView().getModel("newValueModel").getProperty("/");
            var sValuePaid = ( (oNewValueData.LABELIDC || "") + "-" + (oNewValueData.VALUEIDC || "") );

            // Validar campos requeridos
            if (!oNewValueData.VALUEID || !oNewValueData.VALUE || !sText) {
                MessageBox.error("Por favor, complete todos los campos requeridos.");
                return;
            }

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
                ROUTE: "https://investments/pages/portfolio.html"
            };
            
            fetch("http://localhost:3020/api/security/updateValue?valueid="+oNewValueData.VALUEID, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ value: oData })
                
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al actualizar el valor");
                return response.json();
            })
            .then(data => {
                // Actualiza el modelo local si es necesario
                var oValuesModel = this.getView().getModel("values");
                var aValues = oValuesModel.getProperty("/values") || [];
                var iIndex = aValues.findIndex(function(item) {
                    return item.VALUEID === oNewValueData.VALUEID;
                });
                if (iIndex !== -1) {
                    aValues[iIndex] = Object.assign({}, aValues[iIndex], oData);
                    oValuesModel.setProperty("/values", aValues);
                }
                // Limpiar y cerrar
                this.getView().getModel("newValueModel").setProperty("/", {
                    VALUEID: "",
                    VALUE: "",
                    VALUEPAID: "",
                    ALIAS: "",
                    IMAGE: "",
                    DESCRIPTION: ""
                });
                if (this._oEditDialog) {
                    this._oEditDialog.close();
                }
                MessageToast.show("Valor actualizado exitosamente.");
            })
            .catch(error => {
                console.error("Error al actualizar el valor:", error);
                MessageBox.error("Error al actualizar el valor: " + error.message);
            });
        },  
        onEditCancelValues: function () {
            //cerrar el dialog y limpiar el modelo
            this._oEditDialog.close();
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

        onLabelIdChange: function(oEvent) {
            // Obtiene el key seleccionado del ComboBox
            var sLabelIdc = oEvent.getSource().getSelectedKey();

            // Si necesitas el objeto completo del label:
            var aLabels = this.getView().getModel("values").getProperty("/ComboLabels") || [];
           
            var oSelectedLabel = aLabels.find(function(label) {
                return label.LABELIDC === sLabelIdc;
            });

            // Puedes guardar el LABELIDC en el modelo si lo necesitas
            this.getView().getModel("newValueModel").setProperty("/LABELIDC", sLabelIdc);

            // Llama a la función para cargar los valores por LABELID
            
            this.loadValuesByLabelId(sLabelIdc);
        },

        loadValuesByLabelId: function (sLabelId) {
            var oModel = this.getView().getModel("values");
            //fetch para obtener los valores por LABELID
            fetch(`http://localhost:3020/api/security/catalogs?labelid=${sLabelId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al obtener valores");
                return response.json();
            })
            .then(data => {
                // Actualiza el modelo con los valores obtenidos
                 var aValues = (data.value[0].VALUES || []).map(function(item) {
                    return {
                        VALUEIDC: item.VALUEID, // Cambia el nombre aquí
                        VALUE: item.VALUE
                        // agrega otras propiedades si las necesitas
                    };
                });
                oModel.setProperty("/filteredValues", aValues);
            })
            .catch(error => {
                console.log(error.message);
                MessageToast.show("Error: " + error.message);
            });
        },

        
        deleteValueById: function() {
            var that = this;
            // Obtener el VALUEID del registro seleccionado
            var oNewValueData = this.getView().getModel("newValueModel").getProperty("/");
            var sValueId = oNewValueData.VALUEID;

            if (!sValueId) {
                MessageBox.error("No hay valor seleccionado para eliminar.");
                return;
            }
            MessageBox.confirm("¿Seguro que deseas eliminar este valor?", {
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        fetch(`http://localhost:3020/api/security/physicalDeleteValue?valueid=${ oNewValueData.VALUEID}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" }
                        })
                        .then(response => {
                            if (!response.ok) throw new Error("Error al eliminar el valor");
                            return response.json();
                        })
                        .then(data => {
                            // Elimina el valor del modelo local
                            var oValuesModel = that.getView().getModel("values");
                            var aValues = oValuesModel.getProperty("/values") || [];
                            var aFiltered = aValues.filter(function(item) {
                                return item.VALUEID !== sValueId;
                            });
                            oValuesModel.setProperty("/values", aFiltered);
                            MessageToast.show("Valor eliminado exitosamente.");
                        })
                        .catch(error => {
                            console.error("Error al eliminar el valor:", error);
                            MessageBox.error("Error al eliminar el valor: " + error.message);
                        });
                    }
                }
            });
        },

        deactivateValueById: function() {
            var that = this;
            var oNewValueData = this.getView().getModel("newValueModel").getProperty("/");
            var sValueId = oNewValueData.VALUEID;

            if (!sValueId) {
                MessageBox.error("No hay valor seleccionado para desactivar.");
                return;
            }

            MessageBox.confirm("¿Seguro que deseas desactivar este valor?", {
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        fetch(`http://localhost:3020/api/security/logicalDeleteValue?valueid=${encodeURIComponent(sValueId)}`, {
                            method: "POST", // O "POST" según tu API
                            headers: { "Content-Type": "application/json" }
                        })
                        .then(response => {
                            if (!response.ok) throw new Error("Error al desactivar el valor");
                            return response.json();
                        })
                        .then(data => {
                            // Actualiza el modelo local: pone ACTIVED en false
                            var oValuesModel = that.getView().getModel("values");
                            var aValues = oValuesModel.getProperty("/values") || [];
                            var iIndex = aValues.findIndex(function(item) {
                                return item.VALUEID === sValueId;
                            });
                            if (iIndex !== -1) {
                
                                aValues[iIndex].DETAIL_ROW = aValues[iIndex].DETAIL_ROW || {};
                                aValues[iIndex].DETAIL_ROW.ACTIVED = false; 
                                oValuesModel.setProperty("/values", aValues);
                                oValuesModel.refresh(true);
                            }
                            MessageToast.show("Valor desactivado exitosamente.");
                        })
                        .catch(error => {
                            console.error("Error al desactivar el valor:", error);
                            MessageBox.error("Error al desactivar el valor: " + error.message);
                        });
                    }
                }
            });
        },
        activateValueById: function() {
            var that = this;
            var oNewValueData = this.getView().getModel("newValueModel").getProperty("/");
            var sValueId = oNewValueData.VALUEID;

            if (!sValueId) {
                MessageBox.error("No hay valor seleccionado para activar.");
                return;
            }

            MessageBox.confirm("¿Seguro que deseas activar este valor?", {
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        fetch(`http://localhost:3020/api/security/logicalActivateValue?valueid=${encodeURIComponent(sValueId)}`, {
                            method: "POST", // O "POST" según tu API
                            headers: { "Content-Type": "application/json" }
                        })
                        .then(response => {
                            if (!response.ok) throw new Error("Error al activar el valor");
                            return response.json();
                        })
                        .then(data => {
                            // Actualiza el modelo local: pone ACTIVED en true
                            var oValuesModel = that.getView().getModel("values");
                            var aValues = oValuesModel.getProperty("/values") || [];
                            var iIndex = aValues.findIndex(function(item) {
                                return item.VALUEID === sValueId;
                            });
                            if (iIndex !== -1) {
                
                                aValues[iIndex].DETAIL_ROW = aValues[iIndex].DETAIL_ROW || {};
                                aValues[iIndex].DETAIL_ROW.ACTIVED = true;
                                oValuesModel.setProperty("/values", aValues);
                                oValuesModel.refresh(true);
                            }
                            MessageToast.show("Valor activado exitosamente.");
                        })
                        .catch(error => {
                            console.error("Error al activar el valor:", error);
                            MessageBox.error("Error al activar el valor: " + error.message);
                        });
                    }
                }
            });
        },

       onFilterChange: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue"); // Soporta SearchField y liveChange
            var oTable = this.byId("valuesTable");

            var oBinding = oTable.getBinding("items");
            if (!oBinding) {
                // El control no existe, evita el error
                return;
            }

            if (!sQuery) {
                // Limpia el filtro si no hay búsqueda
                oBinding.filter([]);
                return;
            }

            // Lista de campos a filtrar
            var aFields = ["VALUEID", "VALUE", "VALUEPAID", "ALIAS", "IMAGE", "DESCRIPTION", "LABELID"];
            var aFilters = aFields.map(function (sField) {
                return new sap.ui.model.Filter(sField, sap.ui.model.FilterOperator.Contains, sQuery);
            });

            // Filtro OR sobre todos los campos
            var oMultiFilter = new sap.ui.model.Filter(aFilters, false);
            oBinding.filter([oMultiFilter]);
        }

    });

});