sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (MessageToast, MessageBox) {
    "use strict";

    return {
        onRequestDeleteItem: function (oBindingContext, aSelectedContexts) {
            var oExtensionAPI = this;
            var aContexts = aSelectedContexts || [];

            try {
                var oEditFlow = oExtensionAPI.getEditFlow();
                var oTargetContext = aContexts[0];

                var oBinding = oTargetContext.getBinding();
                var iTotalItems = oBinding.getCount() || oBinding.getLength(); 

                // Ensure the Purchase Order retains at least one item
                if (aContexts.length >= iTotalItems) {
                   return sap.m.MessageBox.error("A Purchase Order must have at least one item. You cannot delete all items.");
                }
                
                // 1. Retrieve the PoItem number to determine its state
                var sPoItem = oTargetContext.getProperty("PoItem");
                var sActionName = "com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDeleteItem";

                // 2. Logic definition: If PoItem is empty or zero, it is a newly created draft item
                var bIsNewItem = (!sPoItem || sPoItem === "0" );

                // 3. Invoke the requestDeleteItem action
                oEditFlow.invokeAction(sActionName, {
                    contexts: aContexts,
                    label: "Confirm Deletion Item", 
                    // IF bIsNewItem is TRUE -> skipParameterDialog = true (Bypass the reason popup)
                    // IF bIsNewItem is FALSE -> skipParameterDialog = false (Display the reason popup)
                    skipParameterDialog: bIsNewItem 
                }).then(function () {
                    // Display an appropriate success message based on the item type
                    MessageToast.show(bIsNewItem ? "Draft item removed." : "Item deleted successfully!");

                    // Refresh Side Effects to update the table and Header aggregations
                    if (oExtensionAPI.getSideEffects) {
                        oExtensionAPI.getSideEffects().requestSideEffects([{ "$NavigationPropertyPath": "_PoItem" }]);
                    } else {
                        oExtensionAPI.refresh();
                    }

                }).catch(function (err) {
                    var sError = (err.message || "").toLowerCase();
                    
                    // Ignore the error if the user intentionally cancelled the dialog
                    if (sError.indexOf("cancel") !== -1 || sError.indexOf("dialog cancelled") !== -1) {
                        return MessageToast.show("Deletion cancelled.");
                    }
                    
                    MessageBox.error("Backend Error: " + err.message);
                });

            } catch (e) {
                console.error("Fiori V4 logic error:", e);
                MessageBox.error("UI Logic Error: " + e.message);
            }
        }
    };
});