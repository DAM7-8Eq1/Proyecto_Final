sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment"
], function (
  BaseController,
  JSONModel,
  Log,
  MessageToast,
  MessageBox,
  Filter,
  FilterOperator,
  Fragment
) {
  "use strict";

  return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.RoleMaster", {


        onInit: function () {
      //cargar los roles
      this.loadRoles();
    },
    loadRoles: function () {
        var oModel = new JSONModel();
        this.getView().setModel(oModel, "roles");

        fetch("http://localhost:3020/api/security/roles", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener roles");
            return response.json();
        })
        .then(data => {
         
            oModel.setData({ value: data.value });
             console.log(oModel);
        })
        .catch(error => {
            MessageToast.show("Error: " + error.message);
        });
    },
    onRoleSelected:function(oEvent){
        var oSelectedItem = oEvent.getParameter("listItem");
        var oContext = oSelectedItem.getBindingContext("roles");
        var oData = oContext.getObject();
        this.getView().getModel("roles").setProperty("/selectedRole", oData);
        //activar el boton de eliminar detalles

    },
    onOpenDialog:function(){
      var oView = this.getView();
      if (!this._oCreateRoleDialog) {
          Fragment.load({
              id: oView.getId(),
              name: "com.inv.sapfiroriwebinversion.view.security.components.AddRoleDialog",
              controller: this
          }).then(oDialog => {
              this._oCreateRoleDialog = oDialog;
              oView.addDependent(oDialog);
              this._oCreateRoleDialog.open();
          });
      } else {
          this._oCreateRoleDialog.open();
      }
    },
    onDialogClose: function () {  
     if (this._oCreateRoleDialog) { 
           
             this._oCreateRoleDialog.close();
        }
      },

    


    
  });
});