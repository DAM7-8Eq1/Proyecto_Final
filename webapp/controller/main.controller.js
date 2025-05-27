sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("com.inv.sapfiroriwebinversion.controller.Main", {

    onInit: function () {
    const oUser = this.getOwnerComponent().getModel("appView").getProperty("/currentUser");
    console.log("Usuario recibido en Main:", oUser);
    },

    onInvertions: function () {
      //Redirigir a Inversiones
      this.getOwnerComponent().getRouter().navTo("RouteInvertionsCompanies");
    }, 

    onRoles: function () {
      //Redirigir a Roles
      this.getOwnerComponent().getRouter().navTo("RouteRolesMaster");
    },
    //Reditigir a catalogos
    onCatalogs: function () {
      this.getOwnerComponent().getRouter().navTo("RouteCatalogs");
    },
    onUsers: function () {
      //Redirigir a usuarios
      this.getOwnerComponent().getRouter().navTo("RouteUserList");
    }

  });
});
