sap.ui.define(
  [
    "com/inv/sapfiroriwebinversion/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "jquery",
  ],
  function (
    BaseController,
    JSONModel,
    MessageBox,
    MessageToast,
    Filter,
    Fragment,
    FilterOperator,
    $
  ) {
    "use strict";

    return BaseController.extend(
      "com.inv.sapfiroriwebinversion.controller.catalogs.pages.Values",
      {
        onInit: function () {
          // Modelo para los valores
          this.getView().setModel(
            new JSONModel({
              values: [],
              selectedValue: null,
              selectedValueIn: null,
            }),
            "values"
          );

          // Modelo para los datos del formulario
          this.getView().setModel(
            new JSONModel({
              COMPANYID: "0",
              CEDIID: "0",
              LABELID: "",
              VALUEID: "",
              VALUEPAID: "",
              VALUE: "",
              ALIAS: "",
              SEQUENCE: 10,
              IMAGE: "",
              VALUESAPID: "",
              DESCRIPTION: "",
              ROUTE: "",
              DETAIL_ROW: {
                ACTIVED: true,
                DELETED: false,
                DETAIL_ROW_REG: [
                  {
                    CURRENT: false,
                    REGDATE: new Date().toISOString(),
                    REGTIME: new Date().toISOString(),
                    REGUSER: "FIBARRAC",
                  },
                  {
                    CURRENT: true,
                    REGDATE: new Date().toISOString(),
                    REGTIME: new Date().toISOString(),
                    REGUSER: "FIBARRAC",
                  },
                ],
              },
            }),
            "newValueModel"
          );
        },
        // Método para cargar los valores en el modelo
        loadValues: function (aValues) {
          this.getView()
            .getModel("values")
            .setProperty("/values", aValues || []);
        },
        // Método para abrir el diálogo de selección de valores
        onItemSelect: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oSelectedData = oItem.getBindingContext("values").getObject();

          // Actualiza el modelo newValueModel con los datos seleccionados
          this.getView().getModel("newValueModel").setProperty("/", {
            VALUEID: oSelectedData.VALUEID,
            VALUE: oSelectedData.VALUE,
            VALUEPAID: oSelectedData.VALUEPAID,
            ALIAS: oSelectedData.ALIAS,
            IMAGE: oSelectedData.IMAGE,
            DESCRIPTION: oSelectedData.DESCRIPTION,
          });

          // 🔴 AGREGA ESTA LÍNEA:
          this.getView()
            .getModel("values")
            .setProperty("/selectedValue", oSelectedData);

          // Activa el modo de edición
          this.getView()
            .getModel("values")
            .setProperty("/selectedValueIn", true);
        },
        onAddValues: function () {
          // Intenta primero desde el modelo de catálogo seleccionado
          var sLabelId =
            this.getView()
              .getModel("catalogs")
              ?.getProperty("/selectedCatalog/LABELID") || "";

          // Si no hay, intenta desde el modelo de valores seleccionado
          if (!sLabelId) {
            sLabelId = this.getView()
              .getModel("values")
              ?.getProperty("/selectedValue/LABELID");
          }

          // Si sigue sin haber, ponlo vacío
          sLabelId = sLabelId || "";

          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: sLabelId,
            VALUEID: "",
            VALUEPAID: "",
            VALUE: "",
            ALIAS: "",
            SEQUENCE: 10,
            IMAGE: "",
            VALUESAPID: "",
            DESCRIPTION: "",
            ROUTE: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
              ],
            },
          });

          this.getView().setModel(oModel, "newValueModel");

          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.inv.sapfiroriwebinversion.view.catalogs.fragments.AddValueDialog",
              controller: this,
            }).then((oDialog) => {
              this._oAddDialog = oDialog;
              this.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveValues: function () {
          var oData = this.getView().getModel("newValueModel").getData();

          // Validación básica
          console.log(
            "ValueID: ",
            oData.VALUEID,
            " | LabelID: ",
            oData.LABELID
          );

          if (!oData.VALUEID || !oData.LABELID) {
            sap.m.MessageToast.show("VALUEID y LABELID son obligatorios.");
            return;
          }

          var valueData = {
            COMPANYID: oData.COMPANYID,
            CEDIID: oData.CEDIID,
            LABELID: oData.LABELID,
            VALUEID: oData.VALUEID,
            VALUEPAID: oData.VALUEPAID,
            VALUE: oData.VALUE,
            ALIAS: oData.ALIAS,
            SEQUENCE: oData.SEQUENCE,
            IMAGE: oData.IMAGE,
            VALUESAPID: oData.VALUESAPID,
            DESCRIPTION: oData.DESCRIPTION,
            ROUTE: oData.ROUTE,
            // Si tu CDS acepta DETAIL_ROW, agrégalo aquí
            // DETAIL_ROW: oData.DETAIL_ROW
          };

          fetch("http://localhost:3020/api/security/CreateValue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: valueData }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("Error al crear el value");
              return response.json();
            })
            .then((data) => {
              sap.m.MessageToast.show("¡Value creado con éxito!");
              this.loadValues();
              this._oAddDialog.close();
              this._refreshValues();
            })
            .catch((error) => {
              sap.m.MessageToast.show("Error: " + error.message);
            });
        },

        onCancelValues: function () {
          // Vuelve a inicializar el modelo con LABELID del catálogo seleccionado
          var sLabelId =
            this.getView()
              .getModel("catalogs")
              ?.getProperty("/selectedCatalog/LABELID") || "";

          this.getView().setModel(
            new JSONModel({
              COMPANYID: "0",
              CEDIID: "0",
              LABELID: sLabelId,
              VALUEID: "",
              VALUEPAID: "",
              VALUE: "",
              ALIAS: "",
              SEQUENCE: 10,
              IMAGE: "",
              VALUESAPID: "",
              DESCRIPTION: "",
              ROUTE: "",
              DETAIL_ROW: {
                ACTIVED: true,
                DELETED: false,
                DETAIL_ROW_REG: [
                  {
                    CURRENT: false,
                    REGDATE: new Date().toISOString(),
                    REGTIME: new Date().toISOString(),
                    REGUSER: "FIBARRAC",
                  },
                  {
                    CURRENT: true,
                    REGDATE: new Date().toISOString(),
                    REGTIME: new Date().toISOString(),
                    REGUSER: "FIBARRAC",
                  },
                ],
              },
            }),
            "newValueModel"
          );
          this._oAddDialog.close();
          this.getView()
            .getModel("values")
            .setProperty("/selectedValueIn", false);
        },

        _refreshValues: function () {
          var sLabelId = this.getView()
            .getModel("newValueModel")
            .getProperty("/LABELID");

          fetch(
            "http://localhost:3020/api/security/catalogs?labelid=" +
              encodeURIComponent(sLabelId)
          )
            .then((response) => response.json())
            .then((data) => {
              console.log("Respuesta backend al refrescar:", data);
              let values = [];
              if (Array.isArray(data) && data.length > 0 && data[0].values) {
                values = data[0].values;
              }
              this.loadValues(values);
            })
            .catch((error) => {
              sap.m.MessageToast.show(
                "Error al recargar valores: " + error.message
              );
            });
        },

        onDeleteValue: function () {
          var oSelected = this.getView()
            .getModel("values")
            .getProperty("/selectedValue");
          if (!oSelected) {
            sap.m.MessageToast.show("Selecciona un value para eliminar.");
            return;
          }
          var sLabelId = oSelected.LABELID;
          var sValueId = oSelected.VALUEID;

          console.log("Eliminando:", sLabelId, sValueId);

          MessageBox.confirm("¿Está seguro de eliminar este Value?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.YES) {
                fetch("http://localhost:3020/api/security/removevalue", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    labelid: sLabelId,
                    valueid: sValueId,
                  }),
                })
                  .then((response) => {
                    if (!response.ok)
                      throw new Error("Error al eliminar Value");
                    // No intentes leer JSON si no hay respuesta
                    return;
                  })
                  .then(() => {
                    MessageToast.show("¡Value eliminado!");
                    this._refreshValues();
                  })
                  .catch((error) => {
                    MessageToast.show("Error: " + error.message);
                  });
              }
            },
          });
        },
      }
    );
  }
);
