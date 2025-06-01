sap.ui.define(
  [
    "com/inv/sapfiroriwebinversion/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  function (
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
    return BaseController.extend(
      "com.inv.sapfiroriwebinversion.controller.security.pages.RoleMaster",
      {
        onInit: function () {
          //llamamos a la funcion para cargar todo lo que ocupemos en esta vista
          this.loadStart();
        },

        loadStart: function () {
          // Cargar los roles al iniciar
          this.loadRoles();
          // Cargar los procesos
          this.loadProcess();
          // Cargar los privilegios
          this.loadPrivilegios();
        },

        //funcion para cargar los roles
        loadRoles: function () {
          var oModel = new JSONModel(); //se crea un nuevo modelo JSON
          this.getView().setModel(oModel, "roles"); // se asigna el modelo a la vista

          fetch("http://localhost:3020/api/security/roles", {
            // se hace una peticion al backend
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              //verificamos si la respuesta es correcta
              if (!response.ok) throw new Error("Error al obtener roles"); // si no es correcta, lanzamos un error
              return response.json(); //si si es correcta, convertimos la respuesta a JSON
            })
            .then((data) => {
              //asignamos los datos al modelo

              oModel.setData({ value: data.value });
              console.log(oModel);
            })
            .catch((error) => {
              //esto es por si hay un error en cualquier parte del fetch
              MessageToast.show("Error: " + error.message);
            });
        },

        onRoleSelected: function (oEvent) {
          var oContext = oEvent.getParameter("rowContext");

          var oData = oContext.getObject();
          var sRoleId = oData.ROLEID;
          var that = this;

          // Llama a tu backend para obtener el detalle del rol
          fetch(
            "http://localhost:3020/api/security/roles?roleid=" +
              encodeURIComponent(sRoleId),
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          )
            .then((response) => {
              if (!response.ok)
                throw new Error("No se pudo obtener el detalle del rol");
              return response.json();
            })
            .then((data) => {
              var oRoleDetail = data.value[0];
              this.getView()
                .getModel("roles")
                .setProperty("/selectedRole", oRoleDetail);
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });
        },

        loadProcess: function () {
          var oProcessModel = new JSONModel();
          this.getView().setModel(oProcessModel, "processes");

          fetch("http://localhost:3020/api/security/catalogs", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              if (!response.ok) throw new Error("Error al obtener procesos");
              return response.json();
            })
            .then((data) => {
              // Guarda todos los procesos en memoria
              var allProcesos = data.value.flatMap((catalog) => catalog.VALUES);
              this._allProcesos = allProcesos; // <-- Aquí los guardas

              // Inicialmente, el modelo de procesos está vacío hasta que se seleccione una app
              oProcessModel.setData({ value: [] });

              // También llena el modelo de apps como ya lo haces
              var labelMap = {
                "IdProcesses": "Procesos",
                "IdPrivileges": "Privilegios",
                "IdViews": "Vistas",
                "IdApplications": "Aplicaciones",
                "IdCompanies": "Compañías"
              };
              var allLabelIds = data.value.flatMap((catalog) =>
                catalog.VALUES.map((proc) => proc.LABELID)
              );
              var uniqueLabelIds = Array.from(new Set(allLabelIds));
              var appItems = uniqueLabelIds
                .filter((id) => labelMap[id])
                .map((id) => ({ LABELID: id, LABEL: labelMap[id] }));

              var oAppModel = new JSONModel({ value: appItems });
              this.getView().setModel(oAppModel, "apps");
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });
        },

        loadPrivilegios: function () {
          // Creo un nuevo modelo JSON vacío para guardar los privilegios
          var oProcessModel = new JSONModel();
          // Asigno este modelo a la vista bajo el nombre "privilegios"
          this.getView().setModel(oProcessModel, "privilegios");

          // Hago una petición al backend para obtener la lista de privilegios
          fetch(
            "http://localhost:3020/api/security/catalogs?labelid=IdPrivileges",
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          )
            .then((response) => {
              // Si la respuesta no es exitosa, lanzo un error
              if (!response.ok) throw new Error("Error al obtener procesos");
              return response.json();
            })
            .then((data) => {
              // Guardo los privilegios en una propiedad del controlador (por si los necesito después)
              this.Privilegios = data.value[0].VALUES;
              // Asigno los privilegios al modelo para que se muestren en la vista
              oProcessModel.setData({ value: data.value[0].VALUES });
            })
            .catch((error) => {
              // Si ocurre un error, muestro el mensaje correspondiente
              MessageToast.show("Error: " + error.message);
            });
        },

        // abrir el modal para crear un nuevo rol
        // Abre el diálogo (modal) para crear un nuevo rol
        onOpenDialog: function () {
          // Primero obtengo la vista actual de SAPUI5
          var oView = this.getView();

          // Luego creo un modelo JSON vacío para el nuevo rol.
          // Así, cuando se abra el formulario, todos los campos estarán en blanco.
          var oNewRoleModel = new sap.ui.model.json.JSONModel({
            ROLEID: "", // El ID del rol, vacío porque es nuevo
            ROLENAME: "", // El nombre del rol, vacío
            DESCRIPTION: "", // La descripción, vacía
            APP: "", // La aplicación seleccionada, vacío
            NEW_PROCESSID: "", // El proceso seleccionado para agregar privilegios, vacío
            NEW_PRIVILEGES: [], // Los privilegios seleccionados para agregar, vacío
            PRIVILEGES: [], // La lista de privilegios agregados, vacía
          });

          // Ahora reviso si ya he creado antes el diálogo para agregar rol
          if (!this._oCreateRoleDialog) {
            // Si no existe, lo cargo usando un fragmento XML
            Fragment.load({
              id: oView.getId(), // Uso el ID de la vista para el fragmento
              name: "com.inv.sapfiroriwebinversion.view.security.components.AddRoleDialog", // Le indico la ruta del fragmento
              controller: this, // Le paso este mismo controlador
            }).then((oDialog) => {
              // Cuando el fragmento está listo, lo guardo en una variable para reutilizarlo después
              this._oCreateRoleDialog = oDialog;
              // Hago que el diálogo dependa de la vista, así SAPUI5 lo gestiona correctamente
              oView.addDependent(oDialog);

              // Asigno el modelo vacío tanto al diálogo como a la vista, así los campos aparecen limpios
              this._oCreateRoleDialog.setModel(oNewRoleModel, "newRoleModel");
              oView.setModel(oNewRoleModel, "newRoleModel");

              // Finalmente, abro el diálogo para que el usuario lo vea
              this._oCreateRoleDialog.open();
            });
          } else {
            // Si el diálogo ya existe, simplemente le asigno el modelo vacío para limpiar los campos
            this._oCreateRoleDialog.setModel(oNewRoleModel, "newRoleModel");
            oView.setModel(oNewRoleModel, "newRoleModel");

            // Y abro el diálogo
            this._oCreateRoleDialog.open();
          }
        },

        // funcion para los botones de cerrar
        onDialogClose: function (oEvent) {
          // Obtengo el botón que disparó el evento (por ejemplo, el botón "Cancelar" o "Cerrar")
          var oButton = oEvent.getSource();
          // Obtengo el diálogo (modal) al que pertenece ese botón
          var oDialog = oButton.getParent();
          // Cierro el diálogo para que desaparezca de la pantalla
          oDialog.close();
        },

        onDeleteRole: function () {
          // Obtengo el modelo de roles de la vista
          var oModel = this.getView().getModel("roles");
          // Obtengo el rol que el usuario seleccionó para eliminar
          var oSelectedRole = oModel.getProperty("/selectedRole");
          // Guardo la referencia al controlador para usar dentro de funciones anidadas
          var that = this;

          // Si no hay ningún rol seleccionado, muestro un mensaje y salgo de la función
          if (!oSelectedRole || !oSelectedRole.ROLEID) {
            MessageToast.show("Selecciona un rol para eliminar.");
            return;
          }

          // Pido confirmación al usuario antes de eliminar el rol
          MessageBox.confirm("¿Estás seguro de que deseas eliminar este rol?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (oAction) {
              // Si el usuario confirma (elige "YES")
              if (oAction === MessageBox.Action.YES) {
                // Hago la petición al backend para eliminar el rol
                fetch("http://localhost:3020/api/security/deleteroles", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roleid: oSelectedRole.ROLEID }), // Envío el ID del rol a eliminar
                })
                  .then((response) => {
                    // Si la respuesta no es exitosa, lanzo un error
                    if (!response.ok)
                      throw new Error("No se pudo eliminar el rol");
                    return response.json();
                  })
                  .then((data) => {
                    // Si todo sale bien, muestro mensaje de éxito
                    MessageToast.show("Rol eliminado correctamente");
                    // Recargo la lista de roles para que se actualice la vista
                    that.loadRoles();
                    // Limpio la selección de rol
                    oModel.setProperty("/selectedRole", null);
                  })
                  .catch((error) => {
                    // Si ocurre un error, muestro el mensaje correspondiente
                    MessageToast.show("Error: " + error.message);
                  });
              }
            },
          });
        },

        onActivateRole: function () {
          // Obtengo el modelo de roles de la vista
          var oModel = this.getView().getModel("roles");
          // Obtengo el rol que el usuario seleccionó para activar
          var oSelectedRole = oModel.getProperty("/selectedRole");
          // Guardo la referencia al controlador para usar dentro de funciones anidadas
          var that = this;

          // Si no hay ningún rol seleccionado, muestro un mensaje y salgo de la función
          if (!oSelectedRole || !oSelectedRole.ROLEID) {
            MessageToast.show("Selecciona un rol para activar.");
            return;
          }

          // Pido confirmación al usuario antes de activar el rol
          MessageBox.confirm("¿Estás seguro de que deseas activar este rol?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (oAction) {
              // Si el usuario confirma (elige "YES")
              if (oAction === MessageBox.Action.YES) {
                // Hago la petición al backend para activar el rol
                fetch("http://localhost:3020/api/security/activaterole", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roleid: oSelectedRole.ROLEID }), // Envío el ID del rol a activar
                })
                  .then((response) => {
                    // Si la respuesta no es exitosa, lanzo un error
                    if (!response.ok)
                      throw new Error("No se pudo activar el rol");
                    return response.json();
                  })
                  .then((data) => {
                    // Si todo sale bien, muestro mensaje de éxito
                    MessageToast.show("Rol activado correctamente");
                    // Recargo la lista de roles para que se actualice la vista
                    that.loadRoles();
                    // Limpio la selección de rol
                    oModel.setProperty("/selectedRole", null);
                  })
                  .catch((error) => {
                    // Si ocurre un error, muestro el mensaje correspondiente
                    MessageToast.show("Error: " + error.message);
                  });
              }
            },
          });
        },

        onMultiSearch: function (oEvent) {
          // Obtengo el texto que el usuario escribió en el campo de búsqueda
          var sQuery =
            oEvent.getParameter("newValue") || oEvent.getParameter("query");
          // Obtengo la tabla de roles por su ID
          var oTable = this.byId("rolesTable");
          // Obtengo el binding de las filas de la tabla (para poder filtrar)
          var oBinding = oTable.getBinding("rows");

          // Defino una función para normalizar el texto (quitar acentos y pasar a minúsculas)
          function normalize(str) {
            return (str || "")
              .toString()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
          }

          // Si el usuario escribió algo en la búsqueda
          if (sQuery && sQuery.length > 0) {
            // Normalizo el texto de búsqueda
            var sNormalizedQuery = normalize(sQuery);
            // Aplico un filtro personalizado sobre el nombre del rol
            oBinding.filter([
              new Filter({
                path: "ROLENAME",
                operator: FilterOperator.Contains,
                value1: sQuery,
                // Esta función compara el texto normalizado para que la búsqueda ignore acentos y mayúsculas/minúsculas
                test: function (value) {
                  return normalize(value).includes(sNormalizedQuery);
                },
              }),
            ]);
          } else {
            // Si el campo de búsqueda está vacío, quito todos los filtros y muestro todos los roles
            oBinding.filter([]);
          }
        },

        onAddPrivilege: function () {
          var oView = this.getView();
          var oModel = oView.getModel("newRoleModel");

          // Obtener el proceso y privilegios seleccionados
          var sProcessId = oModel.getProperty("/NEW_PROCESSID");
          var aPrivilegeIds = oModel.getProperty("/NEW_PRIVILEGES") || [];

          // Obtener la aplicación seleccionada del ComboBox
          var oAppCombo = oView.byId("_IDGenComboBox");
          var sAppId = oAppCombo.getSelectedKey();
          var sAppName = oAppCombo.getSelectedItem() ? oAppCombo.getSelectedItem().getText() : "";

          // Validación
          if (!sAppId || !sProcessId || aPrivilegeIds.length === 0) {
            MessageToast.show("Selecciona una aplicación, un proceso y al menos un privilegio.");
            return;
          }

          // Buscar el texto del proceso seleccionado
          var aProcesses = oView.getModel("processes").getProperty("/value") || [];
          var oProcess = aProcesses.find((p) => p.VALUEID === sProcessId);
          var sProcessText = oProcess
            ? oProcess.VALUE + (oProcess.VALUEPAID ? " - " + oProcess.VALUEPAID : "")
            : sProcessId;

          // Buscar los textos de los privilegios seleccionados
          var aPrivilegios = oView.getModel("privilegios").getProperty("/value") || [];
          var aPrivilegeTexts = aPrivilegeIds.map((pid) => {
            var p = aPrivilegios.find((pr) => pr.VALUEID === pid);
            return p ? p.VALUE : pid;
          });

          // Armar el objeto que representa la relación app-proceso-privilegios
          var oNewEntry = {
            APPID: sAppId,
            APPNAME: sAppName, // <--- Aquí guardas el nombre de la app
            PROCESSID: sProcessId,
            PROCESSNAME: sProcessText,
            PRIVILEGEID: aPrivilegeIds,
            PRIVILEGENAMES: aPrivilegeTexts,
          };

          // Agregar este objeto a la lista de privilegios del modelo
          var aPrivileges = oModel.getProperty("/PRIVILEGES") || [];
          aPrivileges.push(oNewEntry);
          oModel.setProperty("/PRIVILEGES", aPrivileges.slice());

          // Limpiar los campos de selección
          oModel.setProperty("/NEW_APPID", "");
          oModel.setProperty("/NEW_PROCESSID", "");
          oModel.setProperty("/NEW_PRIVILEGES", []);
        },

        onSaveRole: function (oEvent) {
          var oButton = oEvent.getSource();
          var oDialog = oButton.getParent();
          var oModel = oDialog.getModel("newRoleModel");

          if (!oModel) {
            MessageToast.show("No se encontró el modelo newRoleModel.");
            return;
          }

          var oRoleData = oModel.getData();

          // Prepara la lista de privilegios para enviar solo los IDs
          var aPrivileges = (oRoleData.PRIVILEGES || []).map(function (p) {
            return {
              PROCESSID: p.PROCESSID,
              PRIVILEGEID: p.PRIVILEGEID,
            };
          });

          // Toma la aplicación seleccionada (ID)
          var sAppId = oRoleData.NEW_APPID || (oRoleData.PRIVILEGES && oRoleData.PRIVILEGES[0] && oRoleData.PRIVILEGES[0].APPID) || "";

          // Arma el objeto final para enviar al backend
          var oPayload = {
            ROLEID: oRoleData.ROLEID,
            ROLENAME: oRoleData.ROLENAME,
            DESCRIPTION: oRoleData.DESCRIPTION,
            APP: sAppId, // <-- Aquí guardas la aplicación seleccionada
            PRIVILEGES: aPrivileges,
          };

          fetch("http://localhost:3020/api/security/createrole", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: oPayload }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("No se pudo crear el rol");
              return response.json();
            })
            .then((data) => {
              MessageToast.show("Rol creado correctamente");
              oDialog.close();
              this.loadRoles();
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });
        },

        onEditUser: function () {
          // Obtengo la vista actual
          var oView = this.getView();
          // Obtengo la tabla de roles por su ID
          var oTable = this.byId("rolesTable");
          // Obtengo el contexto (los datos) del rol seleccionado en la tabla
          var oContext = oTable.getContextByIndex(oTable.getSelectedIndex());

          // Si no hay ningún rol seleccionado, muestro un mensaje y salgo
          if (!oContext) {
            MessageToast.show("Selecciona un rol para editar.");
            return;
          }

          // Obtengo los datos del rol seleccionado
          var oRoleData = oContext.getObject();

          // Creo el modelo para el diálogo de edición, copiando los datos del rol y dejando campos de privilegios vacíos para agregar nuevos
          var oRoleDialogModel = new sap.ui.model.json.JSONModel(
            Object.assign({}, oRoleData, {
              NEW_PROCESSID: "",
              NEW_PRIVILEGES: [],
              PRIVILEGES: oRoleData.PRIVILEGES || [],
              IS_EDIT: true, // Para saber que estoy editando
            })
          );

          // Si el diálogo de edición no existe, lo cargo usando un fragmento XML
          if (!this._oEditRoleDialog) {
            sap.ui.core.Fragment.load({
              id: oView.getId(),
              name: "com.inv.sapfiroriwebinversion.view.security.components.EditRoleDialog",
              controller: this,
            }).then(
              function (oDialog) {
                // Guardo el diálogo para reutilizarlo después
                this._oEditRoleDialog = oDialog;
                // Hago que el diálogo dependa de la vista
                oView.addDependent(oDialog);
                // Asigno el modelo con los datos del rol al diálogo
                oDialog.setModel(oRoleDialogModel, "roleDialogModel");
                // Abro el diálogo para que el usuario edite el rol
                oDialog.open();
              }.bind(this)
            );
          } else {
            // Si el diálogo ya existe, solo le asigno el modelo y lo abro
            this._oEditRoleDialog.setModel(oRoleDialogModel, "roleDialogModel");
            this._oEditRoleDialog.open();
          }
        },

        onRemovePrivilege: function (oEvent) {
          var oItem = oEvent.getSource().getParent();
          // Intenta obtener el contexto de roleDialogModel (edición)
          var oContext = oItem.getBindingContext("roleDialogModel");
          // Si no existe, intenta con newRoleModel (alta)
          if (!oContext) {
            oContext = oItem.getBindingContext("newRoleModel");
          }
          if (!oContext) {
            MessageToast.show("No se pudo obtener el contexto del privilegio.");
            return;
          }
          var iIndex = oContext.getPath().split("/").pop();
          var oModel = oContext.getModel();
          var aPrivileges = oModel.getProperty("/PRIVILEGES");

          MessageBox.confirm("¿Deseas eliminar este privilegio?", {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction === sap.m.MessageBox.Action.YES) {
                aPrivileges.splice(iIndex, 1);
                oModel.setProperty("/PRIVILEGES", aPrivileges.slice());
                MessageToast.show("Privilegio eliminado.");
              }
            }
          });
        },

        onSaveRoleEdit: function (oEvent) {
          // Obtengo el botón que disparó el evento (por ejemplo, el botón "Guardar")
          var oButton = oEvent.getSource();
          // Obtengo el diálogo (modal) donde está el formulario de edición
          var oDialog = oButton.getParent();
          // Obtengo el modelo con los datos del rol que estoy editando
          var oModel = oDialog.getModel("roleDialogModel");

          // Si por alguna razón no encuentro el modelo, muestro un mensaje y salgo
          if (!oModel) {
            MessageToast.show("No se encontró el modelo roleDialogModel.");
            return;
          }

          // Obtengo todos los datos del formulario de edición
          var oRoleData = oModel.getData();

          // Preparo la lista de privilegios para enviarla al backend (solo los campos necesarios)
          var aPrivileges = (oRoleData.PRIVILEGES || []).map(function (p) {
            return {
              PROCESSID: p.PROCESSID,
              PRIVILEGEID: p.PRIVILEGEID,
            };
          });

          // Armo el objeto final que voy a enviar al backend
          var oPayload = {
            ROLEID: oRoleData.ROLEID,
            ROLENAME: oRoleData.ROLENAME,
            DESCRIPTION: oRoleData.DESCRIPTION,
            PRIVILEGES: aPrivileges,
          };

          // Hago la petición al backend para actualizar el rol
          fetch(
            "http://localhost:3020/api/security/updaterole?roleid=" +
              encodeURIComponent(oPayload.ROLEID),
            {
              method: "POST", // El backend espera POST
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: oPayload }),
            }
          )
            .then((response) => {
              // Si la respuesta no es exitosa, lanzo un error
              if (!response.ok) throw new Error("No se pudo actualizar el rol");
              return response.json();
            })
            .then((data) => {
              // Si todo sale bien, muestro mensaje de éxito
              MessageToast.show("Rol actualizado correctamente");
              // Cierro el diálogo
              oDialog.close();
              // Recargo la lista de roles para que se vea el cambio en la tabla
              this.loadRoles();
            })
            .catch((error) => {
              // Si ocurre un error, muestro el mensaje correspondiente
              MessageToast.show("Error: " + error.message);
            });
        },

        onAddPrivilegeEdit: function (oEvent) {
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
            MessageToast.show(
              "Selecciona un proceso y al menos un privilegio."
            );
            return;
          }

          // Busca el texto del proceso
          var aProcesses = oProcessesModel.getProperty("/value") || [];
          var oProcess = aProcesses.find((p) => p.VALUEID === sProcessId);
          var sProcessText = oProcess
            ? oProcess.VALUE +
              (oProcess.VALUEPAID ? " - " + oProcess.VALUEPAID : "")
            : sProcessId;

          // Busca los textos de los privilegios
          var aPrivilegios = oPrivilegiosModel.getProperty("/value") || [];
          var aPrivilegeTexts = aPrivilegeIds.map((pid) => {
            var p = aPrivilegios.find((pr) => pr.VALUEID === pid);
            return p ? p.VALUE : pid;
          });

          // Construye el objeto a agregar
          var oNewEntry = {
            PROCESSID: sProcessId,
            PROCESSNAME: sProcessText,
            PRIVILEGEID: aPrivilegeIds,
            PRIVILEGENAMES: aPrivilegeTexts,
          };

          // Agrega a la lista de privilegios del modelo de edición
          var aPrivileges = oModel.getProperty("/PRIVILEGES") || [];
          aPrivileges.push(oNewEntry);
          oModel.setProperty("/PRIVILEGES", aPrivileges.slice());

          // Limpia los campos de selección para que pueda agregar otra relación si quiero
          oModel.setProperty("/NEW_PROCESSID", "");
          oModel.setProperty("/NEW_PRIVILEGES", []);
        }, // <-- cierre correcto de la función
        onAppChange: function (oEvent) {
          var sSelectedLabelId = oEvent.getSource().getSelectedKey();
          // Filtra los procesos cuyo LABELID coincide con la app seleccionada
          var aFilteredProcesos = (this._allProcesos || []).filter(function (proc) {
            return proc.LABELID === sSelectedLabelId;
          });
          // Actualiza el modelo de procesos
          var oProcessModel = this.getView().getModel("processes");
          oProcessModel.setData({ value: aFilteredProcesos });
          // Limpia la selección previa de proceso si es necesario
          var oNewRoleModel = this.getView().getModel("newRoleModel");
          if (oNewRoleModel) {
            oNewRoleModel.setProperty("/NEW_PROCESSID", "");
          }
        },
      }
    );
  }
);
