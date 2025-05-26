sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController", 
    "sap/ui/model/json/JSONModel", 
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, BusyIndicator, MessageToast) {
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.Login", {
        //Inicializador de la clase LOGIN
        onInit: function () {
           var oModel = new sap.ui.model.json.JSONModel({
                email: "",
                password: ""
        });
        this.getView().setModel(oModel);
        },

        _onRouteMatched: function () {
            BusyIndicator.show(0);
            const tText = this.getView().byId("IdText1Login");
        },

        //Funcion al precionar el boton de iniciar sesion
        onLoginPress: function () {
            //Obtener los datos de los campos de username y email
            var oModel = this.getView().getModel();
            var sEmail = oModel.getProperty("/email");
            var sPassword = oModel.getProperty("/password");

            
            //Verificar que no esten vacios
             if (sEmail && sPassword) {
                // Mostrar indicador de carga
                BusyIndicator.show(0);
                 // Crear el cuerpo de la solicitud
                var oPayload = {
                    email: sEmail,
                    password: sPassword
                };
                 // Construir la URL con el parámetro
                var sUrl = "http://localhost:3020/api/security/userEmail?email=" + encodeURIComponent(sEmail);

                // Realizar la solicitud a la API
                fetch(sUrl, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                .then(function (response) {
                    BusyIndicator.hide(); // Ocultar indicador de carga
                    if (!response.ok) {
                        // Manejar el error de autenticación
                        throw new Error("Error en la autenticación");
                    }
                    return response.json();
                })
                .then(function (data) {
                    // Manejar la respuesta de la API
                    var valores = data.value;
                    var password = valores[0].PASSWORD;
                    var email = valores[0].EMAIL;
                    var estatus = valores[0].DETAIL_ROW.ACTIVED;

                    //validar el usuario y el correo
                    if (password !== sPassword || email !== sEmail) {
                        
                        MessageToast.show("Usuario o correo incorrecto");
                        return;
                    }
                    if(estatus === false){
                        MessageToast.show("Usuario no tiene permiso de ingresar");
                        return;
                    }
                    //Mensaje de inicio de sesion correcto
                    const first = valores[0].FIRSTNAME || "";
                    const last = valores[0].LASTNAME || "";
                    valores.initials = first && last
                    ? first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase()
                    : "US";
                    
                    const oAppModel = this.getOwnerComponent().getModel("appView");
                    oAppModel.setProperty("/isLoggedIn", true);
                    oAppModel.setProperty("/currentUser", valores[0]);
                    MessageToast.show("Inicio de sesión exitoso");
                    this.getView().getModel().setProperty("/email", "");
                    this.getView().getModel().setProperty("/password", "");
                    this.getRouter().navTo("main"); // Redirigir a otra vista
                }.bind(this))
                .catch(function (error) {
                    BusyIndicator.hide(); // Ocultar indicador de carga
                    // Manejar el error de la solicitud
                    MessageToast.show("Error: Usuario o correo incorrecto ");
                });
            } else {
                MessageToast.show("Por favor, ingrese usuario y contraseña");
            }
        },
        onVerContraseña:function(){
            const oInput = this.byId("passwordInput");
            const bCurrentType = oInput.getType() === "Text";
            oInput.setType(bCurrentType ? "Password" : "Text");
            this.byId("showPasswordButton").setIcon(bCurrentType ? "sap-icon://show" : "sap-icon://hide");
            
        }
    });
});
