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
    
    onRoleSelected: function(oEvent) {
        var oContext = oEvent.getParameter("rowContext");
        if (!oContext) {
            // Si no hay contexto, salir
            return;
        }
        var oData = oContext.getObject();
        this.getView().getModel("roles").setProperty("/selectedRole", oData);
    },
    // abrir el modal para usuarios
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

    // abrir el modal para editar
    
    onDialogClose: function () {  
     if (this._oCreateRoleDialog) { 
           
             this._oCreateRoleDialog.close();
        }
      },
      
    onDeleteRole: function() {
        var oModel = this.getView().getModel("roles");
        var oSelectedRole = oModel.getProperty("/selectedRole");
        var that = this;

        if (!oSelectedRole || !oSelectedRole.ROLEID) {
            MessageToast.show("Selecciona un rol para eliminar.");
            return;
        }

        MessageBox.confirm("¿Estás seguro de que deseas eliminar este rol?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function(oAction) {
                if (oAction === MessageBox.Action.YES) {
                    fetch("http://localhost:3020/api/security/deleteroles", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ roleid: oSelectedRole.ROLEID })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error("No se pudo eliminar el rol");
                        return response.json();
                    })
                    .then(data => {
                        MessageToast.show("Rol eliminado correctamente");
                        that.loadRoles();
                        oModel.setProperty("/selectedRole", null);
                    })
                    .catch(error => {
                        MessageToast.show("Error: " + error.message);
                    });
                }
            }
        });
    },

    onActivateRole: function() {
        var oModel = this.getView().getModel("roles");
        var oSelectedRole = oModel.getProperty("/selectedRole");
        var that = this;

        if (!oSelectedRole || !oSelectedRole.ROLEID) {
            MessageToast.show("Selecciona un rol para activar.");
            return;
        }

        MessageBox.confirm("¿Estás seguro de que deseas activar este rol?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function(oAction) {
                if (oAction === MessageBox.Action.YES) {
                    fetch("http://localhost:3020/api/security/activaterole", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ roleid: oSelectedRole.ROLEID })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error("No se pudo activar el rol");
                        return response.json();
                    })
                    .then(data => {
                        MessageToast.show("Rol activado correctamente");
                        that.loadRoles();
                        oModel.setProperty("/selectedRole", null);
                    })
                    .catch(error => {
                        MessageToast.show("Error: " + error.message);
                    });
                }
            }
        });
    },
    
    onMultiSearch: function(oEvent) {
        var sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query");
        var oTable = this.byId("rolesTable");
        var oBinding = oTable.getBinding("rows");

        // Función para quitar acentos y pasar a minúsculas
        function normalize(str) {
            return (str || "")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
        }

        if (sQuery && sQuery.length > 0) {
            var sNormalizedQuery = normalize(sQuery);
            oBinding.filter([new Filter({
                path: "ROLENAME",
                operator: FilterOperator.Contains,
                value1: sQuery,
                // Filtro personalizado
                test: function(value) {
                    return normalize(value).includes(sNormalizedQuery);
                }
            })]);
        } else {
            oBinding.filter([]);
        }
    },
  });
});
