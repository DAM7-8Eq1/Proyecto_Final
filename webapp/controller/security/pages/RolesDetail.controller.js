sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.RolesDetail", {

        onInit: function () {
       
        },

        onUsersPress: function() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteUserList");
        },
        
        onCatalogsPress: function() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCatalogs");
        }
    
    });
});