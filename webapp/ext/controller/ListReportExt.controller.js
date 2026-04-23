sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("capstone.ext.controller.ListReportExt", {
        override: {
            onInit: function () {
                var oView = this.getView();
                var sTableId = "capstone::PurchaseOrderList--fe::table::PurchaseOrder::LineItem";
                var oMdcTable = oView.byId(sTableId);

                if (oMdcTable) {
                    oMdcTable.initialized().then(function () {
                        // Access the core Inner Table
                        var oInnerTable = oView.byId(sTableId + "-innerTable");

                        if (oInnerTable) {
                            
                            // 1. Extract the logic into a reusable function
                            var fnUpdateHeader = function () {
                                if (!oInnerTable.getSelectedContexts) return;
                                
                                var iSelectedCount = oInnerTable.getSelectedContexts().length;

                                if (iSelectedCount > 0) {
                                    // Disable the default Fiori total row counter
                                    oMdcTable.setShowRowCount(false);
                                    
                                    // Apply a custom header title showing selection count
                                    oMdcTable.unbindProperty("header");
                                    oMdcTable.setHeader("Selected POs (" + iSelectedCount + ")");
                                } else {
                                    // Re-enable the default row counter when selection is cleared
                                    oMdcTable.setShowRowCount(true);
                                    
                                    // Restore original text
                                    oMdcTable.unbindProperty("header");
                                    oMdcTable.setHeader("Purchase Orders");
                                }
                            };

                            // 2. Attach listener for user clicking checkboxes
                            oInnerTable.attachSelectionChange(fnUpdateHeader);

                            // 3. Attach listener for table refreshing (e.g., after a deletion)
                            if (oInnerTable.attachUpdateFinished) {
                                oInnerTable.attachUpdateFinished(fnUpdateHeader);
                            }
                        }
                    });
                }
            }
        }
    });
});