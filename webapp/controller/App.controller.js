sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("com.inv.sapfiroriwebinversion.controller.App", {

        onInit: function () {
            //Enviar el main a iniciar 
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },


        onToggleSideNav: function () {
            const oToolPage = this.byId("mainToolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onItemSelect: function (oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oRouter = this.getOwnerComponent().getRouter();
            //Verificar de la lista de opciones 8items) del menu lateral cual se escogio
            //Y redirigir a dicha ruta
            switch (sKey) {
                case "roles":
                    oRouter.navTo("RouteRolesMaster");
                    break;
                case "users":
                    oRouter.navTo("RouteUserList");
                    break;
                case "catalogs":
                    oRouter.navTo("RouteCatalogs");
                    break;
                case "investments":
                    oRouter.navTo("RouteInvestments");
                    break;
                default:
                    oRouter.navTo("main");
            }
        }

    });
});
