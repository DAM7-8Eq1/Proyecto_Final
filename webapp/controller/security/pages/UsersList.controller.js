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
            var sUrl = "http://localhost:3020/api/security/usersAll";
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
                        user.ROLESm = this.formatRoles(user.ROLES);
                        
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
             var oView = this.getView();
            // Datos estáticos para compañías y departamentos
            var oStaticModel = new JSONModel({
                companies: [
                    { COMPANYID: 1001, COMPANYNAMME: "INSTITUTO TECNOLOGICO DE TEPIC" },
                    { COMPANYID: 1002, COMPANYNAMME: "UNIVERSIDAD AUTONOMA DE NAYARIT" }
                ],
                cedis: [
                    { CEDIID: "IdTepic", CEDINAME: "Sistemas y Computacion" },
                    { CEDIID: "IdUan", CEDINAME: "Departamento de Finanzas" }
                ]
            });
            oView.setModel(oStaticModel);
        },
        statusText: function(bStatus) {
            return bStatus ?  "Activo":"Desactivado" ;
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
           // this.loadCompanies();
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
             this.loadCompanies(); 
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
            var oView = this.getView();
            var sFragmentId = oView.getId();
            // Obtener valores de los campos
            var sUserId = Fragment.byId(sFragmentId, "inputUserId")?.getValue().trim();
            var sUsername = Fragment.byId(sFragmentId, "inputUsername")?.getValue().trim();
            var sPhone = Fragment.byId(sFragmentId, "inputUserPhoneNumber")?.getValue().trim();
            var sEmail = Fragment.byId(sFragmentId, "inputUserEmail")?.getValue().trim();
            var oBirthdayDate = Fragment.byId(sFragmentId, "inputUserBirthdayDate")?.getDateValue();
            var sCompanyId = Fragment.byId(sFragmentId, "comboBoxCompanies")?.getSelectedKey();
            var sCompanyName = Fragment.byId(sFragmentId, "comboBoxCompanies")?.getSelectedItem()?.getText();
            var sCediId = Fragment.byId(sFragmentId, "comboBoxCedis")?.getSelectedKey();
            var sCediName = Fragment.byId(sFragmentId, "comboBoxCedis")?.getSelectedItem()?.getText();
            var sFunction = Fragment.byId(sFragmentId, "inputUserFunction")?.getValue().trim();
            var nCompanyId = Number(sCompanyId);

            // Obtener roles seleccionados del VBox
            var oRolesVBox = Fragment.byId(sFragmentId, "selectedRolesVBox");
            var aRoles = oRolesVBox.getItems().map(function(oHBox) {
                return { ROLEID: oHBox.data("roleId") };
            });
            
            // Validaciones básicas
            if (!sUserId || !sUsername || !sPhone || !sEmail || !sCompanyId || !sCediId) {
                MessageToast.show("Por favor, completa todos los campos obligatorios.");
                return;
            }
            if (!this.isValidEmail(sEmail)) {
                MessageToast.show("Correo electrónico inválido.");
                return;
            }
            if (!this.isValidPhoneNumber(sPhone)) {
                MessageToast.show("Número telefónico inválido.");
                return;
            }

            // Construir el objeto usuario
            var oNewUser = {
                USERID: sUserId,
                USERNAME: sUsername,
                PHONENUMBER: sPhone,
                EMAIL: sEmail,
                BIRTHDAYDATE: oBirthdayDate ? oBirthdayDate.toISOString().split("T")[0] : null,
                COMPANYID: nCompanyId,
                COMPANYNAME:sCompanyName,
                CEDIID: sCediId,
                DEPARTMENT:sCediName,
                FUNCTION: sFunction,
                ROLES: aRoles
            };
            // Llamada a la API para guardar el usuario
            fetch("http://localhost:3020/api/security/createuser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({user:oNewUser})
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al crear usuario");
                return response.json();
            })
            .then(data => {
                 MessageToast.show("Usuario creado exitosamente");
                    // Insertar el nuevo usuario en la tabla
                 var oTable = this.byId("IdTable1SecurityTable");
                 var oModel = oTable.getModel();
                 var aUsers = oModel.getProperty("/value") || [];
                 var oInsertedUser = data.user || oNewUser;
                 aUsers.push(oInsertedUser);
                 oModel.setProperty("/value", aUsers);
                 
                 // Limpiar los campos del fragmento
                 Fragment.byId(sFragmentId, "inputUserId")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUsername")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserPhoneNumber")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserEmail")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserBirthdayDate")?.setDateValue(null);
                 Fragment.byId(sFragmentId, "comboBoxCompanies")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "comboBoxCedis")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "comboBoxRoles")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "inputUserFunction")?.setValue("");
                 var oRolesVBox = Fragment.byId(sFragmentId, "selectedRolesVBox");
                 if (oRolesVBox && oRolesVBox.removeAllItems) {
                     oRolesVBox.removeAllItems();
                 }

                 this._oCreateUserDialog.close();

              
            })
            .catch(error => {
                MessageToast.show("Error: " + error.message);
            });

        },

        onCancelUser: function(){
            if (this._oCreateUserDialog) { 
                var oView = this.getView();
                var sFragmentId = oView.getId();   
                 Fragment.byId(sFragmentId, "inputUserId")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUsername")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserPhoneNumber")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserEmail")?.setValue("");
                 Fragment.byId(sFragmentId, "inputUserBirthdayDate")?.setDateValue(null);
                 Fragment.byId(sFragmentId, "comboBoxCompanies")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "comboBoxCedis")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "comboBoxRoles")?.setSelectedKey("");
                 Fragment.byId(sFragmentId, "inputUserFunction")?.setValue("");
                 var oRolesVBox = Fragment.byId(sFragmentId, "selectedRolesVBox");
                 if (oRolesVBox && oRolesVBox.removeAllItems) {
                     oRolesVBox.removeAllItems();
                 }

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
                this.loadCompanies(); 
                this.uid = this.selectedUser && this.selectedUser.USERID ? this.selectedUser.USERID : null;

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
                    this.setEditUserDialogFields(this.selectedUser); 
                    this._oEditUserDialog.open();
                }
            
        },

        onEditSaveUser: function(){
            var oView = this.getView();
            var sFragmentId = oView.getId();

            // Obtener valores de los campos del fragmento de edición
            var sUserId = Fragment.byId(sFragmentId, "editInputUserId")?.getValue().trim();
            var sUsername = Fragment.byId(sFragmentId, "editInputUsername")?.getValue().trim();
            var sPhone = Fragment.byId(sFragmentId, "editInputUserPhoneNumber")?.getValue().trim();
            var sEmail = Fragment.byId(sFragmentId, "editInputUserEmail")?.getValue().trim();
            var oBirthdayDate = Fragment.byId(sFragmentId, "editInputUserBirthdayDate")?.getDateValue();
            var sCompanyId = Fragment.byId(sFragmentId, "comboBoxEditCompanies")?.getSelectedKey();
            var sCompanyName = Fragment.byId(sFragmentId, "comboBoxEditCompanies")?.getSelectedItem()?.getText();
            var sCediId = Fragment.byId(sFragmentId, "comboBoxEditCedis")?.getSelectedKey();
            var sCediName = Fragment.byId(sFragmentId, "comboBoxEditCedis")?.getSelectedItem()?.getText();
            var sFunction = Fragment.byId(sFragmentId, "inputEditUserFunction")?.getValue().trim();
            var nCompanyId = Number(sCompanyId);

            // Obtener roles seleccionados del VBox
            var oRolesVBox = Fragment.byId(sFragmentId, "selectedEditRolesVBox");
            var aRoles = oRolesVBox.getItems().map(function(oHBox) {
                return { ROLEID: oHBox.data("roleId") };
            });

            // Validaciones básicas
            if (!sUserId || !sUsername || !sPhone || !sEmail || !sCompanyId || !sCediId ) {
                MessageToast.show("Por favor, completa todos los campos obligatorios.");
                return;
            }
            if (!this.isValidEmail(sEmail)) {
                MessageToast.show("Correo electrónico inválido.");
                return;
            }
            if (!this.isValidPhoneNumber(sPhone)) {
                MessageToast.show("Número telefónico inválido.");
                return;
            }

            // Construir el objeto usuario actualizado
            var oUpdatedUser = {
                USERID: sUserId,
                USERNAME: sUsername,
                PHONENUMBER: sPhone,
                EMAIL: sEmail,
                BIRTHDAYDATE: oBirthdayDate ? oBirthdayDate.toISOString().split("T")[0] : null,
                COMPANYID: nCompanyId,
                COMPANYNAME: sCompanyName,
                CEDIID: sCediId,
                DEPARTMENT: sCediName,
                FUNCTION: sFunction,
                ROLES: aRoles
            };

            // Llamada a la API para actualizar el usuario
            fetch("http://localhost:3020/api/security/updateuser?userid=" + this.uid, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: oUpdatedUser })
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al modificar usuario");
                return response.json();
            })
            .then(data => {
                MessageToast.show("Usuario modificado exitosamente");

                // Limpiar los campos del fragmento de edición
                Fragment.byId(sFragmentId, "editInputUserId")?.setValue("");
                Fragment.byId(sFragmentId, "editInputUsername")?.setValue("");
                Fragment.byId(sFragmentId, "editInputUserPhoneNumber")?.setValue("");
                Fragment.byId(sFragmentId, "editInputUserEmail")?.setValue("");
                Fragment.byId(sFragmentId, "editInputUserBirthdayDate")?.setDateValue(null);
                Fragment.byId(sFragmentId, "comboBoxEditCompanies")?.setSelectedKey("");
                Fragment.byId(sFragmentId, "comboBoxEditCedis")?.setSelectedKey("");
                Fragment.byId(sFragmentId, "comboBoxEditRoles")?.setSelectedKey("");
                Fragment.byId(sFragmentId, "inputEditUserFunction")?.setValue("");
                var oRolesVBox = Fragment.byId(sFragmentId, "selectedEditRolesVBox");
                if (oRolesVBox && oRolesVBox.removeAllItems) {
                    oRolesVBox.removeAllItems();
                }

                this._oEditUserDialog.close();

                // Actualizar el usuario en la tabla
                var oTable = this.byId("IdTable1SecurityTable");
                var oModel = oTable.getModel();
                var aUsers = oModel.getProperty("/value") || [];
                var idx = aUsers.findIndex(u => u.USERID === sUserId);
                if (idx !== -1) {
                    aUsers[idx] = oUpdatedUser;
                    oModel.setProperty("/value", aUsers);
                }
            })
            .catch(error => {
                MessageToast.show("Error: " + error.message);
            });

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
            var that = this;
            // Llamada a la API para eliminar el usuario
            fetch("http://localhost:3020/api/security/removeuser?userid=" + encodeURIComponent(UserId), {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
            .then(function(response) {
                if (!response.ok) throw new Error("Error al eliminar usuario");
                // Si tu backend responde con JSON, puedes hacer: return response.json();
                return response.text(); // o simplemente ignorar el cuerpo si no hay respuesta
            })
            .then(function() {
                MessageToast.show("Usuario eliminado " + UserId);
                // Actualizar la tabla localmente
                var oTable = that.byId("IdTable1SecurityTable");
                var oModel = oTable.getModel();
                var aUsers = oModel.getProperty("/value") || [];
                var aFiltered = aUsers.filter(function(user) {
                    return user.USERID !== UserId;
                });
                oModel.setProperty("/value", aFiltered);

                // Limpiar selección y desactivar botones
                oTable.clearSelection();
                that.selectedUser = null;
                that.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
            })
            .catch(function(error) {
                MessageToast.show("Error: " + error.message);
            });
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
                if (!this.selectedUser.DETAIL_ROW.ACTIVED) {
                     //Esta desctivado
                    MessageToast.show("El usuario ya se encuentra DESACTIVADO");
                }else{

                
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
                }
            }else{
                MessageToast.show("Selecciona un usuario para desactivar");
            }
        },

        desactivateUser: function(UserId){
            var that = this;
            // Llamada a la API para desactivar el usuario
            fetch("http://localhost:3020/api/security/deleteusers?userid=" + encodeURIComponent(UserId), {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
            .then(function(response) {
                if (!response.ok) throw new Error("Error al desactivar usuario");
                return response.text(); // o response.json() si tu backend responde con JSON
            })
            .then(function() {
                // Actualizar el estado del usuario localmente
                var oTable = that.byId("IdTable1SecurityTable");
                var oModel = oTable.getModel();
                var aUsers = oModel.getProperty("/value") || [];
                aUsers.forEach(function(user) {
                    if (user.USERID === UserId) {
                        user.DETAIL_ROW.ACTIVED = false; // false = desactivado
                    }
                });
                oModel.setProperty("/value", aUsers);

                // Limpiar selección y desactivar botones
                oTable.clearSelection();
                that.selectedUser = null;
                that.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);

                MessageToast.show("Usuario desactivado " + UserId);
            })
            .catch(function(error) {
                MessageToast.show("Error: " + error.message);
            });
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
                if (!this.selectedUser.DETAIL_ROW.ACTIVED) {
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
                }else{
                     //Se ecnuentra activo
                    MessageToast.show("El usuario ya se encuentra ACTIVO");
                }
                   
            }else{
                MessageToast.show("Selecciona un usuario para activar");
            }
        },

        activateUser: function(UserId){
            var that = this;
            // Llamada a la API para activar el usuario
            fetch("http://localhost:3020/api/security/activateusers?userid=" + encodeURIComponent(UserId), {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
            .then(function(response) {
                if (!response.ok) throw new Error("Error al activar usuario");
                return response.text(); // o response.json() si tu backend responde con JSON
            })
            .then(function() {
                // Actualizar el estado del usuario localmente
                var oTable = that.byId("IdTable1SecurityTable");
                var oModel = oTable.getModel();
                var aUsers = oModel.getProperty("/value") || [];
                aUsers.forEach(function(user) {
                    if (user.USERID === UserId) {
                        user.DETAIL_ROW.ACTIVED = true; // true = activo
                    }
                });
                oModel.setProperty("/value", aUsers);

                // Limpiar selección y desactivar botones
                oTable.clearSelection();
                that.selectedUser = null;
                that.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);

                MessageToast.show("Usuario activado " + UserId);
            })
            .catch(function(error) {
                MessageToast.show("Error: " + error.message);
            });
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
            var oTable = this.byId("IdTable1SecurityTable");
            var oModel = oTable.getModel();
            var aUsers = oModel.getProperty("/value") || [];
            var oSearchField = this.byId("searchFieldUsers"); // Asegúrate de tener un SearchField con este ID en tu vista
            var sQuery = oSearchField ? oSearchField.getValue().toLowerCase() : "";

            if (!sQuery) {
                // Si no hay búsqueda, muestra todos los usuarios
                oModel.setProperty("/filtered", aUsers);
                oTable.bindRows("/filtered");
                return;
            }

            // Filtra usuarios por cualquier campo (string)
            var aFiltered = aUsers.filter(function(user) {
                return Object.values(user).some(function(value) {
                    if (typeof value === "object" && value !== null) {
                        // Si el valor es un objeto, busca en sus propiedades también
                        return Object.values(value).some(function(subValue) {
                            return String(subValue).toLowerCase().includes(sQuery);
                        });
                    }
                    return String(value).toLowerCase().includes(sQuery);
                });
            });

            oModel.setProperty("/filtered", aFiltered);
            oTable.bindRows("/filtered");
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
