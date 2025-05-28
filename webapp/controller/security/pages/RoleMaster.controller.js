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

  return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.RoleMaster", {


        onInit: function () {
      //cargar los roles
      this.loadRoles();
      this.loadProcess();
      this.loadPrivilegios();
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

        if (!sProcessId || aPrivilegeIds.length === 0) {
            // @ts-ignore
            sap.m.MessageToast.show("Selecciona un proceso y al menos un privilegio.");
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

    onSave: function () {
        var oView = this.getView();
        var oModel = oView.getModel("newRoleModel");

        // Obtener los valores del modelo
        var sUserId = oModel.getProperty("/USERID");
        var sPassword = oModel.getProperty("/PASSWORD");
        var sFirstName = oModel.getProperty("/FIRSTNAME");
        var sLastName = oModel.getProperty("/LASTNAME");
        var sEmail = oModel.getProperty("/EMAIL");
        var sCompanyId = oModel.getProperty("/COMPANYID");
        var sCediId = oModel.getProperty("/CEDIID");
        var sDepartment = oModel.getProperty("/DEPARTMENT");

        // Construir el objeto de datos del usuario
        var oUserData = {
            USERID: sUserId,
            PASSWORD: sPassword,
            FIRSTNAME: sFirstName,
            LASTNAME: sLastName,
            EMAIL: sEmail,
            COMPANYID: sCompanyId,
            CEDIID: sCediId,
            DEPARTMENT: sDepartment
        };

        // Validaciones básicas (puedes agregar más)
        if (!sUserId || !sPassword || !sFirstName || !sLastName || !sEmail || !sCompanyId || !sCediId|| !sDepartment) {
            MessageToast.show("Por favor, completa todos los campos obligatorios.");
            return;
        }

        console.log("Data to be sent:", JSON.stringify({user:oUserData}));

        // Realizar la solicitud a la API para crear el usuario
        var sUrl = "http://localhost:3020/api/security/createuser";
        fetch(sUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({user:oUserData})
        })
        .then(function (response) {
            BusyIndicator.hide(); // Ocultar indicador de carga
            if (!response.ok) {
                console.log("Data to be sent:", JSON.stringify({user:oUserData}))
                throw new Error("Error al crear el usuario");
            }
            return response.json();
        })
        .then(function (data) {
            // Mostrar mensaje de éxito
            MessageToast.show("Usuario creado correctamente");
            // Navegar a la vista de tabla
            this.getRouter().navTo("RouteSecurityTable");
        }.bind(this))
        .catch(function (error) {
            BusyIndicator.hide(); // Ocultar indicador de carga
            MessageToast.show("Error: " + error.message);
        });
    },
  });
});
