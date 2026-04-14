sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension", 
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/message/Message",    
    "sap/ui/core/library"             
], function (ControllerExtension, MessageToast, MessageBox, Message, coreLibrary) { 
    "use strict";

    var MessageType = coreLibrary.MessageType;
    var ValueState = coreLibrary.ValueState;

    return ControllerExtension.extend("capstone.ext.controller.ObjectPageExt", {
        
        // ==========================================
        // [CUSTOM HELPER] CHECK VALID DATE
        // Placed alongside other functions, outside the override block
        // ==========================================
        _checkValidDate: function (dDeliveryDate) {
            if (!dDeliveryDate) {
                return true; // Skip if empty 
            }

            var dToday = new Date();
            dToday.setHours(0, 0, 0, 0); 
            
            var dSelected = new Date(dDeliveryDate);
            dSelected.setHours(0, 0, 0, 0);

            // Return true if selected date >= today, false if in the past
            return (dSelected >= dToday); 
        },

        // ==========================================
        // 1. FEATURE: PRINT PO (PDF)
        // ==========================================
        onPrintPO: function (oEvent) {
            // ... (Your PDF print code remains here) ...
        },

        // ==========================================
        // 2. FEATURE: DELETE PO FROM OBJECT PAGE
        // ==========================================
        onRequestDelete: function (oContext) {
            try {
                var oExtensionAPI = this;
                
                if (!oContext) {
                    return MessageToast.show("Purchase Order information not found!");
                }

                var oEditFlow = oExtensionAPI.getEditFlow();
                var bIsDraft = oContext.getProperty("IsActiveEntity") === false;

                if (bIsDraft) {
                    oEditFlow.deleteDocument(oContext)
                        .then(function() {
                            MessageToast.show("Draft cancelled successfully!");
                        })
                        .catch(function(err) {
                            MessageBox.error("Error cancelling draft: " + (err.message || ""));
                        });
                } else {
                    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
                        contexts: [oContext],
                        skipParameterDialog: false 
                    }).then(function () {
                        MessageToast.show("Purchase Order deleted successfully!");
                        window.history.back(); 

                    }).catch(function (err) {
                        var sError = (err.message || "").toLowerCase();
                        
                        if (sError.indexOf("cancel") !== -1) {
                            return MessageToast.show("Operation cancelled."); 
                        }
                        
                        if (sError.indexOf("404") !== -1 || 
                            sError.indexOf("not found") !== -1 || 
                            sError.indexOf("does not exist") !== -1 || 
                            sError.indexOf("412") !== -1 || 
                            sError.indexOf("strict") !== -1) {
                            
                            MessageToast.show("Purchase Order deleted successfully!");
                            window.history.back();
                            
                        } else {
                            MessageBox.error("Backend Error: " + err.message);
                        }
                    });
                }
            } catch (e) {
                MessageBox.error("JS Error: " + e.message);
            }
        },

        // ==========================================
        // 3. OVERRIDE: PREVENT SAVING PAST DATES
        // ==========================================
        override: {
            editFlow: {
                onBeforeSave: function () {
                    // 1. Get current data context
                    var oContext = this.getView().getBindingContext();
                    var dDeliveryDate = oContext.getProperty("DeliveryDate");

                    // 2. Inline validation logic
                    if (dDeliveryDate) {
                        var dToday = new Date();
                        dToday.setHours(0, 0, 0, 0); 
                        
                        var dSelected = new Date(dDeliveryDate);
                        dSelected.setHours(0, 0, 0, 0);

                        // Block if the date is in the past
                        if (dSelected < dToday) {
                            MessageBox.error("Delivery date cannot be in the past. Please correct it!");
                            return Promise.reject(); 
                        }
                    }

                    // 3. Proceed to Backend if valid
                    return Promise.resolve();
                }
            }
        }
    });
});