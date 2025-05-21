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
            username: "",
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
            var sUsername = oModel.getProperty("/username");
            var sEmail = oModel.getProperty("/Email");
            
            //Verificar que no esten vacios
            if (sUsername && sEmail) {
                // Mostrar indicador de carga
                BusyIndicator.show(0);
                 // Crear el cuerpo de la solicitud
                var oPayload = {
                    username: sUsername,
                    password: sEmail
                };
                 // Construir la URL con el parámetro
                var sUrl = "http://localhost:3020/api/security/users?userid=" + encodeURIComponent(sUsername);

                // Realizar la solicitud a la API
                fetch(sUrl, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    //Colocar el Body en caso de POST
                    //body: JSON.stringify(oPayload)
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
                    var username = valores[0].USERID;
                    var email = valores[0].EMAIL;

                    //validar el usuario y el correo
                    if (username !== sUsername || email !== sEmail) {
                        MessageToast.show("Usuario o correo incorrecto");
                        return;
                    }
                    //Mensaje de inicio de sesion correcto
                    MessageToast.show("Inicio de sesión exitoso");
                    this.getRouter().navTo("RouteSecurity"); // Redirigir a otra vista
                }.bind(this))
                .catch(function (error) {
                    BusyIndicator.hide(); // Ocultar indicador de carga
                    // Manejar el error de la solicitud
                    MessageToast.show("Error: " + error.message);
                });
            } else {
                MessageToast.show("Por favor, ingrese usuario y contraseña");
            }
        }
    });
});
