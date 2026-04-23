sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/library",          // Khai báo thư viện chứa URLHelper
    "sap/m/MessageBox"
], function (MessageToast, Fragment, Filter, FilterOperator, Sorter, mobileLibrary, MessageBox) {
    "use strict";

    var _oLogDialog;
    var _oLogTemplate;
    var _oDeletedLogDialog;
    var _oDeletedLogTemplate;
    var URLHelper = mobileLibrary.URLHelper;

    return {
        onRequestDelete: function (oContext, aSelectedContexts) {
            try {
                var oExtensionAPI = this;
                var oEditFlow = oExtensionAPI.getEditFlow();
                var aContexts = (aSelectedContexts && aSelectedContexts.length > 0) ? aSelectedContexts : (oContext ? [oContext] : []);
                var bIsObjectPage = false;
                if (window.location.hash.indexOf("(") !== -1 || (this.getView && this.getView().getId().indexOf("ObjectPage") !== -1)) {
                    bIsObjectPage = true;
                }

                if (aContexts.length === 0) {
                    return sap.m.MessageToast.show("Please select at least one record to delete!");
                }


                var bHasLockedPO = false;
                for (var i = 0; i < aContexts.length; i++) {
                    var sRelCode = aContexts[i].getProperty("ReleaseCode");
                    if (sRelCode === 'R' || sRelCode === 'G') {
                        bHasLockedPO = true;
                        break;
                    }
                }

                if (bHasLockedPO) {
                    return sap.m.MessageBox.error("One or more selected Purchase Orders have been Released (Status R or G) and cannot be deleted.");
                }

                var aDraftContexts = [];
                var aActiveContexts = [];

                aContexts.forEach(function (oCtx) {
                    if (oCtx.getProperty("IsActiveEntity") === false) {
                        aDraftContexts.push(oCtx);
                    } else {
                        aActiveContexts.push(oCtx);
                    }
                });

                if (aDraftContexts.length > 0 && aActiveContexts.length === 0) {

                    var sMessage = aDraftContexts.length === 1
                        ? "Are you sure you want to discard the draft for " + (aDraftContexts[0].getProperty("PoNumber") || "this record") + "?"
                        : "Are you sure you want to discard " + aDraftContexts.length + " selected drafts?";

                    sap.m.MessageBox.confirm(sMessage, {
                        title: "Confirm Discard Draft",
                        actions: [sap.m.MessageBox.Action.DELETE, "Cancel"],
                        emphasizedAction: sap.m.MessageBox.Action.DELETE,
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.DELETE) {

                                sap.ui.core.BusyIndicator.show(0);

                                var oModel = aDraftContexts[0].getModel();
                                var sActionName = "com.sap.gateway.srvd.zui_purchaseorder.v0001.Discard(...)";

                                var aPromises = aDraftContexts.map(function (oCtx) {
                                    var oAction = oModel.bindContext(sActionName, oCtx);
                                    return oAction.execute();
                                });

                                Promise.all(aPromises).then(function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show(aDraftContexts.length + " Draft(s) discarded successfully!");

                                    if (bIsObjectPage) {
                                        var oRouting = typeof oExtensionAPI.getRouting === "function" ? oExtensionAPI.getRouting() : null;
                                        if (oRouting && typeof oRouting.navigateBack === "function") {
                                            oRouting.navigateBack();
                                        } else {
                                            window.history.back();
                                        }
                                    } else {
                                        try {
                                            var oODataModel = aDraftContexts[0].getModel();
                                            if (oODataModel && typeof oODataModel.refresh === "function") {
                                                oODataModel.refresh();
                                            } else if (oExtensionAPI.refresh) {
                                                oExtensionAPI.refresh();
                                            } else if (aDraftContexts[0].getBinding) {
                                                aDraftContexts[0].getBinding().refresh();
                                            }
                                        } catch (refreshErr) {
                                            console.warn("Refresh failed, but deletion succeeded: ", refreshErr);
                                        }
                                    }
                                }).catch(function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("Error discarding drafts: " + err.message);
                                });
                            } else {
                                console.log("Log: User cancelled Draft deletion.");
                                sap.m.MessageToast.show("Draft deletion cancelled");
                            }
                        }
                    });
                }
                else if (aActiveContexts.length > 0 && aDraftContexts.length === 0) {

                    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
                        contexts: aActiveContexts,
                        label: "Confirm Deletion PO",
                        skipParameterDialog: false,
                        skipMessagePopover: true
                    }).then(function () {
                        sap.m.MessageToast.show("Purchase Order(s) deleted successfully!");

                        if (bIsObjectPage) {
                            var oRouting = typeof oExtensionAPI.getRouting === "function" ? oExtensionAPI.getRouting() : null;
                            if (oRouting && typeof oRouting.navigateBack === "function") {
                                oRouting.navigateBack();
                            } else {
                                window.history.back();
                            }
                        } else {
                            try {
                                var oODataModel = aActiveContexts[0].getModel();
                                if (oODataModel && typeof oODataModel.refresh === "function") {
                                    oODataModel.refresh();
                                } else if (oExtensionAPI.refresh) {
                                    oExtensionAPI.refresh();
                                } else if (aActiveContexts[0].getBinding) {
                                    aActiveContexts[0].getBinding().refresh();
                                }
                            } catch (refreshErr) {
                                console.warn("Refresh failed: ", refreshErr);
                            }
                        }

                    }).catch(function (err) {
                        var sError = (err.message || "").toLowerCase();
                        if (sError.indexOf("cancel") !== -1 || sError.indexOf("dialog cancelled") !== -1) {
                            sap.m.MessageToast.show("Deletion cancelled");
                        } else if (sError.indexOf("404") !== -1) {
                            sap.m.MessageToast.show("Record no longer exists!");
                            try {
                                var oODataModel = aActiveContexts[0].getModel();
                                if (oODataModel && typeof oODataModel.refresh === "function") oODataModel.refresh();
                                else if (oExtensionAPI.refresh) oExtensionAPI.refresh();
                            } catch (e) { }

                        } else {
                            sap.m.MessageBox.error("Backend Error: " + err.message);
                        }
                    });
                }
                else {
                    sap.m.MessageBox.warning("Please select either ONLY Drafts or ONLY Active records to delete, not both mixed.");
                }

            } catch (e) {
                sap.m.MessageBox.error("JS Error: " + e.message);
            }
        },

        onViewLog: function (oEvent, aSelectedContexts) {
            try {
                var oExtensionAPI = this;
                var aContexts = aSelectedContexts || [];
                if (aContexts.length === 0 && oExtensionAPI.getSelectedContexts) {
                    aContexts = oExtensionAPI.getSelectedContexts();
                }

                if (aContexts.length === 0) return sap.m.MessageToast.show("Please select 1 PO!");
                if (aContexts.length > 1) return sap.m.MessageToast.show("Please select only 1 PO!");

                var oContext = aContexts[0];
                var oModel = oContext.getModel();
                var sPoNumber = oContext.getProperty("PoNumber");

                var bIsDraft = oContext.getProperty("IsActiveEntity") === false;
                var bHasActive = oContext.getProperty("HasActiveEntity") === true;

                if (!sPoNumber || sPoNumber.trim() === "" || (bIsDraft && !bHasActive)) {
                    return sap.m.MessageToast.show("New drafts do not have a Change Log yet!");
                }

                var fnLoadAndOpen = function () {
                    var oLogTable = sap.ui.core.Fragment.byId("logFrag", "jobLogTable");

                    if (!_oLogTemplate) {
                        var oBindingInfo = oLogTable.getBindingInfo("items");
                        if (oBindingInfo) {
                            _oLogTemplate = oBindingInfo.template;
                        }
                    }

                    oLogTable.unbindItems();

                    var aFilters = [
                        new sap.ui.model.Filter("PoNumber", sap.ui.model.FilterOperator.EQ, sPoNumber)
                    ];

                    var oSorter = new sap.ui.model.Sorter("ChangedAt", true);

                    oLogTable.bindItems({
                        path: "/PoChangeLog",
                        template: _oLogTemplate,
                        filters: aFilters,
                        sorter: oSorter
                    });
                    sap.ui.core.Fragment.byId("logFrag", "idMyLogDlg").setTitle("Change History for PO: " + sPoNumber);

                    _oLogDialog.open();
                };

                var oDialogController = {
                    onCloseLogDialog: function () {
                        if (_oLogDialog) {
                            _oLogDialog.close();
                        }
                    }
                };

                if (!_oLogDialog) {
                    sap.ui.core.Fragment.load({
                        id: "logFrag",
                        name: "capstone.ext.fragment.LogDialog",
                        controller: oDialogController
                    }).then(function (oDialog) {
                        _oLogDialog = oDialog;
                        _oLogDialog.setModel(oModel);
                        fnLoadAndOpen();
                    });
                } else {
                    fnLoadAndOpen();
                }

            } catch (e) {
                sap.m.MessageBox.error("JS Error: " + e.message);
            }
        },

        onCloseLogDialog: function () {
            if (_oLogDialog) {
                _oLogDialog.close();
            }
        },

        onViewDeletedLogs: function (oEvent) {
            try {
                var oModel = this.getModel();

                var fnLoadAndOpen = function () {
                    var oLogTable = sap.ui.core.Fragment.byId("deletedLogFrag", "deletedLogTable");

                    if (!_oDeletedLogTemplate) {
                        var oBindingInfo = oLogTable.getBindingInfo("items");
                        if (oBindingInfo) {
                            _oDeletedLogTemplate = oBindingInfo.template;
                        }
                    }

                    oLogTable.unbindItems();

                    var aFilters = [
                        new Filter({
                            filters: [
                                new Filter("NewValue", FilterOperator.EQ, "DELETED"),
                                new Filter("FieldName", FilterOperator.EQ, "PO_HEADER"),
                                new Filter("PoNumber", FilterOperator.NE, "")
                            ],
                            and: true
                        })
                    ];

                    var oSorter = new Sorter("ChangedAt", true);

                    oLogTable.bindItems({
                        path: "/PoChangeLog",
                        template: _oDeletedLogTemplate,
                        filters: aFilters,
                        sorter: oSorter
                    });

                    _oDeletedLogDialog.open();
                };

                var oDialogController = {
                    onCloseDeletedLogDialog: function () {
                        if (_oDeletedLogDialog) _oDeletedLogDialog.close();
                    }
                };

                if (!_oDeletedLogDialog) {
                    sap.ui.core.Fragment.load({
                        id: "deletedLogFrag",
                        name: "capstone.ext.fragment.DeletedLogDialog",
                        controller: oDialogController
                    }).then(function (oDialog) {
                        _oDeletedLogDialog = oDialog;
                        _oDeletedLogDialog.setModel(oModel);
                        fnLoadAndOpen();
                    });
                } else {
                    fnLoadAndOpen();
                }

            } catch (e) {
                MessageBox.error("JS Error: " + e.message);
            }
        },

        onNavigateToExternal: function (oEvent) {
            var sUrl = "https://s40lp1.ucc.cit.tum.de/sap/bc/ui2/flp?sap-client=324&sap-language=EN#ZSO_PO_F15400-create";
            URLHelper.redirect(sUrl, true);
        }
    };
});