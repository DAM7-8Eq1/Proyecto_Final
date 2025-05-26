sap.ui.define([
    "com/inv/sapfiroriwebinversion/controller/BaseController", 
    "sap/ui/model/json/JSONModel", 
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, BusyIndicator, MessageToast) {
    "use strict";

    return BaseController.extend("com.inv.sapfiroriwebinversion.controller.security.pages.UserCreate", {
        //Constructor de la clase de create User
        onInit: function () {
    },
    _onRouteMatched: function (oEvent) {
    },

   
    //Funcion para guardar los datos que seran mandados a la api con un create
    onSave: function () {
        // Obtener el modelo de la vista
        var oView = this.getView();
        var sFragmentId = oView.getId();

        // Obtener valores de los campos del fragmento
        var sUserId = oView.byId(sFragmentId, "inputUserId")?.getValue().trim();
        var sPassword = oView.byId(sFragmentId, "inputUserPassword")?.getValue().trim();
        var sAlias = oView.byId(sFragmentId, "inputUserAlias")?.getValue().trim();
        var sFirstName = oView.byId(sFragmentId, "inputUserFirstName")?.getValue().trim();
        var sLastName = oView.byId(sFragmentId, "inputUserLastName")?.getValue().trim();
        var sEmployeeID = oView.byId(sFragmentId, "inputUserEmployeeID")?.getValue().trim();
        var sExtension = oView.byId(sFragmentId, "inputUserExtension")?.getValue().trim();
        var sPhone = oView.byId(sFragmentId, "inputUserPhoneNumber")?.getValue().trim();
        var sEmail = oView.byId(sFragmentId, "inputUserEmail")?.getValue().trim();
        var oBirthdayDate = oView.byId(sFragmentId, "inputUserBirthdayDate")?.getDateValue();
        var sAvatar = oView.byId(sFragmentId, "inputUserAvatar")?.getValue().trim();
        var sCompanyId = oView.byId(sFragmentId, "comboBoxCompanies")?.getSelectedKey();
        var sCediId = oView.byId(sFragmentId, "comboBoxCedis")?.getSelectedKey();
        var sFunction = oView.byId(sFragmentId, "inputUserFunction")?.getValue().trim();

        var sUserName = sFirstName + " " + sLastName;
        var sCompanyName = oView.byId(sFragmentId, "comboBoxCompanies")?.getSelectedItem()?.getText();
        var sCompanyAlias = oView.byId(sFragmentId, "comboBoxCompanies")?.getSelectedItem()?.data("companyAlias");
        // Dirección
        var sStreet = oView.byId(sFragmentId, "inputUserStreetUser")?.getValue().trim();
        var sPostalCode = oView.byId(sFragmentId, "inputUserPostalCodeUser")?.getValue().trim();
        var sCity = oView.byId(sFragmentId, "inputUserCityUser")?.getValue().trim();
        var sRegion = oView.byId(sFragmentId, "inputUserRegionUser")?.getValue().trim();
        var sState = oView.byId(sFragmentId, "inputUserStateUser")?.getValue().trim();
        var sCountry = oView.byId(sFragmentId, "inputUserCountryUser")?.getValue().trim();

        // Obtener roles seleccionados del VBox
        var oRolesVBox = oView.byId(sFragmentId, "selectedRolesVBox");
        var aRoles = oRolesVBox.getItems().map(function(oHBox) {
            return { ROLEID: oHBox.data("roleId") };
        });
        var sDepartment = oView.byId(sFragmentId, "comboBoxCedis")?.getSelectedItem()?.data("department");

        // Construir el objeto usuario
        var oUserData = {
            USERID: sUserId,
            PASSWORD: sPassword,
            USERNAME: sUserName,
            ALIAS: sAlias,
            FIRSTNAME: sFirstName,
            LASTNAME: sLastName,
            BIRTHDAYDATE: oBirthdayDate ? oBirthdayDate.toISOString().split("T")[0] : null,
            AVATAR: sAvatar,
            COMPANYID: sCompanyId,
            COMPANYNAME: sCompanyName ,
            COMPANYALIAS: sCompanyAlias,
            CEDIID: sCediId,
            EMPLOYEEID: sEmployeeID,
            EMAIL: sEmail,
            PHONENUMBER: sPhone,
            EXTENSION: sExtension,
            DEPARTMENT: sDepartment,
            FUNCTION: sFunction,
            STREET: sStreet,
            POSTALCODE: sPostalCode,
            CITY: sCity,
            REGION: sRegion,
            STATE: sState,
            COUNTRY: sCountry,
            ROLES: aRoles,
        };







        // Validaciones básicas (puedes agregar más)
        if (!sUserId || !sPassword || !sFirstName || !sLastName || !sEmail || !sCompanyId || !sCediId|| !sDepartment) {
            MessageToast.show("Por favor, completa todos los campos obligatorios.");
            return;
        }
        
      
        console.log("Data to be sent:", JSON.stringify({user:oUserData}));
        /*
        
        // Realizar la solicitud a la API para crear el usuario
        //Cambiar URL
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
        .   then(function (data) {
            // Mostrar mensaje de éxito
            MessageToast.show("Usuario creado correctamente");
            // Navegar a la vista de tabla
            this.getRouter().navTo("RouteSecurityTable");
        }.bind(this))
        .catch(function (error) {
            BusyIndicator.hide(); // Ocultar indicador de carga
            MessageToast.show("Error: " + error.message);
        });*/
    },
    });
});
