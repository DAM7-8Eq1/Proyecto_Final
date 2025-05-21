sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController",
    "sap/ui/model/json/JSONModel", 
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel,Fragment, BusyIndicator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.Security", {
        onInit: function () {
            var oViewModel = new JSONModel({
                buttonsEnabled: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            this.onCargarDatos();
        },

        onCargarDatos: function (){

            //Inicializar la tabla y el modelo Json
            const oTable = this.byId("IdTable1SecurityTable");
            const oModel = new JSONModel();

            // Construir la URL
            var sUrl = "http://localhost:3020/api/security/users";
            //realizar un fetch con la operacion GET
                fetch(sUrl, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                .then(function (response) {
                    if (!response.ok) {
                        // Manejar el error de autenticación
                        throw new Error("Error en la autenticación");
                    }
                    return response.json();
                })
                .then(function (data) {
                     // Manejar la respuesta de la API
                    // Aquí puedes procesar los datos recibidos y asignarlos al modelo
                   
                    data.value.forEach(user => {
                        user.ROLES = this.formatRoles(user.ROLES);
                    });
                    oModel.setData(data);
                    // Asignar el modelo a la tabla
                    oTable.setModel(oModel);
                }.bind(this))
                .catch(function (error) {
                   
                    // Manejar el error de la solicitud
                    MessageToast.show("Error: " + error.message);
                });
        },
        
        //Metodo para agregar a los roles un - entre ellos
        formatRoles: function (rolesArray) {
            return Array.isArray(rolesArray) 
                ? rolesArray.map(role => role.ROLEID).join("-") 
                : "";
                
        },

        //Metodo para obtener lo seleccionado cada que se selecciona la tabla
        onRowSelectionChange: function (oEvent) {
            // Obtener el elemento seleccionado
            var oSelectedItem = oEvent.getParameter("rowContext"); 

            //Verificar que se haya seleccionado un campo
            if (!oSelectedItem) {
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
                return;
            }

            // Obtiene los datos de la fila seleccionada 
            this.oData = oSelectedItem.getObject(); 
        
            //Activar los botones de acciones
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", true);
        },
        

//--------------------------------------------------------------------------------------------------------------------------------------
        //Funciones para crear un usuario    
        onCrearUsuario: function () {
            
            
             var oView = this.getView();

            if (!this._oCreateUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                     name: "com.inv.sapfiroriwebinversion.view.security.components.AddUserDialog",
                    controller: this
                }).then(oDialog => {
                    this._oCreateUserDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._oCreateUserDialog.open();
                });
            } else {
                this._oCreateUserDialog.open();
            }

        },

         //Funcion para agregar un rol a la lista

         //todavia no esta
    onAddRole: function (oEvent) {
       
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var sSelectedText = oComboBox.getSelectedItem().getText();

            var oVBox;
            // Este if valida si es la modal de add user o edit user en la que se estáran colocando los roles
            if (oComboBox.getId().includes("comboBoxEditRoles")) {
                oVBox = sap.ui.core.Fragment.byId(this.getView().getId(), "selectedEditRolesVBox");
            } else {
                oVBox = sap.ui.core.Fragment.byId(this.getView().getId(), "selectedRolesVBox");
            }
            // Validar duplicados
            var aItems = (oVBox && oVBox instanceof sap.m.VBox) ? oVBox.getItems() : [];
           
            var bExists = aItems.some(function(oItem) {
                return oItem.data("ROLENAME") === sSelectedKey;
            });
            
            if (bExists) {
                MessageToast.show("El rol ya ha sido añadido.");
                return;
            }

            // Crear item visual del rol seleccionado
            var oHBox = new sap.m.HBox({
                items: [
                    new sap.m.Label({ text: sSelectedText }).addStyleClass("sapUiSmallMarginEnd"),
                    // @ts-ignore
                    new sap.m.Button({
                        icon: "sap-icon://decline",
                        type: "Transparent",
                        press: () => oVBox.removeItem(oHBox)
                    })
                ]
            });
        
            oHBox.data("ROLENAME", sSelectedKey);
            if (oVBox && oVBox instanceof sap.m.VBox) {
                
                oVBox.addItem(oHBox);
            }
        },

        onGuardarUsuarioCreado:function(){
            var oView = this.getView();
            var oDialog = sap.ui.core.Fragment.byId(oView.getId(), "AddUserDialog");

             console.log(
                sap.ui.core.Fragment.byId(oView.getId(), "inputUserId"),
                sap.ui.core.Fragment.byId(oView.getId(), "inputUsername"),
                sap.ui.core.Fragment.byId(oView.getId(), "inputUserPhoneNumber"),
                sap.ui.core.Fragment.byId(oView.getId(), "inputUserEmail"),
                sap.ui.core.Fragment.byId(oView.getId(), "inputUserBirthdayDate"),
                sap.ui.core.Fragment.byId(oView.getId(), "inputUserFunction")
            );
            // Obtener los valores de los campos
            var sUserId = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserId")).getValue();
            var sUsername = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUsername")).getValue();
            var sPhone = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserPhoneNumber")).getValue();
            var sEmail = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserEmail")).getValue();
            var sBirthday = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserBirthdayDate")).getValue();
            var sFunction = /** @type {sap.m.Input} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserFunction")).getValue();

           
            // Obtener roles seleccionados del VBox
            var oVBox = /** @type {sap.m.VBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "selectedRolesVBox"));
            var aRoles = oVBox.getItems().map(function(oItem) {
                return { ROLEID: oItem.data("roleId") };
            });

            // Construir el objeto de usuario
            var oUserData = {
                USERID: sUserId,
                USERNAME: sUsername,
                PHONENUMBER: sPhone,
                EMAIL: sEmail,
                BIRTHDAYDATE: sBirthday,
                FUNCTION: sFunction,
                ROLES: aRoles
            };


            fetch("http://localhost:3020/api/security/createuser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oUserData)
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("Error al guardar usuario");
                }
                MessageToast.show("Usuario guardado correctamente");
                
                // Opcional: refrescar la tabla de usuarios
                this.onCargarDatos();
            }.bind(this))
            .catch(function(error) {
                MessageToast.show("Error: " + error.message);
            });
        },

        onCancelarCrear: function(){
                 if (this._oCreateUserDialog) {
                this._oCreateUserDialog.close();
            }
        },        


//--------------------------------------------------------------------------------------------------------------------------------------
//             Funciones para editar un usuario
            onEditarUsuario:function(){
                var oView = this.getView();

                if (!this._oEditUserDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "com.inv.sapfiroriwebinversion.view.security.components.EditUserDialog",
                        controller: this
                    }).then(oDialog => {
                        this._oEditUserDialog = oDialog;
                        oView.addDependent(oDialog);
                        this._oEditUserDialog.open();
                    });
                } else {
                    this._oEditUserDialog.open();
                }
            },
            onCancelarUpdate: function(){
                 if (this._oCreateUserDialog) {
                    this._oCreateUserDialog.close();
                }
            },
//--------------------------------------------------------------------------------------------------------------------------------------
//             Funciones para eliminar un usuario     
            onEliminarUsuario:function(){

                if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas eliminar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar eliminación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            //that.deleteUser(that.selectedUser.USERID);
                            MessageToast.show("Usuario eliminado ", that.selectedUser.USERID);
                        }
                    }
                });
            }else{
                MessageToast.show("Selecciona un usuario para eliminar de la base de datos");
            }
            },
//--------------------------------------------------------------------------------------------------------------------------------------
//             Funciones para desactivar un usuario   
            onDesactivarUsuario:function(){
                this.getRouter().navTo("RouteCreate");
            },

//--------------------------------------------------------------------------------------------------------------------------------------
//             Funciones para activas un usuario     
            onActivarUsuario:function(){
                this.getRouter().navTo("RouteCreate");
            },




        });
    });