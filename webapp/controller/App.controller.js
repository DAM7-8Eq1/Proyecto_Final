sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], (BaseController, MessageToast) => {
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
        onUserPress: function(){
            const oAppViewModel = this.getOwnerComponent().getModel("appView");
            oAppViewModel.setProperty("/isLoggedIn", false);

            MessageToast.show("Sesión cerrada");
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("login");
        },

        onItemSelect: function (oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oRouter = this.getOwnerComponent().getRouter();
            const isLoggedIn = this.getOwnerComponent().getModel("appView").getProperty("/isLoggedIn");

            if (!isLoggedIn) {
                MessageToast.show("Debe iniciar sesión para acceder");
                return;
            }
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
