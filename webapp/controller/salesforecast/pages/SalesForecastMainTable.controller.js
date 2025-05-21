sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController", 
    "sap/ui/model/json/JSONModel", 
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, BusyIndicator, MessageToast) {
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.salesforecast.SalesForecastMainTable", {
        
        onInit: function () {
            let oRouter = this.getRouter();
            oRouter.getRoute("RouteSalesForecast").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            BusyIndicator.show(0);

            const oTable = this.byId("IdTable1SalesForecastMainTable");
            const oModel = new JSONModel();

            // Obtener la ruta correcta del JSON
            let sJsonPath = sap.ui.require.toUrl("com/inv/sapfiroriwebinversion/resources/jsons/salesforecast.json");

            oModel.loadData(sJsonPath);

            oModel.attachRequestCompleted((oEvent) => {
                if (oEvent.getParameter("success")) {
                    oTable.setModel(oModel);
                } else {
                    MessageToast.show("Error al cargar los datos.");
                }
                BusyIndicator.hide();
            });

            oModel.attachRequestFailed(() => {
                MessageToast.show("No se pudo cargar el archivo JSON.");
                BusyIndicator.hide();
            });
        }
    });
});
