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
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  Log,
  MessageToast,
  MessageBox,
  Filter,
  FilterOperator,
  Fragment
) {
  "use strict";
 //extendemos el controlador base para roles
  return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.RoleMaster", {


        onInit: function () {
            //llamamos a la funcion para cargar todo lo que ocupemos en esta vista
            this.loadStart();
    },

    loadStart: function (){
        // Cargar los roles al iniciar
        this.loadRoles();
        // Cargar los procesos
        this.loadProcess();
        // Cargar los privilegios
        this.loadPrivilegios();
    },
    //funcion para cargar los roles
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

        var oData = oContext.getObject();
        var sRoleId = oData.ROLEID;
        var that = this;

        // Llama a tu backend para obtener el detalle del rol
        fetch("http://localhost:3020/api/security/roles?roleid=" + encodeURIComponent(sRoleId), {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) throw new Error("No se pudo obtener el detalle del rol");
            return response.json();
        })
        .then(data => {
            var oRoleDetail = data.value[0];
            this.getView().getModel("roles").setProperty("/selectedRole", oRoleDetail);
        })
        .catch(error => {
            MessageToast.show("Error: " + error.message);
        });       
    },   
    

    loadProcess: function() {
        var oProcessModel = new JSONModel();
        this.getView().setModel(oProcessModel, "processes");

        fetch("http://localhost:3020/api/security/catalogs?labelid=IdProcesses", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener procesos");
            return response.json();
        })
         .then(data => {
            this.Procesos = data.value[0].VALUES;
            oProcessModel.setData({ value: data.value[0].VALUES });
        })
        .catch(error => {
            MessageToast.show("Error: " + error.message);
        });
    },

        loadPrivilegios: function() {
        var oProcessModel = new JSONModel();
        this.getView().setModel(oProcessModel, "privilegios");

        fetch("http://localhost:3020/api/security/catalogs?labelid=IdPrivileges", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener procesos");
            return response.json();
        })
        .then(data => {
            this.Privilegios = data.value[0].VALUES;
            oProcessModel.setData({ value: data.value[0].VALUES });
        })
        .catch(error => {
            MessageToast.show("Error: " + error.message);
        });
    },

    // abrir el modal para usuarios
    onOpenDialog:function(){
      var oView = this.getView();

      // Crea el modelo SOLO si no existe
      var oNewRoleModel = new sap.ui.model.json.JSONModel({
          ROLEID: "",
          ROLENAME: "",
          DESCRIPTION: "",
          NEW_PROCESSID: "",
          NEW_PRIVILEGES: [],
          PRIVILEGES: []
      });

      if (!this._oCreateRoleDialog) {
          Fragment.load({
              id: oView.getId(),
              name: "com.inv.sapfiroriwebinversion.view.security.components.AddRoleDialog",
              controller: this
          }).then(oDialog => {
              this._oCreateRoleDialog = oDialog;
              oView.addDependent(oDialog);

              // ASIGNA el modelo al diálogo y a la vista
              this._oCreateRoleDialog.setModel(oNewRoleModel, "newRoleModel");
              oView.setModel(oNewRoleModel, "newRoleModel");

              this._oCreateRoleDialog.open();
          });
      } else {
          // Reasigna el modelo cada vez que abras el diálogo
          this._oCreateRoleDialog.setModel(oNewRoleModel, "newRoleModel");
          oView.setModel(oNewRoleModel, "newRoleModel");

          this._oCreateRoleDialog.open();
      }
    },

    // abrir el modal para editar
    
    onDialogClose: function(oEvent) {
    var oButton = oEvent.getSource();
    var oDialog = oButton.getParent();
    oDialog.close();
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
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
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
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
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

    onAddPrivilege: function() {
        var oView = this.getView();
        var oModel = oView.getModel("newRoleModel");

        // Obtener los valores seleccionados
        var sProcessId = oModel.getProperty("/NEW_PROCESSID");
        var aPrivilegeIds = oModel.getProperty("/NEW_PRIVILEGES") || [];

        // Mostrar en consola lo seleccionado
        console.log("Proceso seleccionado:", sProcessId);
        console.log("Privilegios seleccionados:", aPrivilegeIds);

        if (!sProcessId || aPrivilegeIds.length === 0) {
            MessageToast.show("Selecciona un proceso y al menos un privilegio.");
            return;
        }

        // Obtener el texto del proceso
        var aProcesses = oView.getModel("processes").getProperty("/value") || [];
        var oProcess = aProcesses.find(p => p.VALUEID === sProcessId);
        var sProcessText = oProcess ? (oProcess.VALUE + (oProcess.VALUEPAID ? " - " + oProcess.VALUEPAID : "")) : sProcessId;

        // Obtener los textos de los privilegios
        var aPrivilegios = oView.getModel("privilegios").getProperty("/value") || [];
        var aPrivilegeTexts = aPrivilegeIds.map(pid => {
            var p = aPrivilegios.find(pr => pr.VALUEID === pid);
            return p ? p.VALUE : pid;
        });

        // Construir el objeto a agregar
        var oNewEntry = {
            PROCESSID: sProcessId,
            PROCESSNAME: sProcessText, // <-- TEXTO DEL PROCESO
            PRIVILEGEID: aPrivilegeIds,
            PRIVILEGENAMES: aPrivilegeTexts // <-- TEXTOS DE PRIVILEGIOS
        };

        // Agregar a la lista
        var aPrivileges = oModel.getProperty("/PRIVILEGES") || [];
        aPrivileges.push(oNewEntry);
        oModel.setProperty("/PRIVILEGES", aPrivileges.slice()); // .slice() para refrescar el binding

        // Limpiar los combos para la siguiente selección
        oModel.setProperty("/NEW_PROCESSID", "");
        oModel.setProperty("/NEW_PRIVILEGES", []);
    },

    onSaveRole: function(oEvent) {
        var oButton = oEvent.getSource();
        var oDialog = oButton.getParent();
        var oModel = oDialog.getModel("newRoleModel");

        if (!oModel) {
            // @ts-ignore
            sap.m.MessageToast.show("No se encontró el modelo newRoleModel.");
            return;
        }

        var oRoleData = oModel.getData();

        // Transforma los privilegios para enviar solo los campos requeridos
        var aPrivileges = (oRoleData.PRIVILEGES || []).map(function(p) {
            return {
                PROCESSID: p.PROCESSID,
                PRIVILEGEID: p.PRIVILEGEID
            };
        });

        var oPayload = {
            ROLEID: oRoleData.ROLEID,
            ROLENAME: oRoleData.ROLENAME,
            DESCRIPTION: oRoleData.DESCRIPTION,
            PRIVILEGES: aPrivileges
        };

        fetch("http://localhost:3020/api/security/createrole", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: oPayload })
        })
        .then(response => {
            if (!response.ok) throw new Error("No se pudo crear el rol");
            return response.json();
        })
        // @ts-ignore
        .then(data => {
            // @ts-ignore
            sap.m.MessageToast.show("Rol creado correctamente");
            oDialog.close();
            this.loadRoles();
        })
        .catch(error => {
            // @ts-ignore
            sap.m.MessageToast.show("Error: " + error.message);
        });
    },

    onEditUser: function() {
        var oView = this.getView();
        var oTable = this.byId("rolesTable");
        var oContext = oTable.getContextByIndex(oTable.getSelectedIndex());

        if (!oContext) {
            MessageToast.show("Selecciona un rol para editar.");
            return;
        }

        // Obtén los datos del rol seleccionado
        var oRoleData = oContext.getObject();

        // Crea el modelo para el diálogo de edición
        var oRoleDialogModel = new sap.ui.model.json.JSONModel(Object.assign({}, oRoleData, {
            NEW_PROCESSID: "",
            NEW_PRIVILEGES: [],
            PRIVILEGES: oRoleData.PRIVILEGES || [],
            IS_EDIT: true // Para saber que es edición
        }));

        // Carga el fragmento si no existe
        if (!this._oEditRoleDialog) {
            sap.ui.core.Fragment.load({
                id: oView.getId(),
                name: "com.inv.sapfiroriwebinversion.view.security.components.EditRoleDialog",
                controller: this
            }).then(function(oDialog) {
                this._oEditRoleDialog = oDialog;
                oView.addDependent(oDialog);
                oDialog.setModel(oRoleDialogModel, "roleDialogModel");
                oDialog.open();
            }.bind(this));
        } else {
            this._oEditRoleDialog.setModel(oRoleDialogModel, "roleDialogModel");
            this._oEditRoleDialog.open();
        }
    },

    onRemovePrivilege: function(oEvent) {
        var oItem = oEvent.getSource().getParent();
        var oContext = oItem.getBindingContext("roleDialogModel");
        var iIndex = oContext.getPath().split("/").pop();
        var oModel = oContext.getModel();
        var aPrivileges = oModel.getProperty("/PRIVILEGES");

        MessageBox.confirm("¿Deseas eliminar este privilegio?", {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    aPrivileges.splice(iIndex, 1);
                    oModel.setProperty("/PRIVILEGES", aPrivileges.slice());
                    MessageToast.show("Privilegio eliminado.");
                }
            }
        });
    },

    onSaveRoleEdit: function(oEvent) {
        var oButton = oEvent.getSource();
        var oDialog = oButton.getParent();
        var oModel = oDialog.getModel("roleDialogModel");

        if (!oModel) {
            MessageToast.show("No se encontró el modelo roleDialogModel.");
            return;
        }

        var oRoleData = oModel.getData();

        // Prepara el payload solo con los campos requeridos por el backend
        var aPrivileges = (oRoleData.PRIVILEGES || []).map(function(p) {
            return {
                PROCESSID: p.PROCESSID,
                PRIVILEGEID: p.PRIVILEGEID
            };
        });

        var oPayload = {
            ROLEID: oRoleData.ROLEID,
            ROLENAME: oRoleData.ROLENAME,
            DESCRIPTION: oRoleData.DESCRIPTION,
            PRIVILEGES: aPrivileges
        };

        fetch("http://localhost:3020/api/security/updaterole?roleid=" + encodeURIComponent(oPayload.ROLEID), {
            method: "POST", // Tu servicio espera POST
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: oPayload })
        })
        .then(response => {
            if (!response.ok) throw new Error("No se pudo actualizar el rol");
            return response.json();
        })
        .then(data => {
            MessageToast.show("Rol actualizado correctamente");
            oDialog.close();
            this.loadRoles(); // Recarga la tabla de roles
        })
        .catch(error => {
            MessageToast.show("Error: " + error.message);
        });
    },

    onAddPrivilegeEdit: function(oEvent) {
        // Obtén el botón y el diálogo
        var oButton = oEvent.getSource();
        var oDialog = oButton.getParent();
        var oModel = oDialog.getModel("roleDialogModel");
        var oProcessesModel = oDialog.getModel("processes");
        var oPrivilegiosModel = oDialog.getModel("privilegios");

        if (!oModel) {
            MessageToast.show("No se encontró el modelo roleDialogModel.");
            return;
        }

        // Lee los valores seleccionados
        var sProcessId = oModel.getProperty("/NEW_PROCESSID");
        var aPrivilegeIds = oModel.getProperty("/NEW_PRIVILEGES") || [];

        // Mostrar en consola lo seleccionado
        console.log("Proceso seleccionado (edit):", sProcessId);
        console.log("Privilegios seleccionados (edit):", aPrivilegeIds);

        if (!sProcessId || aPrivilegeIds.length === 0) {
            MessageToast.show("Selecciona un proceso y al menos un privilegio.");
            return;
        }

        // Busca el texto del proceso
        var aProcesses = oProcessesModel.getProperty("/value") || [];
        var oProcess = aProcesses.find(p => p.VALUEID === sProcessId);
        var sProcessText = oProcess ? (oProcess.VALUE + (oProcess.VALUEPAID ? " - " + oProcess.VALUEPAID : "")) : sProcessId;

        // Busca los textos de los privilegios
        var aPrivilegios = oPrivilegiosModel.getProperty("/value") || [];
        var aPrivilegeTexts = aPrivilegeIds.map(pid => {
            var p = aPrivilegios.find(pr => pr.VALUEID === pid);
            return p ? p.VALUE : pid;
        });

        // Construye el objeto a agregar
        var oNewEntry = {
            PROCESSID: sProcessId,
            PROCESSNAME: sProcessText,
            PRIVILEGEID: aPrivilegeIds,
            PRIVILEGENAMES: aPrivilegeTexts
        };

        // Agrega a la lista de privilegios del modelo de edición
        var aPrivileges = oModel.getProperty("/PRIVILEGES") || [];
        aPrivileges.push(oNewEntry);
        oModel.setProperty("/PRIVILEGES", aPrivileges.slice());

        // Limpia los combos para la siguiente selección
        oModel.setProperty("/NEW_PROCESSID", "");
        oModel.setProperty("/NEW_PRIVILEGES", []);
    },

  });
});
