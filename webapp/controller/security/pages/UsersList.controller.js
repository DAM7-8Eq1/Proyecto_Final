/* eslint-disable valid-jsdoc */
/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable fiori-custom/sap-no-localhost */
sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(BaseController,JSONModel,Log,Fragment,MessageToast,MessageBox){
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.UsersList",{
        onInit: function(){

            // Esto desactiva los botones cuando entras a la vista, hasta que selecciones un usuario en la tabla se activan
            var oViewModel = new JSONModel({
                buttonsEnabled: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            //

            // Carga los usuarios
            this.loadUsers();
        },

        /**
         * Funcion para cargar la lista de usuarios.
         */
        loadUsers: function () {
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
                    
                    //Asignar los datos al modelo
                    oModel.setData(data);
                    // Asignar el modelo a la tabla
                    oTable.setModel(oModel);
                }.bind(this))
                .catch(function (error) {
                   
                    // Manejar el error de la solicitud
                    MessageToast.show("Error: " + error.message);
                });
        },

        loadCompanies: function() {
            //Agregar lógica para cargar compañias
        },

        loadDeptos: function(){
            //Agregar lógica para cargar deptos según la compañía
        },
        statusText: function(bStatus) {
            return bStatus ? "Desactivado" : "Activo";
        },


        /**
         * Funcion para cargar la lista de roles y poderlos visualizar en el combobox
         * Esto va cambiar ya que quiere que primero carguemos las compañías, luego que carguemos los deptos
         * Y en base a las compañías y depto que coloquemos, se muestren los roles que pertenecen a esta compañía y depto.
         */
        loadRoles: function () {
            var oView = this.getView();
            var oRolesModel = new JSONModel();
            var sUrl = "http://localhost:3020/api/security/roles"; 

            fetch(sUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Error al obtener roles");
                }
                return response.json();
            })
            .then(function (data) {
                // Asume que los roles vienen en data.value
                oRolesModel.setData({ roles: data.value });
                oView.setModel(oRolesModel, "rolesModel");
            })
            .catch(function (error) {
                MessageToast.show("Error: " + error.message);
            });
        },


        /**
         * Esto es para formatear los roles al cargarlos de la bd y que aparezcan separados por un guion medio en la tabla.
         * Ejemplo: Usuario auxiliar-Investor-etc...
         */
        formatRoles: function (rolesArray) {
            return Array.isArray(rolesArray) 
                ? rolesArray.map(role => role.ROLEID).join("-") 
                : "";
        },

        /**
         * Este evento se encarga de crear los items en el VBox con el nombre de los roles que se vayan agregando.
         */
        onRoleSelected: function (oEvent) {
            var oComboBox = oEvent.getSource();
            
            var sSelectedKey = oComboBox.getSelectedKey();
            var sSelectedText = oComboBox.getSelectedItem().getText();

            var oVBox;
            // Este if valida si es la modal de add user o edit user en la que se estáran colocando los roles
            if (oComboBox.getId().includes("comboBoxEditRoles")) {
                oVBox = this.getView().byId("selectedEditRolesVBox");  // Update User VBox
            } else {
                oVBox = this.getView().byId("selectedRolesVBox");   // Create User VBox
            }
            // Validar duplicados
            var bExists = oVBox.getItems().some(oItem => oItem.data("roleId") === sSelectedKey);
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

            oHBox.data("roleId", sSelectedKey);
            oVBox.addItem(oHBox);
        },

        //===================================================
        //=============== AÑADIR USUARIO ====================
        //===================================================

        /**
         * Función onpress del botón para agregar un nuevo usuario
         */
        onAddUser : function() {
            var oView = this.getView();

            if (!this._oCreateUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.inv.sapfiroriwebinversion.view.security.components.AddUserDialog",
                    controller: this
                }).then(oDialog => {
                    this._oCreateUserDialog = oDialog;
                    oView.addDependent(oDialog);
                    this.loadRoles();
                    this._oCreateUserDialog.open();
                });
            } else {
                this._oCreateUserDialog.open();
            }
            
        },

        onSaveUser: function(){
            //Aquí la lógica para agregar el usuario
        },

        onCancelUser: function(){
            if (this._oCreateUserDialog) {
                this._oCreateUserDialog.close();
            }
        },

        //===================================================
        //=============== EDITAR USUARIO ====================
        //===================================================

        /**
         * Función onpress del botón para editar un nuevo usuario
         * Agregar la lógica para cargar la info a la modal
         */
        onEditUser: function() {
            var oView = this.getView();

            if (!this._oEditUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.inv.sapfiroriwebinversion.view.security.components.EditUserDialog",
                    controller: this
                }).then(oDialog => {
                    this._oEditUserDialog = oDialog;
                    oView.addDependent(oDialog);
                    this.loadRoles();
                    this.setEditUserDialogFields(this.selectedUser); 
                    this._oEditUserDialog.open();
                });
            } else {
                this._oEditUserDialog.open();
            }
            
        },

        onEditSaveUser: function(){
            //Aquí la lógica para agregar la info actualizada del usuario en la bd
        },
        setEditUserDialogFields: function(user) {
            var oView = this.getView();
            var sFragmentId = oView.getId();

            Fragment.byId(sFragmentId, "editInputUserId")?.setValue(user.USERID || "");
            Fragment.byId(sFragmentId, "editInputUsername")?.setValue(user.USERNAME || "");
            Fragment.byId(sFragmentId, "editInputUserPhoneNumber")?.setValue(user.PHONENUMBER || "");
            Fragment.byId(sFragmentId, "editInputUserEmail")?.setValue(user.EMAIL || "");
            Fragment.byId(sFragmentId, "editInputUserBirthdayDate")?.setDateValue(user.BIRTHDAYDATE ? new Date(user.BIRTHDAYDATE) : null);
            Fragment.byId(sFragmentId, "inputEditUserFunction")?.setValue(user.FUNCTION || "");

            // Si quieres setear la compañía, cedis y roles, deberás hacerlo así:
            Fragment.byId(sFragmentId, "comboBoxEditCompanies")?.setSelectedKey(user.COMPANYID || "");
            Fragment.byId(sFragmentId, "comboBoxEditCedis")?.setSelectedKey(user.CEDIID || "");

            //para los roles, limpia el VBox y agrega los roles del usuario:
            var oRolesVBox = Fragment.byId(sFragmentId, "selectedEditRolesVBox");
            if (oRolesVBox && oRolesVBox.removeAllItems) {
                oRolesVBox.removeAllItems();
                if (Array.isArray(user.ROLES)) {
                    user.ROLES.forEach(function(role) {
                         var oHBox = new sap.m.HBox({
                            items: [
                                new sap.m.Label({ text: role.ROLENAME || role.ROLEID }).addStyleClass("sapUiSmallMarginEnd"),
                                // @ts-ignore
                                new sap.m.Button({
                                    icon: "sap-icon://decline",
                                    type: "Transparent",
                                    press: () => oRolesVBox.removeItem(oHBox)
                                })
                            ]
                        });

                        oHBox.data("roleId", role.ROLEID);
                        oRolesVBox.addItem(oHBox);
                    });
                }
            }
        },

        onEditCancelUser: function(){
            if (this._oEditUserDialog) {
                this._oEditUserDialog.close();
            }
        },


        // ===================================================
        // ========= Eliminar Usuario Fisicamente ============
        // ===================================================

        /**
         * Función onDeleteUser .
         */
        onDeleteUser: function(){
            if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas eliminar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar eliminación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.deleteUser(that.selectedUser.USERID);
                        }
                    }
                });
            }else{
                MessageToast.show("Selecciona un usuario para eliminar de la base de datos");
            }
        },

        deleteUser: function(UserId){
            MessageToast.show("Se eliminio "+ UserId);
              // Obtener el modelo de la tabla
            var oTable = this.byId("IdTable1SecurityTable");
            var oModel = oTable.getModel();
            var aUsers = oModel.getProperty("/value"); // Asumiendo que los usuarios están en data.value

            // Filtrar el usuario eliminado
            var aFiltered = aUsers.filter(function(user) {
                return user.USERID !== UserId;
            });

            // Actualizar el modelo
            oModel.setProperty("/value", aFiltered);

            // Limpiar selección y desactivar botones
            oTable.clearSelection();
            this.selectedUser = null;
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);

            MessageToast.show("Usuario eliminado " + UserId);

            //Agregar API
        },

        // ===================================================
        // ============ Desactivar el usuario ================
        // ===================================================

        /**
         * Función onDesactivateUser.
         */
        onDesactivateUser: function(){
            if (this.selectedUser) {
            //Verificar si el usuairo esta desactivado
                if (!this.selectedUser.STATUS) {
                    //Se ecnuentra activo
                    //preguntar si desea activarlo  
                    var that = this;
                    MessageBox.confirm("¿Deseas desactivar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                        title: "Confirmar desactivación",
                        icon: MessageBox.Icon.WARNING,
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.OK) {
                                that.desactivateUser(that.selectedUser.USERID);
                            }
                        }
                    });
                    
                } else {                
                    //Esta desctivado
                    MessageToast.show("El usuario ya se encuentra DeESACTIVADO");
                }
            }else{
                MessageToast.show("Selecciona un usuario para desactivar");
            }
        },

        desactivateUser: function(UserId){
            MessageToast.show("Se desactivo "+ UserId);
              // Obtener el modelo de la tabla
            var oTable = this.byId("IdTable1SecurityTable");
            var oModel = oTable.getModel();
            var aUsers = oModel.getProperty("/value"); // Asumiendo que los usuarios están en data.value

            aUsers.forEach(function(user) {
                if (user.USERID === UserId) {
                    user.STATUS = true; 
                }
            });

            // Actualizar el modelo
            oModel.setProperty("/value", aUsers);

            // Limpiar selección y desactivar botones
            oTable.clearSelection();
            this.selectedUser = null;
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);

            MessageToast.show("Usuario desactivado " + UserId);
        },


        // ===================================================
        // ============== Activar el usuario =================
        // ===================================================

        /**
         * Función onActivateUser.
         */
        onActivateUser: function(){
            if (this.selectedUser) {
            //Verificar si el usuairo esta desactivado
                if (!this.selectedUser.STATUS) {
                    //Se ecnuentra activo
                    MessageToast.show("El usuario ya se encuentra ACTIVO");
                } else {                
                    //Esta desctivado
                    //preguntar si desea activarlo  
                    var that = this;
                    MessageBox.confirm("¿Deseas activar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                        title: "Confirmar activación",
                        icon: MessageBox.Icon.WARNING,
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.OK) {
                                //Metodo para activar el usuario
                                that.activateUser(that.selectedUser.USERID);
                            }
                        }
                    });
                 }
            }else{
                MessageToast.show("Selecciona un usuario para activar");
            }
        },

        activateUser: function(UserId){
            MessageToast.show("Se desactivo "+ UserId);
              // Obtener el modelo de la tabla
            var oTable = this.byId("IdTable1SecurityTable");
            var oModel = oTable.getModel();
            var aUsers = oModel.getProperty("/value"); // Asumiendo que los usuarios están en data.value

            aUsers.forEach(function(user) {
                if (user.USERID === UserId) {
                    user.STATUS = false;
                }
            });

            // Actualizar el modelo
            oModel.setProperty("/value", aUsers);

            // Limpiar selección y desactivar botones
            oTable.clearSelection();
            this.selectedUser = null;
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);

            MessageToast.show("Usuario desactivado " + UserId);
        },


        //===================================================
        //=============== Funciones de la tabla =============
        //===================================================

        /**
         * Función que obtiene el usuario que se selecciona en la tabla en this.selectedUser se guarda todo el usuario
         * Además activa los botones de editar/eliminar/desactivar y activar
         */
        onUserRowSelected: function () {
            var oTable = this.byId("IdTable1SecurityTable");
            var iSelectedIndex = oTable.getSelectedIndex();

            if (iSelectedIndex < 0) {
                this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
                return;
            }

            var oContext = oTable.getContextByIndex(iSelectedIndex);
            var UserData = oContext.getObject();

            this.selectedUser = UserData;

            // Activa los botones
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", true);
        },

        onSearchUser: function () {
            //Aplicar el filtro de búsqueda para la tabla
        },

        onRefresh: function(){
            this.loadUsers();
        },


        //===================================================
        //=========== Validar email y phonenumber ===========
        //===================================================

        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        isValidPhoneNumber: function(phone) {
            return /^\d{10}$/.test(phone); // Ejemplo: 10 dígitos numéricos
        }


    });
});
